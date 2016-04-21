//
// Config
//

DC.Config = function() {

    this.config = DC.Config.default;
};

DC.Config.prototype = {

    constructor: DC.Config,

};

DC.Config.default = {

    /* timeout */
    timeout: {
	ajax:	30 * 1000,		// 30secs
    },

    estimate_end_time_margin: 10000,	// 10secs

    /* log auto update [sec] */
    auto_update_period: 3,
    max_logs: 5000,

    /* topology get */
    entities: {
	polling: {
	    period:		1000,	// millisec
	    timeout_count:	30,	
	}
    },

    /* node, line, port */
    entity: {
    },

    port: {
	radius: 10,
    },

    line: {
	connector_type: 'StateMachine',
    },

    /* color */
    color: {
	box_bg: {
	    subtopology_mode: {
		fg: '#ffe0c1',
		bg: 'rgba(255, 255, 224, 0.4)',
	    },
	    scenario_mode: {
		fg: '#c1e0ff',
		bg: 'rgba(224, 238, 255, 0.4)',
	    }
	},
	/* svg element default color */
	node: 'rgba(53, 53, 53, 0.8)',

    },

    /* blockUI css */
    block_css: {
	css: {
	    fontSize: '10px',
	    border: 'none',
	    padding: '10px',
	    backgroundColor: '#000',
	    'border-radius': '5px',
	    '-webkit-border-radius': '5px',
	    '-moz-border-radius': '5px',
	    opacity: 0.5,
	    color: '#fff'
	}
    },
};

//
// constant values
//
DC.Config.ENTITIES = {
    status: {
	processing: 'processing',
	available: 'topology available',
	timeout: 'process timeout',
    },
};
