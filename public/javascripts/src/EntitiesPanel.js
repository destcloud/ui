//
// Entities Panel
//

DC.EntitiesPanel = function() {

    this.polling_count = 0;

    this.subtopology_has_sent = false;

    this.entity_name_regex = new RegExp(/[0-9a-zA-z-_\s]/g);

    this.init();
};

DC.EntitiesPanel.prototype = {
    
    constructor: DC.EntitiesPanel,

    init: function() {

	var self = this;

	// Entities Panel buttons
	$('#add-entity-btn').button({
	    text: false,
	    icons: { primary: "ui-icon-plus", secondary: null },
	}).on('click', function() {
	    $('#add-entity-dialog').dialog({
		dialogClass: 'no-close',
		width: 400,
		buttons: [
		    {
			text: 'Add',
			click: function() {
			    if ($('#add-entity-dialog .input-error').length > 0) {
				return;
			    }
			    self.addEntity();
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
	    if (self.isValidEntity()) {
		self.enableDialogAddButton();
	    } else {
		self.disableDialogAddButton();
	    }
	});

	$('#add-entity-entity-name').on('change', function(ev) {
	    var val = $('#add-entity-entity-name').val();
	    var match = val.match(self.entity_name_regex);
	    if (!match || match.length != val.length) {
		$('#add-entity-entity-name').addClass("input-error");
	    } else {
		$('#add-entity-entity-name').removeClass("input-error");
	    }
	    if (self.isValidEntity()) {
		self.enableDialogAddButton();
	    } else {
		self.disableDialogAddButton();
	    }
	});

	$('#add-entity-ip4-addr').on('change', function(ev) {
	    if (self.isValidEntity()) {
		self.enableDialogAddButton();
	    } else {
		self.disableDialogAddButton();
	    }
	});

	$('#add-entity-port-number').on('change', function(ev) {
	    if (self.isValidEntity()) {
		self.enableDialogAddButton();
	    } else {
		self.disableDialogAddButton();
	    }
	});

	this.setupButtons();
	this.setupHover();

	$('#send-entities-btn').button({
	    disabled: true,
	    icons: { primary: "ui-icon-arrowreturn-1-n" },
	}).on('click', function() {
	    self.sendEntities();
	});
	$('#clear-entities-btn').button({
	}).on('click', function() {
	    self.clearEntities();
	});

	$('#subtopology-mode-toggle').button({
	    disabled: true,
	})
	.on('click', function() {
	    DC.topologyPanel.toggleSubTopologyMode();
	});

	$('#send-subtopology-btn').button({
	    disabled: true,
	    icons: { primary: "ui-icon-arrowreturn-1-n" },
	}).on('click', function() {
	    self.sendSubTopology();
	});

/*
	$('#clear-subtopology-btn').button({
	    disabled: true,
	}).on('click', function() {
	    self.clearSubTopology();
	});
*/

	this.getEntities();
    },

    enableDialogAddButton: function() {
	var pane = $('#add-entity-dialog').siblings('.ui-dialog-buttonpane');
	$(pane[0]).find('button:contains("Add")').button('enable');
    },

    disableDialogAddButton: function() {
	var pane = $('#add-entity-dialog').siblings('.ui-dialog-buttonpane');
	$(pane[0]).find('button:contains("Add")').button('disable');
    },

    isValidEntity: function() {

	if ($('#add-entity-entity-name').hasClass("input-error")
	    || !($('#add-entity-ip4-addr').val())
	    || !($('#add-entity-port-number').val())) {
	    return false;
	} else {
	    return true;
	}
    },

    addEntity: function() {

	console.log("== EntitiesPanel: addEntity");

	var ip_address = $('#add-entity-ip4-addr').val().trim();

	if (!this.addressIsUnique(ip_address)) {
	    DC.showErrorDialog('Entity', 'IP_address [' + ip_address + '] already used');
	    return;
	}

	var entity_name = $('#add-entity-entity-name').val().trim();
	var port_number = Number($('#add-entity-port-number').val());
	var protocol = $('#add-entity-protocol').val().trim();
	var network_os = $('#add-entity-network-os').val().trim();
	var username = $('#add-entity-username').val().trim();
	var password = $('#add-entity-password').val().trim();

	// TODO: validation

	var add_row = $('#entities-add-row');
	var row = DC.EntitiesPanel.entityTemplate
		    .replace('TMP_ENTITY_NAME', entity_name)
		    .replace('TMP_IP_ADDRESS', ip_address)
		    .replace('TMP_PORT', port_number)
		    .replace('TMP_PROTOCOL', protocol)
		    .replace('TMP_OS', network_os)
		    .replace('TMP_USER', username)
		    .replace('TMP_PASSWORD', password);

	add_row.before(row);
	this.setupButtons();
	this.setupHover();

	this.sendEntitiesBtnStatus();

	var obj = {};
	obj.entity_name = entity_name;
	obj.IP_address = ip_address;
	obj.port_number = Number(port_number);
	obj.protocol = protocol;
	obj.network_os = network_os;
	obj.username = username;
	obj.password = password;
	var array = [];
	array.push(obj);
	this.sendEntity(array);

    },

    addressIsUnique: function(ip_address) {

	var addrs = $('#entities-table .IP_address')
			.map(function() {
			    return $.trim($(this).text());
			}).get();

	return (addrs.indexOf(ip_address) >= 0) ? false : true;
    },

    addEntityJson: function(json) {

	console.log("== EntitiesPanel: addEntityJson");

	var add_row = $('#entities-add-row');
	var row = DC.EntitiesPanel.entityTemplate
		    .replace('TMP_ENTITY_NAME', json.entity_name)
		    .replace('TMP_IP_ADDRESS', json.IP_address)
		    .replace('TMP_PORT', json.port_number)
		    .replace('TMP_PROTOCOL', json.protocol)
		    .replace('TMP_OS', json.network_os)
		    .replace('TMP_USER', json.username)
		    .replace('TMP_PASSWORD', json.password);

	add_row.before(row);
	this.setupButtons();
	this.setupHover();

	this.sendEntitiesBtnStatus();
    },

    clearEntities: function() {

	DC.topologyPanel.clear();
//	$('#entities-table tbody .entities-data').remove();
	this.sendEntitiesBtnStatus();
	DC.enableBtn('#add-entity-btn');
    },

    sendEntitiesBtnStatus: function() {

	if ($('.entities-data').length == 0) {
	    DC.disableBtn('#send-entities-btn');
	} else {
	    DC.enableBtn('#send-entities-btn');
	}
    },

    getEntities: function() {

	console.log("== EntitiesPanel: getEntities");

	var self = this;

	// NOTE: NOT async ajax
	$.ajax({
	    method: 'GET',
	    async: false,
	    url: '/entity/',
	    dataType: 'json',
	    success: function(data) {
		console.log("  success: data len = " + data.length);
		$.each(data, function(i, entity) {
		    self.addEntityJson(entity);
		});
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.error("EntitesPanel.getEntities error: " + errorThrown);
		DC.growl(DC.growl.statusClass.error, 'The request "GET entity" failed. ' + errorThrown);
	    },
	});
    
    },

    sendEntities: function() {

	this.clearEntities();

	$.blockUI(DC.C.config.block_css);

	var self = this;
	var data = this.createEntitiesJson();
	if (!data) {
	    $.unblockUI();
	    DC.showWarningDialog('Entities', 'selected entities is 0.');
	    return;
	}
	console.log("== entities data");
	console.log(data);

	$.ajax({
	    method: 'POST',
	    url: '/entities',
	    cache: false,
	    contentType: 'application/json',
	    processData: false,
	    data: data,
	    success: function(data) {
		self.pollingTopology();
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("POST /entities error: " + jqXHR.responseText);
		$.unblockUI();
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	    timeout: DC.C.config.timeout.ajax,
	});
    },

    sendEntity: function(data) {

	var json = JSON.stringify(data);

	$.ajax({
	    method: 'POST',
	    url: '/entity',
	    cache: false,
	    contentType: 'application/json',
	    processData: false,
	    data: json,
	    success: function(data) {
		DC.growl(DC.growl.statusClass.success, 'The request "POST entity" was successful."');
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("POST /entity error: " + jqXHR.responseText);
		$.unblockUI();
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	    timeout: DC.C.config.timeout.ajax,
	});
    },

    deleteEntity: function(tr) {

	var obj = {};
	obj.entity_name = $(tr).find('.entity_name').text();
	obj.IP_address = $(tr).find('.IP_address').text();
	obj.port_number = Number($(tr).find('.port_number').text());
	obj.protocol = $(tr).find('.protocol').text();
	obj.network_os = $(tr).find('.network_os').text();
	obj.username = $(tr).find('.username').text();
	obj.password = $(tr).find('.password').text();

	var json = JSON.stringify(obj);

	$.ajax({
	    method: 'DELETE',
	    url: '/entity',
	    cache: false,
	    contentType: 'application/json',
	    processData: false,
	    data: json,
	    success: function(data) {
		DC.growl(DC.growl.statusClass.success, 'The request "DELETE entity" was successful."');
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("DELETE /entity error: " + jqXHR.responseText);
		$.unblockUI();
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	    timeout: DC.C.config.timeout.ajax,
	});
    },

    pollingTopology: function() {

	var self = this;
	this.polling_count++;

	setTimeout(function() {
	    $.ajax({
		method: 'GET',
		url: '/entities',
		dataType: 'json',
		success: function(data) {
		    if (data.status === DC.Config.ENTITIES.status.processing) {
			if (self.polling_count < DC.C.config.entities.polling.timeout_count) {
			    self.pollingTopology();
			} else {
			    console.log("polling Topology timeout: " + self.polling_count);
			    DC.showErrorDialog('GET /entities', 'polling topology timeout');
			}
		    } else if (data.status === DC.Config.ENTITIES.status.available) {
			console.log('topology available');
			$.unblockUI();
			self.polling_count = 0;
			self.getTopology();
		    
		    } else if (data.status == DC.Config.ENTITIES.status.timeout) {
			$.unblockUI();
			self.polling_count = 0;
			DC.showErrorDialog(errorThrown, jqXHR);
		    }
		},
		error: function(jqXHR, textStatus, errorThrown) {
		    $.unblockUI();
		    DC.showErrorDialog(errorThrown, jqXHR);
		},
	    });
	}, DC.C.config.entities.polling.period);
    },

    getTopology: function() {

	var self = this;

	$.ajax({
	    method: 'GET',
	    url: '/topology',
	    dataType: 'json',
	    success: function(data) {
		DC.growl(DC.growl.statusClass.success, 'The request "GET topology" was successful."');
		DC.topologyPanel.create(data);
//		DC.disableBtn('#send-entities-btn');
//		DC.disableBtn('.delete-entity-btn');
//		DC.disableBtn('#add-entity-btn');
		DC.enableBtn('#subtopology-mode-toggle');
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	});
    },

    sendSubTopology: function() {

	console.log("== sendSubTopology");

	$.blockUI(DC.C.config.block_css);

	var self = this;
	var data = this.createSubTopologyJson();

	this.subtopology_has_sent = true;

	$.ajax({
	    method: 'POST',
	    url: '/sub_topology',
	    dataType: 'json',
	    cache: false,
	    contentType: 'application/json',
	    processData: false,
	    data: data,
	    success: function(data) {
		DC.topologyPanel.topology.sub_topology_id = data.sub_topology_ID;
		$('#sub-topology-id').text(data.sub_topology_ID);
		DC.logPanel.history.addSubTopology(
			    DC.topologyPanel.topology.entire_topology_id,
			    data.sub_topology_ID);
		DC.scenarioPanel.scenario_list.getScenarioFromDB(data.sub_topology_ID);
		$.unblockUI();
		DC.growl(DC.growl.statusClass.success, 'The request "POST subtopology" was successful.');
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("POST /sub_subtopology error: " + textStatus + ", " + errorThrown);
		$.unblockUI();
		DC.showErrorDialog(errorThrown, jqXHR);
	    },
	    complete: function(jqXHR, textStatus) {
	    },
	    timeout: DC.C.config.timeout.ajax,
	});

	DC.topologyPanel.disableSubTopologyMode();
	$('#subtopology-mode-toggle').prop('checked', false);
	$('#subtopology-mode-toggle').button('refresh');

	DC.disableBtn('#send-subtopology-btn');
	DC.enableBtn('#scenario-mode-toggle');

	// update topology
	DC.topologyPanel.topology.update();



    },

    setupButtons: function() {

	var self = this;
	$('.delete-entity-btn').button({
	    text: false,
	    icons: {primary: "ui-icon-trash", secondary: null },
	}).on('click', function() {
	    var tr = $(this).parents('tr');
	    self.deleteEntity(tr);
	    $(tr).remove();
	    self.sendEntitiesBtnStatus();
	});
    },

    setupHover: function() {

	$('#entities-table tbody .entities-data').hover(
	    function() {
		$(this).addClass('entities-hv');
	    },
	    function() {
		$(this).removeClass('entities-hv');
	    }
	).off('click').on('click', function() {
	    var ip = $(this).find('input[type="checkbox"]');
	    ip.prop('checked', !ip.prop('checked'));
	    if (ip.prop('checked')) {
		$(this).addClass('se-selected');
	    } else {
		$(this).removeClass('se-selected');
	    }
	});

	$('.entity-sending').off('click').on('click', function(ev) {
	    ev.stopPropagation();
	});
    },

    createEntitiesJson: function() {

	var jsonObj = [];

	var data_rows = $('.entities-data');
	$.each(data_rows, function() {
	    var setting = $(this).find('input[type="checkbox"]').filter(':checked').length;
	    if (setting) {
		var data = $(this).find('td');
		var obj = {};
		$.each(data, function() {
		    var classname = $(this).attr('class');
		    if (classname) {
			obj[classname] = $(this).text().trim();
		    }
		});
		jsonObj.push(obj);
	    }
	});

	if (jsonObj.length == 0) {
	    return null;
	} else {
	    return JSON.stringify(jsonObj);
	}
    },

    createSubTopologyJson: function() {

	var jsonObj = [];

	jsonObj.push({ 'entire_topology_ID': DC.topologyPanel.topology.entire_topology_id });

	var ids = { IDs: [] };
	var enableTopologyArray = DC.topologyPanel.topology.getEnableTopologyArray();
	$.each(enableTopologyArray, function(i, id) {

	    var obj = {};
	    obj['ID'] = id;
	    ids.IDs.push(obj);
	});

	jsonObj.push(ids);

	return JSON.stringify(jsonObj);
    },
};


/*
 * NOTE: These class names are the key name of Entity YAML.
 */
DC.EntitiesPanel.entityTemplate = ' \
    <tr class="entities-data se-selected"> \
	<td><input type="checkbox" class="entity-sending" checked="checked" style="display:none;"/> \
	<td class="entity_name">TMP_ENTITY_NAME</td> \
	<td class="IP_address">TMP_IP_ADDRESS</td> \
	<td class="port_number">TMP_PORT</td> \
	<td class="protocol">TMP_PROTOCOL</td> \
	<td class="network_os">TMP_OS</td> \
	<td class="username">TMP_USER</td> \
	<td class="password">TMP_PASSWORD</td> \
	<td><button class="delete-entity-btn">DEL</td> \
    </tr> \
';
