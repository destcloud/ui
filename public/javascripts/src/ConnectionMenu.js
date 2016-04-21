//
// ConnectionMenu
//

DC.ConnectionMenu = function() {

    DC.FaultMenu.call(this);

    this.connection = undefined;

    this.formatter = Intl.NumberFormat("latn", {
			style: 'decimal',
			minimumFractionDigits: 0,
    });

    this.init();
};

DC.ConnectionMenu.prototype = Object.create( DC.FaultMenu.prototype );

DC.ConnectionMenu.prototype.constructor = DC.ConnectionMenu;

DC.ConnectionMenu.prototype.init = function() {

    var self = this;

    this.menu = $('#fault-connection-menu')
	.menu({
	    items: "> :not(.ui-widget-header)",
	    select: function(ev, ui) {
		console.log("menu selected: " + ui.item[0].id);
		var id = ui.item[0].id;
		if (id == 'fault-menu-disconnect') {
		    self.disconnectDialog();
		} else if (id == 'fault-menu-loss') {
		    self.packetLossDialog(false);
		} else if (id === 'fault-menu-shaping') {
		    self.trafficShapingDialog();
		} else if (id === 'fault-menu-delay') {
		    self.delayDialog();
		} else if (id === 'fault-menu-conn-recover') {
		    self.recoverDialog();
		} else {
		    console.log("unknown menu item: " + id);
		}
		self.hide();
	    }
	})
	.blur(function() {
	    self.hide();
	});
};

DC.ConnectionMenu.prototype.setConnection = function(connection) {

    this.connection = connection;
};

DC.ConnectionMenu.prototype.checkRecover = function() {

    var faults = DC.scenarioPanel.getFaults(this.connection.id);

    if (!faults) {
	$('#fault-menu-conn-recover').addClass('ui-state-disable');
    } else {
	var show_recover = false;
	for (var i = 0; i < faults.length; i++) {
	    if (faults[i].type != DC.Fault.type.recover && !faults[i].recover_id) {
		show_recover = true;
	    }
	}
	if (show_recover) {
	    $('#fault-menu-conn-recover').removeClass('ui-state-disabled');
	} else {
	    $('#fault-menu-conn-recover').addClass('ui-state-disabled');
	}
    }
};

DC.ConnectionMenu.prototype.disconnectDialog = function() {

    this.packetLossDialog(true);
};

DC.ConnectionMenu.prototype.packetLossDialog = function(fixed_loss) {

    var self = this;

    $('#packet-loss-fault-id').text(jsPlumbUtil.uuid().toUpperCase());
    $('#packet-loss-line-id').text(this.connection.getParameter('entityId'));

    var title = "Packet Loss";

    if (fixed_loss) {
	title = "Disconnect";
	$('#loss-ratio-slider').slider({
	    min: 0,
	    max: 100,
	    step: 1,
	    value: 100,
	    disabled: true,
	});
	$('#loss-ratio-value').text(100.0);
    } else {
	$('#loss-ratio-slider').slider({
	    min: 0,
	    max: 100,
	    step: 1,
	    value: 50,
	    disabled: false,
	    slide: function(ev, ui) {
		$('#loss-ratio-value').text(self.formatter.format(ui.value));
	    },
	});
	$('#loss-ratio-value').text(50.0);
    }

    $('#packet-loss-dialog').dialog({
	title: title,
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

DC.ConnectionMenu.prototype.trafficShapingDialog = function() {

    var self = this;

    $('#traffic-shaping-fault-id').text(jsPlumbUtil.uuid().toUpperCase());
    $('#traffic-shaping-line-id').text(this.connection.getParameter('entityId'));
    
    $('#traffic-shaping-dialog').dialog({
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

DC.ConnectionMenu.prototype.delayDialog = function() {

    var self = this;

    $('#delay-fault-id').text(jsPlumbUtil.uuid().toUpperCase());
    $('#delay-line-id').text(this.connection.getParameter('entityId'));
    
    $('#delay-dialog').dialog({
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

DC.ConnectionMenu.prototype.recoverDialog = function() {

    var self = this;

    $('#recover-fault-id').text(jsPlumbUtil.uuid().toUpperCase());

    $('#recover-recover-id').empty();

    var options = '<select>';
    var faults = DC.scenarioPanel.getFaults(this.connection.id);
    $.each(faults, function(index, value) {

	if (value.type != DC.Fault.type.recover && !value.recover_id) {
	    options += '<option value="' + value.id + '">' +
			value.type + '/ ' +
			value.time + '/ ' +
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
};

DC.ConnectionMenu.prototype.setFaultedBehavier = function(dialog) {

    DC.Topology.setElementStyle(
	DC.Topology.elementType.connection,
	this.connection,
	DC.Topology.elementState.scenario_faulted
    );
    DC.Topology.setElementStyle(
	DC.Topology.elementType.label,
	this.connection,
	DC.Topology.elementState.scenario_faulted
    );
};

DC.ConnectionMenu.prototype.setFaultTable = function(dialog) {

    if (dialog.id == 'packet-loss-dialog') {
	this.setPacketLossEntry();
    } else if (dialog.id == 'traffic-shaping-dialog') {
	this.setTrafficShapingEntry();
    } else if (dialog.id == 'delay-dialog') {
	this.setDelayEntry();
    } else if (dialog.id == 'recover-dialog') {
	this.setRecoverEntry();
    }
    DC.scenarioPanel.setScenarioTableHover();
};

DC.ConnectionMenu.prototype.setPacketLossEntry = function() {

    var isDisconnect = $('#loss-ratio-slider').slider('option', 'disabled');

    var fault;

    if (isDisconnect) {
	var fault = new DC.Fault(DC.Fault.type.disconnect,
			$('#packet-loss-fault-id').text(),
			$('#packet-loss-time input').val(),
			{
			    'fault_place': $('#packet-loss-line-id').text(),
			    'loss_ratio': Number($('#loss-ratio-value').text()),
			});
    } else {
	var fault = new DC.Fault(DC.Fault.type.loss,
			$('#packet-loss-fault-id').text(),
			$('#packet-loss-time input').val(),
			{
			    'fault_place': $('#packet-loss-line-id').text(),
			    'loss_ratio': Number($('#loss-ratio-value').text()),
			});
    }

    fault.connection = this.connection;
    DC.scenarioPanel.addFault(this.connection.id, fault);

    var entry = DC.FaultMenu.commonTemplate
		.replace('DISORDER_TYPE', fault.type)
		.replace('TIME',          fault.time);
	entry += DC.ConnectionMenu.packetLossTemplate
		.replace('LINE_ID',       fault.options.fault_place)
		.replace('RATIO',         fault.options.loss_ratio);
	entry = entry.replace(/DISORDER_ID/g, fault.id);

    this.addTable(fault, entry);
};

DC.ConnectionMenu.prototype.setTrafficShapingEntry = function() {

    var fault = new DC.Fault(DC.Fault.type.shaping,
			$('#traffic-shaping-fault-id').text(),
			$('#traffic-shaping-time input').val(),
			{
			    'fault_place': $('#traffic-shaping-line-id').text(),
			    'bandwidth': Number($('#traffic-shaping-bandwidth input').val()),
			});
    fault.connection = this.connection;
    DC.scenarioPanel.addFault(this.connection.id, fault);

    var entry = DC.FaultMenu.commonTemplate
		.replace('DISORDER_TYPE', fault.type)
		.replace('TIME',          fault.time);
	entry += DC.ConnectionMenu.trafficShapingTemplate
		.replace('LINE_ID',       fault.options.fault_place)
		.replace('BANDWIDTH',     fault.options.bandwidth);
	entry = entry.replace(/DISORDER_ID/g, fault.id);

    this.addTable(fault, entry);
};

DC.ConnectionMenu.prototype.setDelayEntry = function() {

    var fault = new DC.Fault(DC.Fault.type.delay,
			$('#delay-fault-id').text(),
			$('#delay-time input').val(),
			{
			    'fault_place': $('#delay-line-id').text(),
			    'delay': Number($('#delay-delay input').val()),
			});
    fault.connection = this.connection;
    DC.scenarioPanel.addFault(this.connection.id, fault);

    var entry = DC.FaultMenu.commonTemplate
		.replace('DISORDER_TYPE', fault.type)
		.replace('TIME',          fault.time);

	entry += DC.ConnectionMenu.delayTemplate
		.replace('LINE_ID',   fault.options.fault_place)
		.replace('DELAY',     fault.options.delay);
	entry = entry.replace(/DISORDER_ID/g, fault.id);

    this.addTable(fault, entry);
};

DC.ConnectionMenu.prototype.setRecoverEntry = function() {

    var recover_fault_id = $('#recover-fault-id').text();
    var recover_id = $('#recover-recover-id select').val();

    var faults = DC.scenarioPanel.getFaults(this.connection.id);
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
			    'recover_ID': recover_id
			});
    fault.connection = this.connection;
    DC.scenarioPanel.addFault(this.connection.id, fault);

    var entry = DC.FaultMenu.commonTemplate
	    .replace('DISORDER_TYPE', fault.type)
	    .replace('TIME',          fault.time);
    entry += DC.FaultMenu.recoverTemplate
	    .replace('RECOVER_ID',    fault.options.recover_ID);
    entry = entry.replace(/DISORDER_ID/g, fault.id)

    this.addTable(fault, entry);
};

DC.ConnectionMenu.packetLossTemplate = ' \
	<td><div class="table-subtitle">Line ID</div>LINE_ID</td> \
	<td><div class="table-subtitle">Loss Ratio</div>RATIO</td> \
    </tr> \
';

DC.ConnectionMenu.trafficShapingTemplate = ' \
	<td><div class="table-subtitle">Line ID</div>LINE_ID</td> \
	<td><div class="table-subtitle">Bandwidth</div>BANDWIDTH</td> \
    </tr> \
';

DC.ConnectionMenu.delayTemplate = ' \
	<td><div class="table-subtitle">Line ID</div>LINE_ID</td> \
	<td><div class="table-subtitle">Delay</div>DELAY</td> \
    </tr> \
';
