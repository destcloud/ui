//
// EndpointMenu extends FaultMenu
//

DC.EndpointMenu = function() {

    DC.FaultMenu.call(this);

    this.node = undefined;
    this.endpoint = undefined;

    this.init();
};

DC.EndpointMenu.prototype = Object.create( DC.FaultMenu.prototype );

DC.EndpointMenu.prototype.init = function() {

    var self = this;

    this.menu = $('#fault-endpoint-menu')
	.menu({
	    items: "> :not(.ui-widget-header)",
	    select: function(ev, ui) {
		var id = ui.item[0].id;

		if (id == 'fault-menu-down') {
		    self.portDownDialog();
		} else if (id === 'fault-menu-endp-recover') {
		    self.recoverDialog();
		}
		self.hide();
	    }
	})
	.blur(function() {
	    self.hide();
	});
};

DC.EndpointMenu.prototype.setNode = function(node) {

    this.node = node;
};

DC.EndpointMenu.prototype.setEndpoint = function(endpoint) {

    this.endpoint = endpoint;
};

DC.EndpointMenu.prototype.checkRecover = function() {

    var faults = DC.scenarioPanel.getFaults(this.endpoint.id);

    if (!faults) {
	$('#fault-menu-endp-recover').addClass('ui-state-disabled');
    } else {
	var show_recover = false;
	for (var i = 0; i < faults.length; i++) {
	    if (faults[i].type != DC.Fault.type.recover && !faults[i].recover_id) {
		show_recover = true;
		break;
	    }
	}
	if (show_recover) {
	    $('#fault-menu-endp-recover').removeClass('ui-state-disabled');
	} else {
	    $('#fault-menu-endp-recover').addClass('ui-state-disabled');
	}
    }
};

DC.EndpointMenu.prototype.portDownDialog = function() {

    var self = this;

    $('#port-down-fault-id').text(jsPlumbUtil.uuid().toUpperCase());
    $('#port-down-router-id').text(this.node.uuid);
    $('#port-down-interface-number').text(this.endpoint.getParameter('ifnumber'));
    
    $('#port-down-dialog').dialog({
	dialogClass: "no-close",
	width: 400,
	buttons: [
	    {
		text: "OK",
		click: function() {
		    self.setFaultedBehavier(this);
		    self.setFaultTable(this);
		    $(this).dialog('close');
		}
	    },
	    {
		text: "Cancel",
		click: function() {
		    $(this).dialog('close');
		}
	    },
	]
    });
};

DC.EndpointMenu.prototype.recoverDialog = function() {

    var self = this;

    $('#recover-fault-id').text(jsPlumbUtil.uuid().toUpperCase());

    $('#recover-recover-id').empty();

    var options = '<select>';
    var faults = DC.scenarioPanel.getFaults(this.endpoint.id);
    $.each(faults, function(index, value) {

	if (value.type != DC.Fault.type.recover && !value.recover_id) {
	    options += '<option value="' + value.id + '">' +
			    value.type + ' / ' +
			    value.time + ' / ' +
			    value.id +
			    '</option>';
	}
    });
    options += '</select>';
    $(options).appendTo('#recover-recover-id');

    $('#recover-dialog').dialog({
	dialogClass: "no-close",
	width: 500,
	buttons: [
	    {
		text: "OK",
		click: function() {
		    self.setFaultedBehavier(this);
		    self.setFaultTable(this);
		    $(this).dialog('close');
		}
	    },
	    {
		text: "Cancel",
		click: function() {
		    $(this).dialog('close');
		}
	    },
	]
    });
},

DC.EndpointMenu.prototype.setFaultedBehavier = function(dialog) {

    DC.Topology.setElementStyle(
	DC.Topology.elementType.endpoint,
	this.endpoint,
	DC.Topology.elementState.scenario_faulted
    );

};

DC.EndpointMenu.prototype.setFaultTable = function(dialog) {

    console.log('== setFaultTable: ' + dialog.id);

    if (dialog.id === 'port-down-dialog') {
	this.setPortDownEntry();
    } else if (dialog.id == 'recover-dialog') {
	this.setRecoverEntry();
    }
    DC.scenarioPanel.setScenarioTableHover();
};

DC.EndpointMenu.prototype.setPortDownEntry = function() {

    var fault = new DC.Fault(DC.Fault.type.down,
			$('#port-down-fault-id').text(),
			$('#port-down-time input').val(),
			{
			    fault_place: {
				router_ID: $('#port-down-router-id').text(),
				interface_number: $('#port-down-interface-number').text(),
			    }
			});
    fault.endpoint = this.endpoint;
    DC.scenarioPanel.addFault(this.endpoint.id, fault);

    var entry = DC.FaultMenu.commonTemplate
	    .replace('DISORDER_TYPE',    fault.type)
	    .replace('TIME',             fault.time);
    entry += DC.EndpointMenu.portDownTemplate
	    .replace('ROUTER_ID',        fault.options.fault_place.router_ID)
	    .replace('INTERFACE_NUMBER', fault.options.fault_place.interface_number);
    entry = entry.replace(/DISORDER_ID/g, fault.id);

    this.addTable(fault, entry);
};

DC.EndpointMenu.prototype.setRecoverEntry = function() {

    var recover_fault_id = $('#recover-fault-id').text();
    var recover_id = $('#recover-recover-id select').val();

    var faults = DC.scenarioPanel.getFaults(this.endpoint.id);
    $.each(faults, function(i, f) {
	if (f.id == recover_id) {
	    f.recover_id = recover_fault_id;
	    return false;
	}
    });

    var fault = new DC.Fault(DC.Fault.type.recover,
			recover_fault_id,
			$('#recover-time input').val(),
			{
			    'recover_ID': recover_id,
			});
    fault.endpoint = this.endpoint;
    DC.scenarioPanel.addFault(this.endpoint.id, fault);


    var entry = DC.FaultMenu.commonTemplate
	    .replace('DISORDER_TYPE', fault.type)
	    .replace('TIME',          fault.time);
    entry += DC.FaultMenu.recoverTemplate
	    .replace('RECOVER_ID',    fault.options.recover_ID);
    entry = entry.replace(/DISORDER_ID/g, fault.id);

    this.addTable(fault, entry);
};

DC.EndpointMenu.portDownTemplate = ' \
	<td><div class="table-subtitle">Router ID</div>ROUTER_ID</td> \
	<td><div class="table-subtitle">Interface Number</div>INTERFACE_NUMBER</td> \
    </tr> \
';
