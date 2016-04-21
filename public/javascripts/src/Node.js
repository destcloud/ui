//
// Node 
//

DC.Node = function(jsp, container, endpoint_menu, json, number, fixed_anchor) {

    this.jsp = jsp;
    this.container = container;
    this.json = json;
    this.number = number;
    this.uuid = json.ID;
    this.id = 'node_' + number;
    this.label_id = 'node_label_' + number;
    this.svg_id = 'node-svg-' + number;

    this.node = undefined;
    this.svg = undefined;
    this.endpoints = {};
    this.endp_uuids = [];

    this.use_fixed_anchor = fixed_anchor;
    this.anchor_position = [];

    this.menu = endpoint_menu;


    this.init();
};

DC.Node.prototype = {
    
    constructor: DC.Node,

    init: function() {

	var w = h = DC.Node.SIZE;
	var cx = cy = r = Math.floor(w/2);

	this.node = DC.Node.svg_template
		    .replace('NODE_ID', this.id)
		    .replace('NODE_LABEL_ID', this.label_id)
		    .replace('NODE_LABEL_NAME', this.json.entity_name)
		    .replace('NODE_LABEL_UUID', this.uuid)
		    .replace('SVG_WIDTH', w)
		    .replace('SVG_HEIGHT', h)
		    .replace('SVG_ID', this.svg_id)
		    .replace('SVG_CX', cx)
		    .replace('SVG_CY', cy)
		    .replace('SVG_R', r)
		    .replace('SVG_COLOR', DC.C.config.color.node);
	$(this.container).append($(this.node));

	if (this.use_fixed_anchor) {
	    this.calculateAnchorPosition();
	}

	this.addEndpoint();
    },

    calculateAnchorPosition: function() {

	// NOTE: anchor position x,y is [0-1]

	var d = (Math.PI * 2) / this.json.IF_numbers;

	for (var i = 0; i < this.json.IF_numbers; i++) {
	    var phi = i * d;
	    this.anchor_position.push([ Math.sin(phi) * 0.5 + 0.5,
				       	-Math.cos(phi) * 0.5 + 0.5,
					0, 1]);
	}
    },

    addEndpoint: function() {

	var node = $('#' + this.id);
	var svg = $('#' + this.svg_id);

	this.jsp.draggable(node, {
	    containment: $(this.container)
	});

	var cont_h = $(this.container).height();
	var cont_w = $(this.container).width();
	var header_h = $('#topology-header').height();

	var cell = DC.topologyPanel.grid.getNextEmptyCell();
	var top = cell.y - Math.floor(DC.Node.SIZE / 2);
	var left = cell.x - Math.floor(DC.Node.SIZE / 2);

	$(node).css('top', top + 'px');
	$(node).css('left', left + 'px');

	var self = this;

	for (var i = 0; i < this.json.IF_numbers; i++) {
	    var endp_uuid = this.id + '-port-' + i;
	    this.endp_uuids.push(endp_uuid);

	    var anchor = "Continuous";
	    if (this.use_fixed_anchor) {
		anchor = this.anchor_position[i];
	    }
	    var overlay = $.extend(true, {}, DC.Node.endpointOverlay);
	    overlay.overlays[0][1].label = i.toString();
	    overlay.overlays[0][1].id = endp_uuid;
	    overlay.overlays[0][1].parameters.node = this.uuid;
	    overlay.overlays[0][1].parameters.endp_uuid = endp_uuid;
	    var endpoint = this.jsp.addEndpoint(svg, overlay,
					{
					    uuid: endp_uuid,
					    anchor: anchor,
					    parameters: {
						ifnumber: i,
						faults: [],
					    }
					});
	    endpoint
		.bind('mouseover', function(endpoint, orgEvent) {
		    if (!DC.topologyPanel.subtopology_mode && !DC.topologyPanel.scenario_mode) return;

		    if (endpoint instanceof jsPlumb.Overlays.Label) {
			endpoint = endpoint.component;
		    }
		    if (endpoint.hasClass('endp-subt-disable')) return;

		    if (DC.topologyPanel.subtopology_mode) {
/*
TODO: do action with connection in subtopology mode
			    DC.Topology.addElementStyle(
				DC.Topology.elementType.endpoint,
				endpoint,
				DC.Topology.elementState.subt_hover
			    );
*/
		    } else if (DC.topologyPanel.scenario_mode) {
			DC.Topology.addElementStyle(
			    DC.Topology.elementType.endpoint,
			    endpoint,
			    DC.Topology.elementState.scenario_hover
			);
			var faults = DC.scenarioPanel.getFaults(endpoint.id);

			if (faults && faults.length > 0) {
			    self.createFaultPointMenu(faults);
			    $('#faults-menu')
				    .menu()
				    .css('top', orgEvent.clientY + 'px')
				    .css('left', orgEvent.clientX + 10 + 'px')
				    .blur(function() {
					$('#faults-menu').hide();
				    })
				    .show().focus();
			}
		    }

		}).bind('mouseout', function(endpoint, orgEvent) {
		    if (!DC.topologyPanel.subtopology_mode && !DC.topologyPanel.scenario_mode) return;

		    if (endpoint instanceof jsPlumb.Overlays.Label) {
			endpoint = endpoint.component;
		    }
		    if (endpoint.hasClass('endp-subt-disable')) return;

		    if (DC.topologyPanel.subtopology_mode) {
			// nothing to do
		    } else if (DC.topologyPanel.scenario_mode) {
			DC.Topology.removeElementStyle(
			    DC.Topology.elementType.endpoint,
			    endpoint,
			    DC.Topology.elementState.scenario_hover
			);
			var faults = endpoint.getParameter('faults');
			if (faults.length > 0) {
			    $('#faults-menu').remove();
			}
		    }

		}).bind('click', function(endpoint, orgEvent) {
		    if (!DC.topologyPanel.subtopology_mode && !DC.topologyPanel.scenario_mode) return;

		    if (endpoint instanceof jsPlumb.Overlays.Label) {
			endpoint = endpoint.component;
		    }
		    if (endpoint.hasClass('endp-subt-disable')) return;

		    if (DC.topologyPanel.subtopology_mode) {
			// nothing to do
		    } else if (DC.topologyPanel.scenario_mode) {
			if (self.menu.isShown()) return;

			self.menu.setNode(self);
			self.menu.setEndpoint(endpoint);
			self.menu.checkRecover();
			self.menu.show(orgEvent.clientX, orgEvent.clientY);
		    }
		});
	    this.endpoints[endp_uuid] = endpoint;
	}
    },

    clearFaults: function() {

	$.each(this.endpoints, function(endp_uuid, endpoint) {
	    DC.Topology.setElementStyle(
		DC.Topology.elementType.endpoint,
		endpoint,
		DC.Topology.elementState.normal
	    );
	});
    },

    createFaultPointMenu: function(faults) {

	var items = "";
	$.each(faults, function(index, fault) {
	    items += '<li><div class="subtitle">' +
			fault.type +
			'<span class="pm_fault_time">time: ' +
			fault.time + '</span></div>' +
			fault.id + '</li>';
	});
	$('#faults-menu').remove();
	$('body').append(
	    '<ul id="faults-menu" class="menu point-menu" display: none;>' +
	    items + 
	    '</ul>'
	);
    },

    getEndpoint: function(uuid) {

	return this.endpoints[uuid];
    },

    getEndpointUuid: function(num) {
    
	if (num >= this.endp_uuids.length) {
	    console.log("[WARN] getEndPointsUuid: wrong index: " + num);
	    num = 0;
	}
	return this.endp_uuids[num];
    },

    getEndpointByIfNumber: function(ifNumber) {

	var endp_uuid = this.getEndpointUuid(ifNumber);
	return this.endpoints[endp_uuid];
    },

    highlightPort: function(ifNumber, sw) {

	var endp_uuid = this.id + '-port-' + ifNumber;
	var endp = this.endpoints[endp_uuid];
	if (!endp) {
	    // TODO: error processing
	    console.error("Cannot get endpoint. " + endp_uuid);
	    return;
	}

	if (sw) {
	    DC.Topology.setElementStyle(
		DC.Topology.elementType.endpoint,
		endp,
		DC.Topology.elementState.scenario_highlight
	    );
	} else {
	    DC.Topology.setElementStyle(
		DC.Topology.elementType.endpoint,
		endp,
		DC.Topology.elementState.scenario_faulted
	    );
	}
    },
};

DC.Node.SIZE = 70;


DC.Node.endpointOverlay = {
    cssClass: 'endp-normal',
    overlays: [
	[ 'Label', {
	    id: 'label0',
	    label: '0',
	    location: [0.5, 0.5],
	    labelStyle: {
		color: "white",
	    },
	    parameters: {
		node: 'FOOBAR',
		endp_uuid: 'FOOBAR',
		faults: [],
	    },
	    events: {
		mouseover: function(label, orgEvent) {
		    if (!DC.topologyPanel.scenario_mode) return;
		    // NOTE: delegate to endpoint.mouseover
		},
		mouseout: function(label, orgEvent) {
		    if (!DC.topologyPanel.scenario_mode) return;
		    // NOTE: delegate to endpoint.mouseout
		},
		click: function(label, orgEvent) {
		    if (!DC.topologyPanel.scenario_mode) return;
		    // NOTE: delegate to endpoint.click
		},
	    },
	}]
    ],
};


DC.Node.svg_template = ' \
	<div id="NODE_ID" class="node node-label-normal node-ele-normal"> \
	<div id="NODE_LABEL_ID" class="node-label"> \
	    <h4>NODE_LABEL_NAME</h4> \
	    <div class="node-label-uuid">NODE_LABEL_UUID</div> \
	</div> \
	<svg width="SVG_WIDTH" \
	     height="SVG_HEIGHT" \
	     id="SVG_ID" \
	     class="node-svg"> \
	    <circle \
		    cx="SVG_CX" \
		    cy="SVG_CY" \
		    r="SVG_R" \
		    fill="SVG_COLOR" /> \
	</svg> \
	</div> \
';
