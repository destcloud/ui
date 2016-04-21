//
// FaultMenu
//

DC.FaultMenu = function() {

    this.menu = undefined;
    this.shown = false;
};

DC.FaultMenu.prototype = {
    
    constructor: DC.FaultMenu,

    show: function(x, y) {

	this.shown = true;
	this.menu
		.css('top', y + 'px')
		.css('left', x + 'px')
		.show().focus();
    },

    hide: function() {
	this.shown = false;
	this.menu.hide();
    },

    isShown: function() {

	return this.shown;
    },

    addTable: function(fault, entry) {

	DC.scenarioPanel.scenario_table.row.add($(entry)).draw();
	this.setupDeleteButton(fault);
    },

    removeTable: function(fault) {

	DC.scenarioPanel.scenario_table.row('#tr_' + fault.id).remove().draw();
    },

    setupDeleteButton: function(fault) {

	var self = this;

	$('#tr_' + fault.id + ' .delete-fault-btn').button({
	    text: false,
	    icons: {primary: "ui-icon-trash", secondary: null },
	}).on('click', function() {
	    // TODO: remove port down, then remove recover
	    var id = $(this).parents('tr').attr('id');
	    DC.scenarioPanel.offHighlightTopology($('#' + id));
	    var removed_fault = DC.scenarioPanel.removeFault(id);
	    self.removeTable(removed_fault);
	});
    },
};

DC.FaultMenu.commonTemplate = ' \
    <tr id="tr_DISORDER_ID"> \
	<td><button class="delete-fault-btn">DEL</td> \
	<td>DISORDER_TYPE</td> \
	<td>DISORDER_ID</td> \
	<td>TIME</td> \
';

DC.FaultMenu.recoverTemplate = ' \
	<td><div class="table-subtitle">Recover ID</div>RECOVER_ID</td> \
	<td></td> \
    </tr> \
';
