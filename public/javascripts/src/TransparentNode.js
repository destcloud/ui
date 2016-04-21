//
// TransparentNode extends Node
//
DC.TransparentNode = function(jsp, container, endpoint_menu, json, number, fixed_anchor) {


    DC.Node.call(this, jsp, container, endpoint_menu, json, number, fixed_anchor);

};

DC.TransparentNode.prototype = Object.create( DC.Node.prototype);

DC.TransparentNode.prototype.init = function() {

    console.log("== TransparentNode.init: " + this.number);
    DC.Node.prototype.init.call(this);

    DC.Topology.setElementStyle(
		DC.Topology.elementType.node,
		$('#' + this.id),
		DC.Topology.elementState.transparent);
    DC.Topology.setElementStyle(
		DC.Topology.elementType.node_label,
		$('#' + this.id),
		DC.Topology.elementState.transparent);
    for (endp in this.endpoints) {
	DC.Topology.setElementStyle(
		DC.Topology.elementType.endpoint,
		this.endpoints[endp],
		DC.Topology.elementState.transparent);
    }

};
