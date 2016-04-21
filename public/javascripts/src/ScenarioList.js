//
// Scenario List
//

DC.ScenarioList = function() {

    this.scenario_list = [];

    this.scenario_list_table = undefined;

    this.init();
};

DC.ScenarioList.prototype = {
    
    constructor: DC.ScenarioList,

    init: function() {

	var self = this;

	this.scenario_list_table = $('#scenario-list').DataTable({
	    scrollY: '150px',
	    scrollCollapse: true,
	    order: [[1, 'asc' ]],
	    paging: false,
	    info: false,
	    columnDefs: [
		{ orderable: false, targets: 3 }
	    ],
	});

	$('#scenario-list tbody').on('click', 'tr', function() {
	    if ($(this).hasClass('scenario-list-selected')) {
		$(this).removeClass('scenario-list-selected');
	    } else {
		self.scenario_list_table.$('tr.scenario-list-selected').removeClass('scenario-list-selected');
		$(this).addClass('scenario-list-selected');
		self.setScenarioTable(this);
	    }
	});
    },

    getScenarioFromDB: function(subt_id) {

	console.log("== getScenarioFromDB: sub_topology_id: " + subt_id);

	var self = this;

	$.ajax({
	    method: 'GET',
	    url: '/scenario/' + subt_id,
	    dataType: 'json',
	    success: function(data) {
		console.log("  success: data len = " + data.length);
		self.initScenarioTable(data);
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		DC.growl(DC.growl.statusClass.error, 'The request "GET scenario" failed. ' + errorThrown);
	    },
	});
    },

    initScenarioTable: function(data) {

	var self = this;

	this.scenario_list = [];
	this.scenario_list_table.clear().draw();

	$.each(data, function(i, v) {
	    self.addScenario(v.data);
	});
    },

    setScenarioTable: function(tr) {

	console.log('== setScenarioTable: ' + tr);

	var scenario_id = $(tr).attr('id').substr(5);
	var scenario = this.getScenario(scenario_id);
	if (!scenario) {
	    console.error("Cannot find scenario: " + scenario_id);
	    return;
	}
	DC.scenarioPanel.replaceScenario(scenario);


    },

    getScenario: function(scenario_id) {

	var scenario = undefined;
	$.each(this.scenario_list, function(i, s) {
	    if (s.scenarioID == scenario_id) {
		scenario = s;
		return false;
	    }
	});
	return scenario;
    },

    addScenario: function(scenario) {

	console.log("== add Scenario: ");
	console.log(scenario);

	this.scenario_list.push(scenario);
	this._addScenarioTable(scenario);
	this._setupInfoButton(scenario);
    },

    _addScenarioTable: function(scenario) {

	console.log("scenario id = " + scenario.scenarioID);

	var fault_abs = "";
	$.each(scenario.scenario, function(i, v) {
	    if ((v.sub_topology_ID == undefined) && (v.end_time == undefined)) {
		if (fault_abs != "") {
		    fault_abs += " -> ";
		}
		fault_abs += v.time + ":" + v.fault_type;
	    }
	});

	// TODO: tooltip for fault_abs??
	var entry = DC.ScenarioList.template
		.replace(/SCENARIO_ID/g, scenario.scenarioID)
		.replace('CREATION_TIME', new Date(Number(scenario.creation_time)).toLocaleString())
		.replace('FAULT_ABS', fault_abs);

	this.scenario_list_table.row.add($(entry)).draw();

    },

    _setupInfoButton: function(scenario) {

	var self = this;

	$('#sinfo_' + scenario.scenarioID).button({
	    text: false,
	    icons: {primary: "ui-icon-info", secondary: null },
	}).on('click', function() {
	    $('#detail-scenario-id').text(scenario.scenarioID);
	    $('#detail-creation-time').text(new Date(Number(scenario.creation_time)).toLocaleString());
	    // TODO: try/catch
	    var yaml = jsyaml.dump(scenario.scenario);
	    $('#detail-scenario pre').text(yaml);

	    $('#scenario-detail-dialog').dialog({
		dialogClass: "no-close",
		width: 500,
		buttons: [
		    {
			text: "OK",
			click: function() {
			    $(this).dialog('close');
			}
		    }
		],
	    });
	});
    },

};

DC.ScenarioList.template = ' \
    <tr id="tr_s_SCENARIO_ID"> \
	<td>SCENARIO_ID</td> \
	<td>CREATION_TIME</td> \
	<td><p class="ellipsis">FAULT_ABS</p></td> \
	<td><span id="sinfo_SCENARIO_ID" class="ui-icon"></span></td> \
';
