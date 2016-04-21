//
// Scenario Panel
//

DC.ScenarioPanel = function() {

    this.scenario_job_id = undefined;

    this.faults = {};	// endpoint.id, [fault,..]

    this.scenario_list = undefined;

    this.scenario_table = undefined;

    this.reload_timer_id = undefined;

    this.init();
};

DC.ScenarioPanel.prototype = {
    
    constructor: DC.ScenarioPanel,

    init: function() {

	var self = this;

	$('#scenario-start-time-picker').datetimepicker({
	    dateFormat: 'yy/mm/dd',
	    timeFormat: 'HH:mm:ss',
	    controlType: 'select',
	    oneLine: true,
	    showOn: "button",
	    buttonImage: 'images/calendar.png',
	    buttonImageOnly: true,
	    buttonText: "Select date",
	    onSelect: function(selectedDateTime) {
		self.updateStartEndTime($('#scenario-end-time').val());
	    },
	    afterInject: function(input, picker) {
		// date clear button
		var pane = $('#ui-datepicker-div .ui-datepicker-buttonpane');
		if ($(pane).children('button').length == 3) return;
		$(pane).append('<button class="ui-state-default ui-priority-secondary ui-corner-all ui-datepicker-clear">Clear</button>');
		$('.ui-datepicker-clear').on('click', function() {
		    $('#scenario-start-time-picker').val('');
		});
	    },
	});

	$('#scenario-end-time').on('change', function(ev) {
	    self.updateStartEndTime($(this).val());
	});

	this.scenario_table = $('#scenario-table').DataTable({
	    scrollY: '150px',
	    scrollCollapse: true,
	    order: [[3, 'asc' ]],
	    paging: false,
	    info: false,
	    searching: false,
	});

	$('#scenario-list-area').draggable();
	$('#scenario-list-toggle').button({
	})
	.on('click', function() {
	    var area = $('#scenario-list-area');
	    if (area.css('display') == 'none') {
		area.slideDown();
		// NOTE: workaround for DataTable in jQuery.tab
		$.fn.dataTable.tables( {visible: true, api: true}).columns.adjust();
	    } else {
		area.slideUp();
	    }
	});

	$('#send-scenario-btn').button({
	    icons: { primary: "ui-icon-arrowreturn-1-n" },
	    disabled: true,
	}).on('click', function() {

	    if (Object.keys(self.faults).length == 0) {
		DC.showWarningDialog('Scenario', 'no scenario');
		return;
	    }

	    var scenario_id = $('#scenario-table-scenario-id').text();
	    if (scenario_id) {
		$('#scenario-id').text(scenario_id);
	    } else {
		$('#scenario-id').text(jsPlumbUtil.uuid().toUpperCase());
	    }

	    // set date to start-time-picker
/*
 * NOTE: default is empty
	    var now = new Date();
	    $('#scenario-start-time-picker').datetimepicker('option', 'minDate', now);
	    $('#scenario-start-time-picker').datetimepicker('setDate', (now));
*/
	    var estimated_end_time = self.estimateEndTime();
	    $('#scenario-end-time').val(estimated_end_time);

	    self.updateStartEndTime(estimated_end_time);


	    $('#send-scenario-dialog').dialog({
		dialogClass: 'no-close',
		width: 430,
		buttons: [
		    {
			text: 'Send',
			click: function() {
			    self.sendScenario();
			    $(this).dialog('close');
			}
		    },
		    {
			text: 'Cancel',
			click: function() {
			    $(this).dialog('close');
			}
		    },
		],
	    });
	});

	$('#scenario-mode-toggle').button({
	    disabled: true,
	})
	.on('click', function() {
	    DC.topologyPanel.toggleScenarioMode();
	});

	$('#clear-scenario-btn').button({
	    disabled: true,
	})
	.on('click', function() {
	    self.clearScenario();
	    $('#clear-scenario-btn').button('disable');
	});

	this.scenario_list = new DC.ScenarioList();

	this.setScenarioTableHover();

    },

    clearScenario: function() {

	// clear scenario table
	$('#scenario-table-scenario-id').text('');
	this.scenario_table.clear().draw();

	// clear running area
	$('#running-status').text('');
	$('#running-scenario-id p').text('');
	$('#running-job-id p').text('');
	$('#running-start-time').text('');
	$('#running-end-time').text('');
	$('#running-fault p').text('');

	DC.topologyPanel.clearFaults();

	this.faults = {};
    },

    replaceScenario: function(scenario) {

	this.clearScenario();

	$('#scenario-table-scenario-id').text(scenario.scenarioID);

	var self = this;
	var fault = null;
	$.each(scenario.scenario, function(i, s) {

	    if (s.fault_ID !== undefined) {
		if (s.fault_type == DC.Fault.type.down) {
		    fault = new DC.Fault(s.fault_type,
			    s.fault_ID,
			    s.time,
			    {
				fault_place: {
				    router_ID: s.fault_place.router_ID,
				    interface_number: s.fault_place.interface_number
				}
			    });
		    fault.endpoint = DC.topologyPanel.getEndpoint(
					s.fault_place.router_ID,
					s.fault_place.interface_number);
		    self.addFault(fault.endpoint.id, fault);
		    self.setEndpointStyleAndTable(fault);

		} else if (s.fault_type == DC.Fault.type.loss) {
		    if (s.loss_ratio == 100) {
			// disconnect
			fault = new DC.Fault(DC.Fault.type.disconnect,
				s.fault_ID,
				s.time,
				{
				    fault_place: s.fault_place,
				    loss_ratio: s.loss_ratio,
				});
		    } else {
			// packet loss
			fault = new DC.Fault(s.fault_type,
				s.fault_ID,
				s.time,
				{
				    fault_place: s.fault_place,
				    loss_ratio: s.loss_ratio,
				});
		    }
		    fault.connection = DC.topologyPanel.getConnection(s.fault_place);
		    self.addFault(fault.connection.id, fault);
		    self.setConnectionStyleAndTable(fault);

		} else if (s.fault_type == DC.Fault.type.shaping) {
		    fault = new DC.Fault(s.fault_type,
			    s.fault_ID,
			    s.time,
			    {
				fault_place: s.fault_place,
				bandwidth: s.bandwidth,
			    });
		    fault.connection = DC.topologyPanel.getConnection(s.fault_place);
		    self.addFault(fault.connection.id, fault);
		    self.setConnectionStyleAndTable(fault);

		} else if (s.fault_type == DC.Fault.type.delay) {
		    fault = new DC.Fault(s.fault_type,
			    s.fault_ID,
			    s.time,
			    {
				fault_place: s.fault_place,
				delay: s.delay,
			    });
		    fault.connection = DC.topologyPanel.getConnection(s.fault_place);
		    self.addFault(fault.connection.id, fault);
		    self.setConnectionStyleAndTable(fault);

		} else if (s.fault_type == DC.Fault.type.recover) {
		    fault = new DC.Fault(s.fault_type,
			    s.fault_ID,
			    s.time,
			    {
				recover_ID: s.recover_ID,
			    });
		    // TODO: endpoint or connection
		}
	    }
	});

	self.setScenarioTableHover();
	$('#clear-scenario-btn').button('enable');
    },

    setEndpointStyleAndTable: function(fault) {

	DC.Topology.setElementStyle(
	    DC.Topology.elementType.endpoint,
	    fault.endpoint,
	    DC.Topology.elementState.scenario_faulted
	);

	var entry = DC.FaultMenu.commonTemplate
		.replace('DISORDER_TYPE',    fault.type)
		.replace('TIME',             fault.time);
	entry += DC.EndpointMenu.portDownTemplate
		.replace('ROUTER_ID', fault.options.fault_place.router_ID)
		.replace('INTERFACE_NUMBER', fault.options.fault_place.interface_number);
	entry = entry.replace(/DISORDER_ID/g, fault.id);
	this.scenario_table.row.add($(entry)).draw();

	entry = $('#tr_' + fault.id);
	// NOTE: remove 'delete button'
	$(entry).find('button').remove();
    },

    setConnectionStyleAndTable: function(fault) {

	DC.Topology.setElementStyle(
	    DC.Topology.elementType.connection,
	    fault.connection,
	    DC.Topology.elementState.scenario_faulted
	);
	DC.Topology.setElementStyle(
	    DC.Topology.elementType.label,
	    fault.connection,
	    DC.Topology.elementState.scenario_faulted
	);

	var entry = DC.FaultMenu.commonTemplate
		.replace('DISORDER_TYPE', fault.type)
		.replace('TIME',          fault.time);
	entry += DC.ConnectionMenu.packetLossTemplate
		.replace('LINE_ID',       fault.options.fault_place)
		.replace('RATIO',         fault.options.loss_ratio);
	entry = entry.replace(/DISORDER_ID/g, fault.id);

	this.scenario_table.row.add($(entry)).draw();

	entry = $('#tr_' + fault.id);
	// NOTE: remove 'delete button'
	$(entry).find('button').remove();
    },

    setScenarioTableHover: function() {

	var self = this;

	$('#scenario-table tbody tr').hover(
	    function() {
		self.onHighlightTopology(this);
	    },
	    function() {
		self.offHighlightTopology(this);
	    }
	);
    },

    addFault: function(endp_id, fault) {

	console.log("== addFault: " + fault.id);

	var fault_list = this.faults[endp_id] || [];
	fault_list.push(fault);

	fault_list.sort(function(a, b){ return a.time - b.time; });

	this.faults[endp_id] = fault_list;
    },

    getFaults: function(id) {

	return this.faults[id];
    },

    getFault: function(fault_id) {

	var fault = undefined;

	$.each(this.faults, function(id, fault_list) {
	    $.each(fault_list, function(i, f) {
		if (f.id == fault_id) {
		    fault = f;
		    return false;
		}
	    });
	});
	return fault;
    },

    removeFault: function(fault_id) {

	console.log("removeFault: " + fault_id);

	var id = fault_id.substr(3);
	var fault = undefined;
	var list = undefined;
	var uuid = undefined;

	for (var endp_id in this.faults) {
	    var fault_list = this.faults[endp_id];
	    for (var i = 0; i < fault_list.length;  i++) {
		if (fault_list[i].id == id) {
		    fault = fault_list.splice(i, 1)[0];
		    list = fault_list;
		    uuid = endp_id;
		    if (fault_list.length == 0) {
			if (fault.endpoint) {
			    DC.Topology.setElementStyle(
				DC.Topology.elementType.endpoint,
				fault.endpoint,
				DC.Topology.elementState.normal
			    );
			} else if (fault.connection) {
			    DC.Topology.setElementStyle(
				DC.Topology.elementType.connection,
				fault.connection,
				DC.Topology.elementState.normal
			    );
			}
		    }
		    break;
		}
	    }
	}
	if (!fault) {
	    console.error("Cannot find fault in faults. id=" + id);
	}

	if (list && list.length == 0) {
	    delete this.faults[uuid];
	}
	return fault;
    },

    sendScenario: function() {

	$.blockUI(DC.C.config.block_css);

	var self = this;
	var scenario_json = this.createScenarioJson();

	var formData = new FormData();
	var start_time = $('#scenario-start-time-picker').val() || 0;
	console.log("  start time = " + Math.floor(new Date(start_time).getTime() / 1000) + " [" + start_time + "]");

	var scenario_id = $('#scenario-id').text();
	DC.logPanel.history.addScenario(
	    DC.topologyPanel.topology.entire_topology_id,
	    DC.topologyPanel.topology.sub_topology_id,
	    scenario_id);

	formData.append('time', start_time);
	formData.append('scenario_ID', scenario_id);
	formData.append('creation_time', new Date().getTime());
	formData.append('scenario', scenario_json);

	$.ajax({
	    method: 'POST',
	    url: '/scenario',
	    cache: false,
	    contentType: false,
	    processData: false,
	    data: formData,
	    success: function(data) {
		self.scenario_job_id = data.job_id;
		console.log("send scenario success: job_id=" + self.scenario_job_id);

		var scenario_id = $('#scenario-id').text();

		DC.logPanel.history.addJob(
		    DC.topologyPanel.topology.entire_topology_id,
		    DC.topologyPanel.topology.sub_topology_id,
		    scenario_id,
		    self.scenario_job_id);
		DC.logPanel.history.addFault(
		    DC.topologyPanel.topology.entire_topology_id,
		    DC.topologyPanel.topology.sub_topology_id,
		    scenario_id,
		    scenario_json);

		$('#running-table').tooltip();

		// TODO: status
		$('#running-status').text('Running');

		$('#running-scenario-id p').text(scenario_id);
		$('#running-scenario-id p').attr('title', scenario_id);
		$('#scenario-table-scenario-id').text(scenario_id);

		$('#running-job-id p').text(self.scenario_job_id);
		$('#running-job-id p').attr('title', self.scenario_job_id);

		var start_time_str = $('#scenario-start-time-picker').val();
		if (start_time_str.length == 0) {
		    start_time_str = 'immediate';
		}
		$('#running-start-time').text(start_time_str);
		var end_time_str = $('#scenario-end-time-str').val();
		if (end_time_str.length == 0) {
		    end_time_str = 'immediate';
		}
		var end_time_relative = Number($('#scenario-end-time').val());
		var end_time = end_time_str + '[' + end_time_relative + ']';
		$('#running-end-time').text(end_time);
    
		var fault_abs = "";
		$.each(self.faults, function(id, fault_list) {
		    $.each(fault_list, function(index, fault) {
			if (fault_abs != '') {
			    fault_abs += ' -> ';
			}
			fault_abs += fault.time + ':' + fault.type;
		    });
		});
		$('#running-fault p').text(fault_abs);
		$('#running-fault p').attr('title', fault_abs);

		$.unblockUI();

		self.setReloadTimer(end_time_str, end_time_relative);

	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("POST /scenario error: " + textStatus + ", " + errorThrown);
		$.unblockUI();
		if (jqXHR.status == 404) {
		    // start time is past
		    DC.showErrorDialog('POST scenario',
			    'start time [' + start_time + '] is past.');
		} else {
		    DC.showErrorDialog(errorThrown, jqXHR);
		}
	    },
	    complete: function(jqXHR, textStatus) {
		DC.scenarioPanel.scenario_list.getScenarioFromDB(DC.topologyPanel.topology.sub_topology_id);
	    },
	    timeout: DC.C.config.timeout.ajax,
	});
    },

    onHighlightTopology: function(tr) {

	var id = $(tr).attr('id');
	if (!id) return;

	id = id.substr(3);
	this.setHighlightTopology(id, true);
    },

    offHighlightTopology: function(tr) {

	var id = $(tr).attr('id');
	if (!id) return;

	id = id.substr(3);
	this.setHighlightTopology(id, false);
    },

    setHighlightTopology: function(fault_id, sw) {

	var fault = this.getFault(fault_id);

	if (!fault) {
	    // TODO: error processing
	    console.error("Cannot find fault: " + fault_id);
	    return;
	}

	if (fault.type == DC.Fault.type.down) {
	    DC.topologyPanel.highlightPort(
				fault.options.fault_place.router_ID,
			       	fault.options.fault_place.interface_number,
			       	sw);
	} else if (fault.type == DC.Fault.type.disconnect) {
	    DC.topologyPanel.highlightLine(
				fault.options.fault_place,
				sw);
	} else if (fault.type == DC.Fault.type.loss) {
	    DC.topologyPanel.highlightLine(
				fault.options.fault_place,
				sw);
	} else if (fault.type == DC.Fault.type.shaping) {
	    DC.topologyPanel.highlightLine(
				fault.options.fault_place,
				sw);
	} else if (fault.type == DC.Fault.type.delay) {
	    DC.topologyPanel.highlightLine(
				fault.options.fault_place,
				sw);
	} else if (fault.type == DC.Fault.type.recover) {
	    this.setHighlightTopology(fault.options.recover_ID, sw);
	}
    },

    createScenarioJson: function() {

	var jsonObj = [];

	jsonObj.push({ 'sub_topology_ID': DC.topologyPanel.topology.sub_topology_id });

	$.each(this.faults, function(id, fault_list) {

	    $.each(fault_list, function(index, fault) {

		var obj = {};
		if (fault.type == DC.Fault.type.disconnect) {
		    obj['fault_type'] = DC.Fault.type.loss;
		} else {
		    obj['fault_type'] = fault.type;
		}
		obj['fault_ID'] = fault.id;
		obj['time'] = fault.time;

		var options = fault.options;
		for (var key in options) {
		    obj[key] = options[key];
		}
		jsonObj.push(obj);
	    });
	});

	jsonObj.push({ 'end_time': Number($('#scenario-end-time').val()) });

	return JSON.stringify(jsonObj);
    },

    updateStartEndTime: function(estimated_end_time) {

	var start_time = $('#scenario-start-time-picker').val();
	if (!start_time) return;

	var start_date = new Date(start_time).getTime();

	var d = new Date(start_date + (estimated_end_time * 1000));
	var end_date = $.datepicker.formatDate('yy/mm/dd', d);
	var end_time = $.datepicker.formatTime('HH:mm:ss', {
	    hour: d.getHours(),
	    minute: d.getMinutes(),
	    second: d.getSeconds(),
	});
	$('#scenario-end-time-str').val(end_date + ' ' + end_time);
    },

    estimateEndTime: function() {

	var list = [];

	$.each(this.faults, function(id, fault_list) {
	    // NOTE: fault_list has been sorted.
	    if (fault_list.length > 0) {
		list.push(fault_list[fault_list.length - 1].time);
	    }
	});

	list.sort(function(a, b){ return a.time - b.time; });

	return list[list.length - 1] + DC.C.config.estimate_end_time_margin;
    },

    setReloadTimer: function(end_time_str, end_time_relative) {

	if (this.reload_timer_id) {
	    clearTimeout(this.reload_timer_id);
	    this.reload_timer_id = undefined;
	}

	var start_time = Date.now();
	var end_time;

	if (end_time_str === 'immediate') {
	    end_time = start_time + end_time_relative;
	} else {
	    end_time = new Date(end_time_str).getTime();
	}

	var time = end_time - start_time;

	console.log("== setReloadTimer: after " + (time / 1000) + ' secs');
	DC.growl(DC.growl.statusClass.info, 'POST /reload will send after ' + (time / 1000) + ' secs');

	this.reload_timer_id = setTimeout(this.sendReload, time);
    },

    sendReload: function() {


	console.log("== sendReload: " + new Date());

	var self = this;
	var data = '{ "exec": true }';

	$.ajax({
	    method: 'POST',
	    url: '/reload',
	    cache: false,
	    contentType: 'application/json',
	    processData: false,
	    data: data,
	    success: function(data) {
		console.log("POST /reload success.");
		$('#running-status').text('reloaded');
		$('#clear-scenario-btn').button('enable');
		DC.growl(DC.growl.statusClass.success, 'The request "POST /reload" was successful.');
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("POST /reload error: " + textStatus + ", " + errorThrown);
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	    complete: function(jqXHR, textStatus) {
		self.reload_time_id = undefined;
	    },
	    timeout: DC.C.config.timeout.ajax,
	});
    },

};


