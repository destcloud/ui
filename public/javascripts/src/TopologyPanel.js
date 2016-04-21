//
// Topology Panel
//

DC.TopologyPanel = function() {

    this.jsp = undefined;

    this.grid = new DC.Grid();

    this.topology = undefined;

    this.nodes = {};
    this.connections = {};
    this.transparent_node_count = 0;
    this.transparent_number_offset = 1000;

    this.endpoint_menu = undefined;
    this.connection_menu = undefined;

    this.subtopology_mode = false;

    this.scenario_mode = false;

    // subtopology mode: select endpoint that is opposite side
    this.opposite_endpoint = true;
    // subtopology mode: select endpoint that belongs to line
    this.line_endpoint = true;

    this.init();
};

DC.TopologyPanel.prototype = {
    
    constructor: DC.TopologyPanel,

    init: function() {

	this.jsp = jsPlumb.getInstance({
	});
	this.jsp.setContainer(DC.TopologyPanel.CONTAINER_NAME);

	this.jsp.importDefaults({
	    Anchor: 'Continuous',
	    ConnectionDetachable: false,
	    Connector: DC.C.config.line.connector_type,
	    Endpoint: [ 'Dot', {
		radius: DC.C.config.port.radius,
	    }],
	});

	this.endpoint_menu = new DC.EndpointMenu();
	this.connection_menu = new DC.ConnectionMenu();

	// set #tabs area height
	// TODO
/*
	var tab_h = $('body').innerHeight() -
			    $('#title-area').innerHeight() -
			    $('#running-area').innerHeight() -
			    $('#topology-area').innerHeight() - 3;
	$('#tab-area').innerHeight(tab_h);
*/

	$('#topology-area').resizable({
	    handles: "s",
	    resize: function(ev, ui) {
		var tab_h = $('body').innerHeight() -
				    $('#title-area').innerHeight() -
				    $('#running-area').innerHeight() -
				    $('#topology-area').innerHeight() - 3;
		$('#tab-area').innerHeight(tab_h);
	    },
	});

    },

    getNode: function(id) {

	return this.nodes[id];
    },

    getEndpoint: function(routerId, ifNumber) {

	var node = this.getNode(routerId);
	return node.getEndpointByIfNumber(ifNumber);
    },

    getConnection: function(id) {
    
	return this.connections[id];
    },


    create: function(topology) {

	console.log("== TopologyPanel.create");

	var self = this;
	this.topology = new DC.Topology(topology);

	$('#entire-topology-id').text(this.topology.entire_topology_id);
	$('#sub-topology-id').text('');

	// create node
	for (var i = 0; i < topology.length; i++) {
	    var entity = topology[i];
	    if (entity.entity_type === DC.Entity.type.router) {
		var node = new DC.Node(this.jsp,
					$(DC.TopologyPanel.CONTAINER_ID),
					this.endpoint_menu,
					entity,
					i,
					!this.topology.has_line);
		this.nodes[entity.ID] = node;
		DC.logPanel.history.addNode(this.topology.entire_topology_id, entity.ID);
	    }
	}

	// Node element event
	$('.node').each(function(index, ele) {
	    $(ele).on('mouseover', function(ev) {
		    if (!DC.topologyPanel.subtopology_mode) return;

		    DC.Topology.addElementStyle(
			DC.Topology.elementType.node,
			ele,
			DC.Topology.elementState.subt_hover
		    );
		    DC.Topology.addElementStyle(
			DC.Topology.elementType.node_label,
			ele,
			DC.Topology.elementState.subt_hover
		    );
		    var id = $(ele).find('.node-label-uuid').text();
		    var node = self.getNode(id);
		    // TODO: check error
		    $.each(node.endpoints, function(endp_uuid, endpoint) {
			DC.Topology.addElementStyle(
			    DC.Topology.elementType.endpoint,
			    endpoint,
			    DC.Topology.elementState.subt_hover
			);
			var conn = self.connectionHasEndpoint(endpoint);
			if (conn) {
			    DC.Topology.addElementStyle(
				DC.Topology.elementType.connection,
				conn,
				DC.Topology.elementState.subt_hover
			    );
			    if (self.opposite_endpoint) {
				$.each(conn.endpoints, function(epuuid, ep) {
				    DC.Topology.addElementStyle(
					DC.Topology.elementType.endpoint,
					ep,
					DC.Topology.elementState.subt_hover
				    );
				});
			    }
			}
		    });
		})
		.on('mouseout', function(ev) {
		    if (!DC.topologyPanel.subtopology_mode) return;

		    DC.Topology.removeElementStyle(
			DC.Topology.elementType.node,
			ele,
			DC.Topology.elementState.subt_hover
		    );
		    DC.Topology.removeElementStyle(
			DC.Topology.elementType.node_label,
			ele,
			DC.Topology.elementState.subt_hover
		    );
		    var id = $(ele).find('.node-label-uuid').text();
		    var node = self.getNode(id);
		    // TODO: check error
		    $.each(node.endpoints, function(endp_uuid, endpoint) {
			DC.Topology.removeElementStyle(
			    DC.Topology.elementType.endpoint,
			    endpoint,
			    DC.Topology.elementState.subt_hover
			);
			var conn = self.connectionHasEndpoint(endpoint);
			if (conn) {
			    DC.Topology.removeElementStyle(
				DC.Topology.elementType.connection,
				conn,
				DC.Topology.elementState.subt_hover
			    );
			    if (self.opposite_endpoint) {
				$.each(conn.endpoints, function(epuuid, ep) {
				    DC.Topology.removeElementStyle(
					DC.Topology.elementType.endpoint,
					ep,
					DC.Topology.elementState.subt_hover
				    );
				});
			    }
			}
		    });
		})
		.on('click', function(ev) {
		    if (!DC.topologyPanel.subtopology_mode) return;

		    var stat = self.topology.toggleState(ele);

		    if (stat) {
			DC.Topology.setElementStyle(
			    DC.Topology.elementType.node,
			    ele,
			    DC.Topology.elementState.subt_enable
			);
			DC.Topology.setElementStyle(
			    DC.Topology.elementType.node_label,
			    ele,
			    DC.Topology.elementState.subt_enable
			);
		    } else {
			DC.Topology.setElementStyle(
			    DC.Topology.elementType.node,
			    ele,
			    DC.Topology.elementState.subt_disable
			);
			DC.Topology.setElementStyle(
			    DC.Topology.elementType.node_label,
			    ele,
			    DC.Topology.elementState.subt_disable
			);
		    }

		    var id = $(ele).find('.node-label-uuid').text();
		    var node = self.getNode(id);
		    // TODO: check error
		    $.each(node.endpoints, function(endp_uuid, endpoint) {
			if (stat) {
			    DC.Topology.setElementStyle(
				DC.Topology.elementType.endpoint,
				endpoint,
				DC.Topology.elementState.subt_enable
			    );
			} else {
			    DC.Topology.setElementStyle(
				DC.Topology.elementType.endpoint,
				endpoint,
				DC.Topology.elementState.subt_disable
			    );
			}
			var conn = self.connectionHasEndpoint(endpoint);
			if (conn) {
			    if (stat) {
				self.topology.enableState(conn);
				DC.Topology.setElementStyle(
				    DC.Topology.elementType.connection,
				    conn,
				    DC.Topology.elementState.subt_enable
				);
				DC.Topology.setElementStyle(
				    DC.Topology.elementType.label,
				    conn,
				    DC.Topology.elementState.subt_enable
				);
			    } else {
				self.topology.disableState(conn);
				DC.Topology.setElementStyle(
				    DC.Topology.elementType.connection,
				    conn,
				    DC.Topology.elementState.subt_disable
				);
				DC.Topology.setElementStyle(
				    DC.Topology.elementType.label,
				    conn,
				    DC.Topology.elementState.subt_disable
				);
			    }
			    if (self.opposite_endpoint) {
				$.each(conn.endpoints, function(epuuid, ep) {
				    if (stat) {
					DC.Topology.setElementStyle(
					    DC.Topology.elementType.endpoint,
					    ep,
					    DC.Topology.elementState.subt_enable
					);
				    } else {
					DC.Topology.setElementStyle(
					    DC.Topology.elementType.endpoint,
					    ep,
					    DC.Topology.elementState.subt_disable
					);
				    }
				});
			    }
			}
		    });
		    if (!self.topology.equalTopologyCheckedStatus()) {
			DC.enableBtn('#send-subtopology-btn');
			DC.disableBtn('#scenario-mode-toggle');
		    } else {
			if (DC.entitiesPanel.subtopology_has_sent) {
			    DC.disableBtn('#send-subtopology-btn');
			    DC.enableBtn('#scenario-mode-toggle');
			}
		    }
		});
	});

	
	// create line
	this.jsp.batch(function() {
	    for (var i = 0; i < topology.length; i++) {
		var entity = topology[i];
		if (entity.entity_type == DC.Entity.type.line) {

		    var node0 = undefined;
		    var node0_port = 0;
		    var node0_endp = undefined;
		    if (entity.nodes[0]) {
			var router_id = entity.nodes[0].routerID || entity.nodes[0].router_ID;
			node0 = self.nodes[router_id];
			if (node0) {
			    node0_port = node0.getEndpointUuid(entity.nodes[0].router_IF_number);
			    node0_endp = node0.getEndpointByIfNumber(entity.nodes[0].router_IF_number);
			}
		    }
		    if (!node0) {
			var dummy_entity = {
			    entity_name: 'transparent' + self.transparent_node_count,
			    ID: jsPlumbUtil.uuid().toUpperCas(),
			    IF_numbers: 20,
			};
			node0 = new DC.TransparentNode(self.jsp,
					$(DC.TopologyPanel.CONTAINER_ID),
					self.endpoint_menu,
					dummy_entity,
					self.transparent_node_count + self.transparent_number_offset,
					!self.topology.has_line);
			self.transparent_node_count++;
			self.nodes[entity.ID] = node0;
			node0_port = node0.getEndpointUuid(0);
			node0_endp = node0.getEndpointByIfNumber(0);
		    }
		    if (node0_endp.connections.length > 0) {
			console.log("node0 endpoint already has connection." + node0_port);
			continue;
		    }

		    var node1 = undefined;
		    var node1_port = 0;
		    var node0_endp = undefined;
		    if (entity.nodes[1]) {
			var router_id = entity.nodes[1].routerID || entity.nodes[1].router_ID;
			node1 = self.nodes[router_id];
			if (node1) {
			    node1_port = node1.getEndpointUuid(entity.nodes[1].router_IF_number);
			    node1_endp = node1.getEndpointByIfNumber(entity.nodes[1].router_IF_number);
			}
		    }
		    if (!node1) {
			var dummy_entity = {
			    entity_name: 'transparent' + self.transparent_node_count,
			    ID: jsPlumbUtil.uuid().toUpperCase(),
			    IF_numbers: 20,
			};
			node1 = new DC.TransparentNode(self.jsp,
					$(DC.TopologyPanel.CONTAINER_ID),
					self.endpoint_menu,
					dummy_entity,
					self.transparent_node_count + self.transparent_number_offset,
					!self.topology.has_line);
			self.transparent_node_count++;
			self.nodes[entity.ID] = node1;
			node1_port = node1.getEndpointUuid(0);
			node1_endp = node1.getEndpointByIfNumber(0);
		    }
		    if (node1_endp.connections.length > 0) {
			console.log("node1 endpoint already has connection." + node1_port);
			continue;
		    }

		    console.log("line: " + node0_port + ", " + node1_port);

		    DC.logPanel.history.addLine(self.topology.entire_topology_id, entity.ID);

		    var conn = self.jsp.connect({
			uuids: [node0_port, node1_port],
			detachable: false,
			parameters: {
			    entityId: entity.ID,
			    faults: [],
			    nodes: [node0, node1],
			},
			overlays: [
			    [ 'Label', {
				label: entity.ID,
				id: entity.ID,
				location: 0.5,
				labelStyle: {
				    cssClass: 'conn-label conn-label-normal',
				},
				events: {
				    mouseover: function(label, orgEvent) {
					if (!self.scenario_mode && !self.subtopology_mode) return;
					// NOTE: delegate to connection
				    },
				    mouseout: function(label, orgEvent) {
					if (!self.scenario_mode && !self.subtopology_mode) return;
					// NOTE: delegate to connection
				    },
				    click: function(label, orgEvent) {
					if (!self.scenario_mode && !self.subtopology_mode) return;
					// NOTE: delegate to connection
				    },
				},
			    }]
			],
		    });
		    DC.Topology.setElementStyle(
			    DC.Topology.elementType.connection,
			    conn,
			    DC.Topology.elementState.normal);
		    conn
			.bind('mouseover', function(connection, orgEvent) {
			    if (!self.scenario_mode && !self.subtopology_mode) return;

			    if (connection instanceof jsPlumb.Overlays.Label) {
				connection = connection.component;
			    }

			    if (self.subtopology_mode) {

				var nodes = connection.getParameter('nodes');
				if ($('#' + nodes[0].id).hasClass('node-ele-subt-disable') || $('#' + nodes[1].id).hasClass('node-ele-subt-disable')) return;

				DC.Topology.addElementStyle(
				    DC.Topology.elementType.connection,
				    connection,
				    DC.Topology.elementState.subt_hover
				);
				DC.Topology.addElementStyle(
				    DC.Topology.elementType.label,
				    connection,
				    DC.Topology.elementState.subt_hover
				);
				if (self.line_endpoint) {
				    $.each(connection.endpoints, function(id, ep) {
					DC.Topology.addElementStyle(
					    DC.Topology.elementType.endpoint,
					    ep,
					    DC.Topology.elementState.subt_hover
					);
				    });
				}
			    } else if (self.scenario_mode) {

				if (connection.hasClass('conn-subt-disable')) {
				    return;
				}
				DC.Topology.addElementStyle(
				    DC.Topology.elementType.connection,
				    connection,
				    DC.Topology.elementState.scenario_hover
				);
				DC.Topology.addElementStyle(
				    DC.Topology.elementType.label,
				    connection,
				    DC.Topology.elementState.scenario_hover
				);
				var faults = DC.scenarioPanel.getFaults(connection.id);
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

			})
			.bind('mouseout', function(connection, orgEvent) {
			    if (!self.scenario_mode && !self.subtopology_mode) return;

			    if (connection instanceof jsPlumb.Overlays.Label) {
				connection = connection.component;
			    }

			    if (self.subtopology_mode) {

				var nodes = connection.getParameter('nodes');
				if ($('#' + nodes[0].id).hasClass('node-ele-subt-disable') || $('#' + nodes[1].id).hasClass('node-ele-subt-disable')) return;

				DC.Topology.removeElementStyle(
				    DC.Topology.elementType.connection,
				    connection,
				    DC.Topology.elementState.subt_hover
				);
				DC.Topology.removeElementStyle(
				    DC.Topology.elementType.label,
				    connection,
				    DC.Topology.elementState.subt_hover
				);
				if (self.line_endpoint) {
				    $.each(connection.endpoints, function(id, ep) {
					DC.Topology.removeElementStyle(
					    DC.Topology.elementType.endpoint,
					    ep,
					    DC.Topology.elementState.subt_hover
					);
				    });
				}

			    } else if (self.scenario_mode) {

				if (connection.hasClass('conn-subt-disable')) {
				    return;
				}
				DC.Topology.removeElementStyle(
				    DC.Topology.elementType.connection,
				    connection,
				    DC.Topology.elementState.scenario_hover
				);
				DC.Topology.removeElementStyle(
				    DC.Topology.elementType.label,
				    connection,
				    DC.Topology.elementState.scenario_hover
				);
				var faults = connection.getParameter('faults');
				if (faults.length > 0) {
				    $('#faults-menu').remove();
				}
			    }

			})
			.bind('click', function(connection, orgEvent) {
			    if (!self.scenario_mode && !self.subtopology_mode) return;

			    if (connection instanceof jsPlumb.Overlays.Label) {
				connection = connection.component;
			    }

			    if (self.subtopology_mode) {

				var nodes = connection.getParameter('nodes');
				if ($('#' + nodes[0].id).hasClass('node-ele-subt-disable') || $('#' + nodes[1].id).hasClass('node-ele-subt-disable')) return;

				var stat = self.topology.toggleState(connection);

				if (stat) {
				    DC.Topology.setElementStyle(
					DC.Topology.elementType.connection,
					connection,
					DC.Topology.elementState.subt_enable
				    );
				    DC.Topology.setElementStyle(
					DC.Topology.elementType.label,
					connection,
					DC.Topology.elementState.subt_enable
				    );
				} else {
				    DC.Topology.setElementStyle(
					DC.Topology.elementType.connection,
					connection,
					DC.Topology.elementState.subt_disable
				    );
				    DC.Topology.setElementStyle(
					DC.Topology.elementType.label,
					connection,
					DC.Topology.elementState.subt_disable
				    );
				}
				if (self.line_endpoint) {
				    $.each(connection.endpoints, function(id, ep) {
					if (stat) {
					    DC.Topology.setElementStyle(
						DC.Topology.elementType.endpoint,
						ep,
						DC.Topology.elementState.subt_enable
					    );
					} else {
					    DC.Topology.setElementStyle(
						DC.Topology.elementType.endpoint,
						ep,
						DC.Topology.elementState.subt_disable
					    );
					}
					
				    });
				}
				if (!self.topology.equalTopologyCheckedStatus()) {
				    DC.enableBtn('#send-subtopology-btn');
				    DC.disableBtn('#scenario-mode-toggle');
				} else {
				    if (DC.entitiesPanel.subtopology_has_sent) {
					DC.disableBtn('#send-subtopology-btn');
					DC.enableBtn('#scenario-mode-toggle');
				    }
				}

			    } else if (self.scenario_mode) {

				if (connection.hasClass('conn-subt-disable')) {
				    return;
				}

				if (self.connection_menu.isShown()) return;

				DC.Topology.setElementStyle(
				    DC.Topology.elementType.connection,
				    connection,
				    DC.Topology.elementState.scenario_hover
				);

				DC.Topology.setElementStyle(
				    DC.Topology.elementType.label,
				    connection,
				    DC.Topology.elementState.scenario_hover
				);

				self.connection_menu.setConnection(connection);
				self.connection_menu.checkRecover();
				self.connection_menu.show(orgEvent.clientX, orgEvent.clientY);
			    }
			});

		    self.connections[entity.ID] = conn;
		}
	    }
	});
    },

    clear: function() {

	this.topology = undefined;

	this.jsp.reset();
	$('.node').remove();
	this.nodes = {};
	this.connections = {};
    },

    clearFaults: function() {

	$.each(this.nodes, function(id, node) {
	    node.clearFaults();
	});

	$.each(this.connections, function(id, connection) {
	    DC.Topology.setElementStyle(
		DC.Topology.elementType.connection,
		connection,
		DC.Topology.elementState.normal
	    );
	    DC.Topology.setElementStyle(
		DC.Topology.elementType.label,
		connection,
		DC.Topology.elementState.normal
	    );
	});
    },

    createFaultPointMenu: function(faults) {

	var items = "";
	$.each(faults, function(i, fault) {
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

    toggleScenarioMode: function() {

	this.scenario_mode = !this.scenario_mode;

	// TODO: disable scenario mode button in subtopology mode
	if (this.scenario_mode && this.subtopology_mode) {
	    console.log("subtopology mode is off.");
	    this.toggleSubTopologyMode();
	}
	console.log("== scenario mode: " + this.scenario_mode);

	this.setScenarioMode(this.scenario_mode);
    },

    toggleSubTopologyMode: function() {


	this.subtopology_mode = !this.subtopology_mode;

	// TODO: disable subtopology mode button in scenario mode
	if (this.subtopology_mode && this.scenario_mode) {
	    console.log("scenario_mode is off.");
	    this.toggleScenarioMode();
	}
	console.log("== subtopology mode: " + this.subtopology_mode);

	this.setSubTopologyMode(this.subtopology_mode);
    },

    disableSubTopologyMode: function() {

	this.subtopology_mode = false;
	console.log("== subtopology mode: " + this.subtopology_mode);

	this.setSubTopologyMode(this.subtopology_mode);
    },

    setScenarioMode: function(flag) {

	if (flag) {
	    console.log("enter scenario mode");
	    $('#send-scenario-btn').button( "option", "disabled", true);
	    var box = $('#topology-box-bg');
	    box.text('Scenario Mode');
	    box.css('color', DC.C.config.color.box_bg.scenario_mode.fg);
	    box.css('background-color', DC.C.config.color.box_bg.scenario_mode.bg);
	    box.show();

	} else {
	    console.log("exit scenario mode");
	    $('#send-scenario-btn').button( "option", "disabled", false);
	    $('#topology-box-bg').hide();
	}
    },

    setSubTopologyMode: function(flag) {


	if (flag) {
	    console.log("enter subtopology mode");
	    var box = $('#topology-box-bg');
	    box.text('Sub Topology Mode');
	    box.css('color', DC.C.config.color.box_bg.subtopology_mode.fg);
	    box.css('background-color', DC.C.config.color.box_bg.subtopology_mode.bg);
	    box.show();
	    DC.enableBtn($('#send-subtopology-btn'));
	} else {
	    console.log("exit subtopology mode");
	    $('#topology-box-bg').hide();
	}
    },

    highlightPort: function(routerId, ifNumber, sw) {

	var node = this.getNode(routerId);
	if (!node) {
	    // TODO: error processing
	    console.error("Cannot get node: routerId=" + routerId);
	    return;
	}
	node.highlightPort(ifNumber, sw);
    },

    highlightLine: function(lineId, sw) {

	var conn = this.connections[lineId];
	if (!conn) {
	    // TODO: error processing
	    console.error("Cannot get connection: lineId=" + lineId);
	    return;
	}
	if (sw) {
	    DC.Topology.setElementStyle(
		DC.Topology.elementType.connection,
		conn,
		DC.Topology.elementState.scenario_highlight
	    );
	} else {
	    DC.Topology.setElementStyle(
		DC.Topology.elementType.connection,
		conn,
		DC.Topology.elementState.scenario_faulted
	    );
	}

    },

    connectionHasEndpoint: function(endpoint) {

	var conn = undefined;
	$.each(this.connections, function(conn_uuid, connection) {
	    $.each(connection.endpoints, function(i, endp) {
		if (endp == endpoint) {
		    conn = connection;
		    return false;
		}
	    });
	    if (conn) return false;
	});
	return conn;
    },

};

DC.TopologyPanel.CONTAINER_NAME = 'topology-box';
DC.TopologyPanel.CONTAINER_ID = '#topology-box';
DC.TopologyPanel.SCENARIO_CLASS = 'scenario-mode';


