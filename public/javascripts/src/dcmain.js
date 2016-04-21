//
// panels
//
DC.entitiesPanel = undefined;
DC.topologyPanel = undefined;
DC.scenarioPanel = undefined;
DC.logPanel = undefined;

DC.C = undefined;


DC.start = function() {

    DC.C = new DC.Config();
    DC.initPanel();
};

DC.initPanel = function() {

    $('#tab-area').tabs({
	active: 0,
	activate: function(ev, ui) {
	    $.fn.dataTable.tables( {visible: true, api: true}).columns.adjust();
	},
	beforeActivate: function(ev, ui) {
	    if ($(ui.newPanel).attr('id') == 'scenario-area') {
		if (!DC.entitiesPanel.subtopology_has_sent) {
		    DC.showWarningDialog('Sub Topology', 'Subtopology is not set. Scenario mode is not activated.');
		}
	    } else if ($(ui.newPanel).attr('id') == 'log-area') {
		if (DC.topologyPanel.topology) {
		    DC.logPanel.setCurrentUuids(DC.topologyPanel.topology.entire_topology_id);
		} else {
		    DC.logPanel.setUuids();
		}
	    }
	},
    });

    DC.entitiesPanel = new DC.EntitiesPanel();
    DC.topologyPanel = new DC.TopologyPanel();
    DC.scenarioPanel  = new DC.ScenarioPanel();
    DC.logPanel      = new DC.LogPanel();
};

DC.showErrorDialog = function(subtitle, message) {

    var msg = '';
    if (typeof message !== 'string') {
	var jqXHR = message;
	if (jqXHR.status && jqXHR.status == 0) {
	    subtitle = 'Connection Refused';
	    msg = message;
	} else {
	    msg = jqXHR.responseText;
	}
    } else {
	msg = message;
    }

    $('#error-dialog h2').text(subtitle);
    $('#error-dialog p').text(msg);

    $.blockUI({
	message: $('#error-dialog'),
    });
    $('#error-close')
	.button()
	.click(function() {
	    $.unblockUI();
	    return false;
	});
};

DC.hideErrorDialog = function() {

    $.unblockUI();
};

DC.showWarningDialog = function(subtitle, message) {

    $('#warning-dialog h2').text(subtitle);
    $('#warning-dialog p').text(message);

    $.blockUI({
	message: $('#warning-dialog'),
    });
    $('#warning-close')
	.button()
	.click(function() {
	    $.unblockUI();
	    return false;
	});
};

DC.hideWarningDialog = function() {

    $.unblockUI();
};

DC.growl = function(statusClass, msg) {

    $('#growl').removeClass().addClass(statusClass);
    $('#growl p').text(msg);

    $.blockUI({
	message: $('div#growl'),
	fadeIn: 700,
	fadeOut: 1000,
	timeout: 5000,
	showOverlay: false,
	centerY: false,
	css: {
	    top: '',
	    left: '',
	    right: '10px',
	    bottom: '10px',
	    border: 'none',
	    padding: '0px',
	    'border-radius': '10px',
	    opacity: .7,
	    color: '#000'
	},
    });
};

DC.growl.statusClass = {
    'success' : 'growl-success',
    'info'    : 'growl-info',
    'warning' : 'growl-warning',
    'error'   : 'growl-error',
};


DC.enableBtn =  function(btn) {
    $(btn).button( 'option', 'disabled', false);
};

DC.disableBtn = function(btn) {
    $(btn).button( 'option', 'disabled', true);
};

//
// entry point
//
$(function() {

    console.log("start DESTCloud1: Version: " + DC.Version + " Date: " + DC.Date);
    DC.start();

});

