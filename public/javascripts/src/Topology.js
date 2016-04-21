//
// Topology Utility
//

DC.Topology = function(topology) {

    this.entire_topology_id = undefined;
    this.sub_topology_id = undefined;

    this.has_line = false;

    this.topology = {};
    this.topology_prev = {};


    this.init(topology);

};

DC.Topology.prototype = {
    
    constructor: DC.Topology,

    init: function(topology) {

	var self = this;
	$.each(topology, function(index, t) {
	    if (t.hasOwnProperty('entire_topology_ID')) {
		self.entire_topology_id = t.entire_topology_ID;
		DC.logPanel.history.addEntire(self.entire_topology_id);
	    } else {
		self.topology[t.ID] = {
		    original: t,
		    enable: true,
		};
		if (t.entity_type == 'line') {
		    self.has_line = true;
		}
	    }
	});

	this.topology_prev = $.extend(true, {}, this.topology);
    },

    update: function() {

	console.log("== update Topology");
	this.topology_prev = $.extend(true, {}, this.topology);
    },

    toggleState: function(ele) {

	var id = this.getEntityId(ele);
	var t = this.topology[id];
	if (!t) {
	    // TODO: error
	    console.error("Cannot find element. uuid=" + id);
	    return false;
	}
	t.enable = !t.enable;
	console.log('toggleState id=' + id + " " + t.enable);
	return t.enable;
    },

    enableState: function(ele) {

	var id = this.getEntityId(ele);
	var t = this.topology[id];
	if (!t) {
	    // TODO: error
	    console.error("Cannot find element. uuid=" + id);
	    return false;
	}
	t.enable = true;
    },

    disableState: function(ele) {

	var id = this.getEntityId(ele);
	var t = this.topology[id];
	if (!t) {
	    // TODO: error
	    console.error("Cannot find element. uuid=" + id);
	    return false;
	}
	t.enable = false;
    },

    getEntityId: function(ele) {

	var id = undefined;
	if (ele instanceof jsPlumb.Connection) {
	    id = ele.getParameter('entityId');
	} else {
	    id = $(ele).find('.node-label-uuid').text();
	}
	return id;
    },

    getEnableTopologyArray: function() {

	var enables = []

	$.each(this.topology, function(id, t) {
	    if (t.enable) {
		enables.push(t.original.ID);
	    }
	});

	return enables;
    },

    getDisableTopologyObj: function() {

	var disables = []

	$.each(this.topology, function(id, t) {
	    if (!t.enable) {
		disables.push(t.original.ID);
	    }
	});

	return disables;
    },

    equalTopologyCheckedStatus: function() {

	var self = this;
	var equal = true;
	$.each(this.topology, function(k, v) {
	    var prev = self.topology_prev[k];
	    if (v.enable != prev.enable) {
		equal = false;
		return false;
	    }
	});
	return equal;
    },
};

DC.Topology.elementType = {
    node        : 'node-ele',
    node_label  : 'node-label',
    endpoint    : 'endp',
    connection  : 'conn',
    label       : 'conn-label',
};

DC.Topology.elementState = {
    normal              : 'normal',
    subt_enable         : 'subt-enable',
    subt_disable        : 'subt-disable',
    subt_hover          : 'subt-hover',
    scenario_normal     : 'scenario-normal',
    scenario_faulted    : 'scenario-faulted',
    scenario_hover      : 'scenario-hover',
    scenario_highlight  : 'scenario-highlight',
    transparent         : 'transparent',
};

DC.Topology.setElementStyle = function(type, element, state) {

    var element = element;

    if (type == DC.Topology.elementType.node) {
	element = $(element);
    } else if (type == DC.Topology.elementType.node_label) {
	element = $(element);
    } else if (type == DC.Topology.elementType.endpoint) {
    } else if (type == DC.Topology.elementType.connection) {
    } else if (type == DC.Topology.elementType.label) {
	element = element.getOverlay(element.getParameter('entityId'));
    }

    $.each(DC.Topology.elementState, function(k, v) {

	var cls = type + '-' + v;
	if (v == state) {
	    element.addClass(cls);
	} else {
	    element.removeClass(cls);
	}
    });
};

DC.Topology.addElementStyle = function(type, element, state) {

    var element = element;

    if (type == DC.Topology.elementType.node) {
	element = $(element);
    } else if (type == DC.Topology.elementType.node_label) {
	element = $(element);
    } else if (type == DC.Topology.elementType.endpoint) {
    } else if (type == DC.Topology.elementType.connection) {
    } else if (type == DC.Topology.elementType.label) {
	element = element.getOverlay(element.getParameter('entityId'));
    }

    element.addClass(type + '-' + state);
};

DC.Topology.removeElementStyle = function(type, element, state) {

    var element = element;

    if (type == DC.Topology.elementType.node) {
	element = $(element);
    } else if (type == DC.Topology.elementType.node_label) {
	element = $(element);
    } else if (type == DC.Topology.elementType.endpoint) {
    } else if (type == DC.Topology.elementType.connection) {
    } else if (type == DC.Topology.elementType.label) {
	element = element.getOverlay(element.getParameter('entityId'));
    }

    element.removeClass(type + '-' + state);
};
