//
// UUID history
//

DC.UuidHistory = function() {

    this.all = [];

    this.init();
};

DC.UuidHistory.prototype = {
    
    constructor: DC.UuidHistory,

    init: function() {

	this.getHistoryFromDB();
    },

    addEntire: function(entt_id) {

	console.log("-- addEntire: " + entt_id);

	var entire = {
		entire : entt_id,
		subts  : [],
		nodes  : [],
		lines  : []
	};
	this.all.push(entire);

    },

    addSubTopology: function(entt_id, subt_id) {

	console.log("-- addSubTopology: " + entt_id + ', ' + subt_id);

	var entire = this.getEntire(entt_id);
	if (!entire) {
	    console.error('entire topology id is not set. ' + entt_id);
	    return;
	}

	entire.subts.push({
	    subt: subt_id,
	    scenarios: [],
	});
    },

    addScenario: function(entt_id, subt_id, scenario_id) {

	console.log("-- addScenario: " + entt_id + ', ' + subt_id + ', ' + scenario_id);

	var subt = this.getSubTopology(entt_id, subt_id);
	if (!subt) {
	    console.error('sub topology id is not set. ' + subt_id);
	    return;
	}

	// NOTE: not save repeated scenario
	if (this.getScenario(entt_id, subt_id, scenario_id)) return;
	    
	subt.scenarios.push({
	    scenario: scenario_id,
	    jobs: [],
	    faults: []
	});
    },

    addJob: function(entt_id, subt_id, scenario_id, job_id) {

	console.log("-- addJob: " + entt_id + ', ' + subt_id + ', ' + scenario_id + ', ' + job_id);

	var scenario = this.getScenario(entt_id, subt_id, scenario_id);
	if (!scenario) {
	    console.error('scenario id is not set. ' + scenario_id);
	    return;
	}
	scenario.jobs.push(job_id);
    },

    addFault: function(entt_id, subt_id, scenario_id, scenario_json) {

	var faults;
	try {
	    faults = JSON.parse(scenario_json);
	} catch (e) {
	    // TODO: error
	    return;
	}

	var scenario = this.getScenario(entt_id, subt_id, scenario_id);
	if (!scenario) {
	    console.error('scenario id is not set. ' + scenario_id);
	    return;
	}

	for (var i = 0; i < faults.length; i++) {
	    if (faults[i].fault_ID && !this.hasFault(scenario.faults, faults[i].fault_ID)) {
		console.log("-- addFault: " + entt_id + ', ' + subt_id + ', ' + scenario_id + ', ' + faults[i].fault_ID);
		scenario.faults.push(faults[i].fault_ID);
	    }
	}
    },

    hasFault: function(faults, fault_id) {

	return (faults.indexOf(fault_id) >= 0) ? true : false;
    },

    addNode: function(entt_id, node_id) {

	console.log("-- addNode: " + entt_id + ', ' + node_id);

	var entire = this.getEntire(entt_id);
	if (!entire) {
	    console.error('entire topology id is not set. ' + entt_id);
	    return;
	}
	entire.nodes.push(node_id);
    },

    addLine: function(entt_id, line_id) {

	console.log("-- addLine: " + entt_id + ', ' + line_id);

	var entire = this.getEntire(entt_id);
	if (!entire) {
	    console.error('entire topology id is not set. ' + entt_id);
	    return;
	}

	entire.lines.push(line_id);
    },

    getEntire: function(entt_id) {

	var entire = null;
	this.all.forEach(function(v, i) {

	    if (v.entire == entt_id) entire = v;
	});
	return entire;
    },

    getEntires: function() {
	return this.all;
    },

    getSubTopology: function(entt_id, subt_id) {

	var entire = this.getEntire(entt_id);
	if (!entire) return null;

	var subt = null;
	entire.subts.forEach(function(v, i) {
	    if (v.subt === subt_id) subt = v;
	});
	return subt;
    },

    getSubTopologies: function(entt_id) {

	var entire = this.getEntire(entt_id);
	if (!entire) return null;

	return entire.subts;
    },

    getScenario: function(entt_id, subt_id, scenario_id) {

	var subt = this.getSubTopology(entt_id, subt_id);
	if (!subt) return null;

	var scenario = null;
	subt.scenarios.forEach(function(v, i) {
	    if (v.scenario === scenario_id) scenario = v;
	});
	return scenario;
    },

    getScenarios: function(entt_id, subt_id) {

	var subt = this.getSubTopology(entt_id, subt_id);
	if (!subt) return null;

	return subt.scenarios;
    },

    getJobs: function(entt_id, subt_id, scenario_id) {

	var scenario = this.getScenario(entt_id, subt_id, scenario_id);
	if (!scenario) return null;
    
	return scenario.jobs;
    },

    getFaults: function(entt_id, subt_id, scenario_id) {

	var scenario = this.getScenario(entt_id, subt_id, scenario_id);
	if (!scenario) return null;
    
	return scenario.faults;
    },

    getNodes: function(entt_id) {

	var entire = this.getEntire(entt_id);
	if (!entire) return null;

	return entire.nodes;
    },

    getLines: function(entt_id) {

	var entire = this.getEntire(entt_id);
	if (!entire) return null;

	return entire.lines;
    },

    sendHistory: function() {

	var self = this;
	var data = JSON.stringify({ history: this.all});

	$.ajax({
	    method: 'POST',
	    url: '/history',
	    cache: false,
	    contentType: 'application/json',
	    processData: false,
	    data: data,
	    success: function(data) {
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.log("POST /history error: " + textStatus + ", " + errorThrown);
		DC.growl(DC.growl.statusClass.error, 'The request "POST /history" failed. ' + errorThrown);
	    },
	    complete: function(jqXHR, textStatus) {
		$.unblockUI();
	    },
	    timeout: DC.C.config.timeout.ajax,
	});
    },

    getHistoryFromDB: function() {

	console.log("== getHistoryFromDB");

	var self = this;

	$.ajax({
	    method: 'GET',
	    url: '/history/',
	    dataType: 'json',
	    success: function(data) {
		console.log("  success: data len = " + data.length);
		self.all = data;
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
		console.error("  error: " + errorThrown);
		DC.growl(DC.growl.statusClass.error, 'The request "GET /history" failed. ' + errorThrown);
	    },
	});
    },
};
