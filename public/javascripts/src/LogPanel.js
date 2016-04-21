//
// Log Panel
//

DC.LogPanel = function() {

    this.destcloud_only = true;

    this.auto_update = false;

    this.auto_update_period = DC.C.config.auto_update_period;

    this.timeout_id = undefined;

    this.history = new DC.UuidHistory();

    this.log_table = undefined;

    this.last_log_date = undefined;

    this.init();
};

DC.LogPanel.prototype = {
    
    constructor: DC.LogPanel,

    init: function() {

	var self = this;

	this.log_table = $('#log-table').DataTable({
	    scrollY: '200px',
	    scrollCollapse: true,
	    paging: false,
	    info: true,
	    columns: [
		{ width: "110px" },
		{ width: "80px" },
		{ width: "120px" },
		null
	    ],
	});

	$('#destcloud-only-toggle').button()
	    .attr('checked', this.destcloud_only)
	    .button('refresh')
	    .on('click', function() {
		self.toggleDestCloudOnly();
	    });

	$('#auto-update-toggle').button()
	    .attr('checked', this.auto_update)
	    .button('refresh')
	    .on('click', function() {
		self.toggleAutoUpdate();
	    });

	$('#auto-update-period').on('change', function() {
	    self.auto_update_period = $('#auto-update-period').val();
	    console.log("auto_update_period: changed: " + self.auto_update_period);
	});
/*
	$('#auto-update-period').selectmenu(
{
	    change: function(ev, ui) {
		self.auto_update_period = $('#auto-update-period').val();
		console.log("auto_update_period: changed: " + self.auto_update_period);
	    }
	}
);
*/

	$('#log-start-time-picker').datetimepicker({
	    dateFormat: 'yy/mm/dd',
	    timeFormat: 'HH:mm:ss',
	    controlType: 'select',
	    oneLine: true,
	    showOn: "button",
	    buttonImage: 'images/calendar.png',
	    buttonImageOnly: true,
	    buttonText: "Select date",
	    onSelect: function(selectedDateTime) {
	    },
	    afterInject: function(input, picker) {
		// date clear button
		var pane = $('#ui-datepicker-div .ui-datepicker-buttonpane');
		if ($(pane).children('button').length == 3) return;
		$(pane).append('<button class="ui-state-default ui-priority-secondary ui-corner-all ui-datepicker-clear">Clear</button>');
		$('.ui-datepicker-clear').on('click', function() {
		    $('#log-start-time-picker').val('');
		});
	    },
	});

	$('#log-end-time-picker').datetimepicker({
	    dateFormat: 'yy/mm/dd',
	    timeFormat: 'HH:mm:ss',
	    controlType: 'select',
	    oneLine: true,
	    showOn: "button",
	    buttonImage: 'images/calendar.png',
	    buttonImageOnly: true,
	    buttonText: "Select date",
	    onSelect: function(selectedDateTime) {
	    },
	    afterInject: function(input, picker) {
		// date clear button
		var pane = $('#ui-datepicker-div .ui-datepicker-buttonpane');
		if ($(pane).children('button').length == 3) return;
		$(pane).append('<button class="ui-state-default ui-priority-secondary ui-corner-all ui-datepicker-clear">Clear</button>');
		$('.ui-datepicker-clear').on('click', function() {
		    $('#log-end-time-picker').val('');
		});
	    },
	});


	$('#log-entire-topology-id').selectmenu();
	$('#log-subtopology-id').selectmenu();
	$('#log-scenario-id').selectmenu();
	$('#log-job-id').selectmenu();
	$('#log-fault-id').selectmenu();
	$('#log-nodes-id').selectmenu();
	$('#log-lines-id').selectmenu();

	$('#search-radio').buttonset();

	$('#search-uuids-btn').on('click', function() {
	    if ($('#search-uuids-btn').prop('checked')) {
		self.searchUuids();
	    }
	});
	$('#search-time-btn').on('click', function() {
	    if ($('#search-time-btn').prop('checked')) {
		self.searchTime();
	    }
	});
	$('#search-text-btn').on('click', function() {
	    if ($('#search-text-btn').prop('checked')) {
		self.searchText();
	    }
	});
	$('#search-all-btn').button().on('click', function() {
	    $('#search-uuids-btn').prop('checked', false);
	    $('#search-time-btn').prop('checked', false);
	    $('#search-text-btn').prop('checked', false);
	    $('#search-radio').buttonset('refresh');
	    $.blockUI(DC.C.config.block_css);
	    self.getLog(0);
	});


	// TODO: set height

	// TODO: get logs
	this.start();
	
    },

    setCurrentUuids: function(selected_entt_id) {


	if (this.history.all.length == 0) return;

	this.setEntireIdMenu(selected_entt_id);

	this.history.sendHistory();
    },

    setUuids: function() {


	if (this.history.all.length == 0) return;

	this.setEntireIdMenu(this.history.all[0].entire);
    },

    setEntireIdMenu: function(selected_entt_id) {

	$('#log-entire-topology-id').empty();
	// NOTE: workaround for jquery-ui 1.11.X bug #10662
	$('#log-entire-topology-id').selectmenu('destroy').selectmenu();

	var entires = this.history.getEntires();
	if (!entires || entires.length == 0) return;

	var entry = this._createSelectOptions(
				entires,
			       	'entire',
			       	selected_entt_id);
		
	if (entry) {
	    $('#log-entire-topology-id').append($(entry));
	    $('#log-entire-topology-id').selectmenu('refresh');
	    var self = this;
	    $('#log-entire-topology-id').on('selectmenuchange', function(ev, ui) {
		self.setSubTopologyIdMenu(ui.item.value);
		self.setEntityIdMenu(ui.item.value);
		self.setLineIdMenu(ui.item.value);
	    });
	    this.setSubTopologyIdMenu(selected_entt_id);
	    this.setEntityIdMenu(selected_entt_id);
	    this.setLineIdMenu(selected_entt_id);
	}
    },

    setSubTopologyIdMenu: function(entt_id) {

	$('#log-subtopology-id').empty();
	// NOTE: workaround for jquery-ui 1.11.X bug #10662
	$('#log-subtopology-id').selectmenu('destroy').selectmenu();

	var subts = this.history.getSubTopologies(entt_id);
	if (!subts || subts.length == 0) return;

	var current_subt_id = null;
	if (this.history.all[0].subts.length > 0) {
	    current_subt_id = this.history.all[0].subts[0].subt;
	}
	if (DC.topologyPanel.topology) {
	    current_subt_id = DC.topologyPanel.topology.sub_topology_id;
	}
	var entry = this._createSelectOptions(
				subts,
				'subt',
				current_subt_id);
	if (entry) {
	    if ($(entry).filter(':selected').length == 0) {
		$($(entry)[0]).prop('selected', true);
		current_subt_id = $(entry)[0].value;
	    }
	    $('#log-subtopology-id').append($(entry));
	    $('#log-subtopology-id').selectmenu('refresh');
	    var self = this;
	    $('#log-subtopology-id').on('selectmenuchange', function(ev, ui) {
		self.setScenarioIdMenu(entt_id, ui.item.value);
	    });
	}
	this.setScenarioIdMenu(entt_id, current_subt_id);
    },

    setScenarioIdMenu: function(entt_id, subt_id) {

	$('#log-scenario-id').empty();
	// NOTE: workaround for jquery-ui 1.11.X bug #10662
	$('#log-scenario-id').selectmenu('destroy').selectmenu();

	var scenarios = this.history.getScenarios(entt_id, subt_id);
	if (!scenarios || scenarios.length == 0) return;

	var current_scenario_id = $('#scenario-table-scenario-id').text();
	var entry = this._createSelectOptions(
				scenarios,
				'scenario',
				current_scenario_id);
	if (entry) {
	    if ($(entry).filter(':selected').length == 0) {
		$($(entry)[0]).prop('selected', true);
		current_scenario_id = $(entry)[0].value;
	    }
	    $('#log-scenario-id').append($(entry));
	    $('#log-scenario-id').selectmenu('refresh');
	    var self = this;
	    $('#log-scenario-id').on('selectmenuchange', function(ev, ui) {
		self.setJobIdMenu(entt_id, subt_id, ui.item.value);
		self.setFaultIdMenu(entt_id, subt_id, ui.item.value);
	    });
	}
	this.setJobIdMenu(entt_id, subt_id, current_scenario_id);
	this.setFaultIdMenu(entt_id, subt_id, current_scenario_id);
    },

    setJobIdMenu: function(entt_id, subt_id, scenario_id) {

	$('#log-job-id').empty();
	// NOTE: workaround for jquery-ui 1.11.X bug #10662
	$('#log-job-id').selectmenu('destroy').selectmenu();

	var jobs = this.history.getJobs(entt_id, subt_id, scenario_id);
	if (!jobs) return;

	var current_job_id = $('#running-job-id').text();
	var entry = this._createSelectOptions(
				jobs,
				'',
				current_job_id);
	if (entry) {
	    if ($(entry).filter(':selected').length == 0) {
		$($(entry)[0]).prop('selected', true);
	    }
	    $('#log-job-id').append($(entry));
	    $('#log-job-id').selectmenu('refresh');
	    $('#log-job-id').on('selectmenuchange', function(ev, ui) {
		// nothig to do
	    });
	}
    },

    setFaultIdMenu: function(entt_id, subt_id, scenario_id) {

	$('#log-fault-id').empty();
	// NOTE: workaround for jquery-ui 1.11.X bug #10662
	$('#log-fault-id').selectmenu('destroy').selectmenu();

	var faults = this.history.getFaults(entt_id, subt_id, scenario_id);
	var entry = this._createSelectOptions(
				faults,
				'',
				'');
	if (entry) {
	    if ($(entry).filter(':selected').length == 0) {
		$($(entry)[0]).prop('selected', true);
	    }
	    $('#log-fault-id').append($(entry));
	    $('#log-fault-id').selectmenu('refresh');
	    $('#log-fault-id').on('selectmenuchange', function(ev, ui) {
		// nothig to do
	    });
	}
    },

    setEntityIdMenu: function(entt_id) {

	$('#log-nodes-id').empty();
	// NOTE: workaround for jquery-ui 1.11.X bug #10662
	$('#log-nodes-id').selectmenu('destroy').selectmenu();

	var nodes = this.history.getNodes(entt_id);
	var entry = this._createSelectOptions(
				nodes,
				'',
				'');
	if (entry) {
	    if ($(entry).filter(':selected').length == 0) {
		$($(entry)[0]).prop('selected', true);
	    }
	    $('#log-nodes-id').append($(entry));
	    $('#log-nodes-id').selectmenu('refresh');
	    $('#log-nodes-id').on('selectmenuchange', function(ev, ui) {
		// nothig to do
	    });
	}
    },

    setLineIdMenu: function(entt_id) {

	$('#log-lines-id').empty();
	// NOTE: workaround for jquery-ui 1.11.X bug #10662
	$('#log-lines-id').selectmenu('destroy').selectmenu();

	var lines = this.history.getLines(entt_id);
	var entry = this._createSelectOptions(
				lines,
				'',
				'');
	if (entry) {
	    if ($(entry).filter(':selected').length == 0) {
		$($(entry)[0]).prop('selected', true);
	    }
	    $('#log-lines-id').append($(entry));
	    $('#log-lines-id').selectmenu('refresh');
	    $('#log-lines-id').on('selectmenuchange', function(ev, ui) {
		// nothing to do
	    });
	}
    },

    _createSelectOptions: function(items, key, selected_value) {

	if (!items || items.length < 1) {
	    return null;
	}

	var entry = "";
	if (typeof items[0] == 'string') {
	    items.forEach(function(v, i) {
		if (v == selected_value) {
		    entry += DC.LogPanel.optionTemplate
				.replace(/ITEM/g, v)
				.replace('SELECTED', 'selected');
		} else {
		    entry += DC.LogPanel.optionTemplate
				.replace(/ITEM/g, v)
				.replace('SELECTED', '');
		}
	    });
	} else {
	    items.forEach(function(v, i) {
		if (v && v[key] == selected_value) {
		    entry += DC.LogPanel.optionTemplate
				.replace(/ITEM/g, v[key])
				.replace('SELECTED', 'selected');
		} else {
		    entry += DC.LogPanel.optionTemplate
				.replace(/ITEM/g, v[key])
				.replace('SELECTED', '');
		}
	    });
	}

	return entry;
    },

    toggleDestCloudOnly: function() {

	this.destcloud_only = !this.destcloud_only;

	$.blockUI(DC.C.config.block_css);
	this.getLog(0);
    },

    toggleAutoUpdate: function() {

	this.auto_update = !this.auto_update;

	if (this.auto_update) {
	    this.next();
	} else {
	    clearTimeout(this.timeout_id);
	    this.timeout_id = undefined;
	}
    },

    searchUuids: function() {

	$.blockUI(DC.C.config.block_css);

	this.log_table.clear();

	var self = this;
	var searchObj = {};
	searchObj.destcloud = this.destcloud_only;

	searchObj.uuids = [];
	searchObj.uuids.push($('#log-entire-topology-id').val());
	searchObj.uuids.push($('#log-subtopology-id').val());
	searchObj.uuids.push($('#log-scenario-id').val());
	searchObj.uuids.push($('#log-job-id').val());
	searchObj.uuids.push($('#log-fault-id').val());
	searchObj.uuids.push($('#log-nodes-id').val());
	searchObj.uuids.push($('#log-lines-id').val());

	$.ajax({
	    method: 'GET',
	    url: '/search/',
	    data: searchObj,
	    dataType: 'json',
	    success: function(data) {
		console.log("searchUuids result");
		$.unblockUI();
		self.addTable(data);
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		$.unblockUI();
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	});
    },

    searchTime: function() {

	$.blockUI(DC.C.config.block_css);

	this.log_table.clear();

	var self = this;
	var searchObj = {};
	searchObj.destcloud = this.destcloud_only;
	searchObj.start_time = new Date($('#log-start-time-picker').val()).getTime();
	searchObj.end_time = new Date($('#log-end-time-picker').val()).getTime();
	$.ajax({
	    method: 'GET',
	    url: '/search/',
	    data: searchObj,
	    dataType: 'json',
	    success: function(data) {
		console.log("searchTime result");
		$.unblockUI();
		self.addTable(data);
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		$.unblockUI();
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	});
    },

    searchText: function() {

// TODO: set last_log_date

	$.blockUI(DC.C.config.block_css);

	this.log_table.clear();

	var self = this;
	var searchObj = {};
	searchObj.destcloud = this.destcloud_only;
	searchObj.text = $('#log-any').val();
	$.ajax({
	    method: 'GET',
	    url: '/search/',
	    data: searchObj,
	    dataType: 'json',
	    success: function(data) {
		console.log("searchText result");
		$.unblockUI();
		self.addTable(data);
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		$.unblockUI();
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	});
    },

    start: function() {

	this.getLog(0);
    },

    next: function() {

	if (!this.auto_update) return;

	if (!this.last_log_date) return;

	var self = this;

	this.timeout_id = setTimeout(function() {
	    self.getLog(self.last_log_date);
	}, self.auto_update_period * 1000);
    },

    getLog: function(time) {

	console.log("time = " + time);

	if (time == 0) {
	    this.log_table.clear();
	}

	var self = this;
	var searchObj = {};
	searchObj.time = time;
	searchObj.destcloud = this.destcloud_only;

	$.ajax({
	    method: 'GET',
	    url: '/logs/',
	    data: searchObj,
	    dataType: 'json',
	    success: function(data) {
		$.unblockUI();
		if (!data.length == 0) {
		    self.last_log_date = data[data.length - 1].time;
		    console.log("last_log_date: " + new Date(self.last_log_date));
		    self.addTable(data);
		}
		self.next();
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		$.unblockUI();
		self.auto_update = false;
		clearTimeout(this.timeout_id);
		this.timeout_id = undefined;
		$('#auto-update-toggle').button()
		    .attr('checked', this.auto_update)
		    .button('refresh');
		DC.growl(DC.growl.statusClass.error, 'The request "GET logs" failed. ' + errorThrown);
	    },
	    complete: function() {
	    },
	});

    },

    addTable: function(logs) {

	var self = this;

	if (self.log_table.rows().count() >= DC.C.config.max_logs) {
	    var len = self.log_table.rows().count() - DC.C.config.max_logs;
	    var add_data_len = logs.length;
	    var remove_len = len + add_data_len;
	    var index = [];
	    for (var i = 0; i < remove_len; i++) {
		index.push(i);
	    }
	    self.log_table.rows(index).remove().draw();
	}

	$.each(logs, function(index, log) {
	    if (self.matchFilter(log)) {

		var d = new Date(log.time).toLocaleString();
		var entry = DC.LogPanel.template
				.replace('DATE', d)
				.replace('IDENT', log.ident)
				.replace('HOST', log.host)
				.replace('MSG', log.message);
		self.log_table.row.add($(entry));
	    }
    
	});
	this.log_table.draw();
	this.scrollEnd();
    },

    matchFilter: function(log) {

	var ret = true;
	if ($('#search-time-btn').prop('checked')) {
	    var start_date = $('#log-start-time-picker').val();
	    var end_date = $('#log-end-time-picker').val();
	    if (start_date) {
		var start_time = new Date(start_date);
		if (log.time < start_time) ret = false;
	    }
	    if (end_date) {
		var end_time = new Date(end_date);
		if (log.time > end_time) ret = false;
	    }
	} else if ($('#search-uuids-btn').prop('checked')) {

	    var v1 = $('#log-entire-topology-id').val() || "";
	    var v2 = $('#log-subtopology-id').val() || "";
	    var v3 = $('#log-scenario-id').val() || "";
	    var v4 = $('#log-job-id').val() || "";
	    var v5 = $('#log-fault-id').val() || "";
	    var v6 = $('#log-nodes-id').val() || "";
	    var v7 = $('#log-lines-id').val() || "";
	    var regex = new RegExp('('
				    + v1 + '|'
				    + v2 + '|'
				    + v3 + '|'
				    + v4 + '|'
				    + v5 + '|'
				    + v6 + '|'
				    + v7 + ')');
	    if (!log.message.match(regex)) {
		ret = false;
	    }

	} else if ($('#search-text-btn').prop('checked')) {

	    var text = $('#log-any').val() || "";
	    var regex = new RegExp(text);
	    if (!log.message.match(regex)) {
		ret = false;
	    }
	}
	return ret;
    },

    scrollEnd: function() {
    
	$('#log-box .dataTables_scrollBody').scrollTop(9999999);
    },

};

DC.LogPanel.template = ' \
    <tr> \
	<td>DATE</td> \
	<td>IDENT</td> \
	<td>HOST</td> \
	<td>MSG</td> \
    </tr> \
';

DC.LogPanel.optionTemplate = ' \
    <option value="ITEM" SELECTED>ITEM</option> \
';
