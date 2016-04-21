var express = require('express');
var router = express.Router();
var dc2request = require('request');
var jsyaml = require('js-yaml');
var mongo = require('mongodb').MongoClient;
var logger = require('destcloud/utils/logger');

router.use(function timeLog(req, res, next) {
    logger.debug('Time:', new Date());
    next();
});

router.get('/:sub_topology_id', function(req, res, next) {

    var subt_id = req.params.sub_topology_id;

    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var findScenarioBySubTopologyId = function(db, id, callback) {

	var list = [];
	var cursor = db.collection('scenario').find({ "data.subTopologyId":id});
	cursor.each(function(err, doc) {
	    if (err) {
		callback();
		var msg = 'mongodb cursor error: ' + err.message;
		logger.err(msg);
		res.status(500).send(msg);
		return;
	    }

	    if (doc != null) {
		list.push(doc);
	    } else {
		callback();
//		console.log("== scenario list");
//		console.log(list);
		res.send(JSON.stringify(list));
	    }
	});

    };

    mongo.connect(mongourl, function(err, db) {

	if (err) {
	    var msg = 'Cannot connect mongodb. url=' + mongourl + ' ' + err.message;
	    logger.error(msg);
	    res.status(500).send(msg);
	    return;
	}
	findScenarioBySubTopologyId(db, subt_id, function() {
	    db.close();
	});
    });
});

/* POST scenario */
router.post('/', function(req, res, next) {

    var start_time = req.body.time;
    var scenarioId = req.body.scenario_ID;
    var creation_time = req.body.creation_time;
    var scenario = JSON.parse(req.body.scenario);
    var sub_topology_id = undefined;

    scenario.forEach(function(v, i) {
	if (v.sub_topology_ID) {
	    sub_topology_id = v.sub_topology_ID;
	}
    });

    logger.debug("== scenario start time: " + start_time);
    logger.debug("== scenario ID: " + scenarioId);
    logger.debug("== creation time: " + creation_time);
    logger.debug("== sub topology ID: " + sub_topology_id);
    logger.debug("== scenario ");
    logger.debug(scenario);

    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var findScenario = function(db, id, insertCallback) {

	var list = [];
	var cursor = db.collection('scenario').find({ "data.scenarioID":id});
	cursor.count(function(err, count) {
	    // TODO: error
	    if (count == 0) {
		insertCallback();
	    } else {
		logger.info("Find same scenario. " + scenarioId);
		db.close();
	    }
	});
    };

    var insertScenario = function(db, callback) {
	var data = {
	    scenarioID: scenarioId,
	    creation_time: creation_time,
	    subTopologyId: sub_topology_id,
	    scenario: scenario,
	};
	db.collection('scenario').insertOne({
	    data,
	}, function(err, result) {
	    if (err) {
		callback();
		var msg = 'mongodb insertOne error: ' + err.message;
		logger.err(msg);
		res.status(500).send(msg);
		return;
	    }
	    logger.info("Insert a scenario into the scenario collection. " + result.insertedId);
	    callback();
	});
    };

    var dc1response = res;
    var uri = 'http://' + router.opts.host + ':' + router.opts.port;

    if (start_time != 0) {
	var date = Math.floor(new Date(start_time).getTime() / 1000);
	uri +=  '/scenario/' + date;
    } else {
	uri +=  '/scenario/';
    }
    logger.info("uri=" + uri);

    try {
	var yaml = jsyaml.safeDump(scenario);
    } catch (err) {
	logger.error("yaml dump error: " + err.message);
	dc1response.status(500).send('yaml dump error: ' + err.message);
	return;
    }
    logger.debug("== scenario yaml");
    logger.debug(yaml);


/* TODO: in case of using form/data
    var formData = {
	time: date,
	scenario: yaml,
    };

    dc2request({
	method: 'POST',
	uri: uri,
	formData: formData
    })
*/

    dc2request(
	{ method: 'POST',
	  uri: uri,
	  headers: {
	    'content-type' : 'application/x-yaml; charset=utf-8',
	  },
	  body: yaml,
	}
    )
    .on('response', function(dc2response) {
	logger.debug('== dc2request response: ' + dc2response.statusCode);

	if (dc2response.statusCode == 200) {
	    var body = '';
	    dc2response
		.on('data', function(chunk) {
		    body += chunk;
		})
		.on('end', function() {

		    var json = jsyaml.safeLoad(body);
		    logger.debug("  job_id: " + json.job_id);

		    // save scenario to mongoDB
		    mongo.connect(mongourl, function(err, db) {
			if (err) {
			    var msg = 'Cannot connect mongodb. url='
				    + mongourl + ' ' + err.message;
			    logger.error(msg);
			    res.status(500).send(msg);
			    return;
			}
			findScenario(db, scenarioId, function() {
			    insertScenario(db, function() {
				db.close();
			    });
			});
		    });
			
		    dc1response.status(dc2response.statusCode).send(json);
		});
	} else {
	    dc1response.sendStatus(dc2response.statusCode);
	}

    })
    .on('error', function(err) {
	if (err.status) {
	    logger.error('POST /scenario: ' + err.status);
	    dc1response.sendStatus(err.status);
	} else {
	    logger.error('POST /scenario: ' + err.message);
	    dc1response.status(503).send(err.message);
	}
    });
});

module.exports = function(opts) {
    router.opts = opts;
    return router;
}
