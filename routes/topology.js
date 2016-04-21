var express = require('express');
var router = express.Router();
var dc2request = require('request');
var jsyaml = require('js-yaml');
var logger = require('destcloud/utils/logger');

router.use(function timeLog(req, res, next) {
    logger.debug('Time:', Date.now());
    next();
});

/* GET topology */
router.get('/', function(req, res, next) {

    var dc1response = res;

    var options = {
      url: 'http://' + router.opts.host + ':' + router.opts.port + '/topology',
    };

/*
TODO: save entire_topology_ID
    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var upsertUuid = function(db, callback) {
	var data = {
	    entire_topology_ID: entire_topology_ID,
	};
	db.collection('uuids').insertOne({
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
*/


    dc2request.get(options)
	.on('response', function(res2) {
	    var body = '';
	    res2.setEncoding('utf8');
	    res2
		.on('data', function(chunk) {
		    body += chunk;
		})
		.on('end', function(res) {
		    var json = jsyaml.load(body);
		    dc1response.send(json);
		});
	})
	.on('error', function(err2) {
	    if (err2.status) {
		logger.error('GET /topology: ' + err2.status);
		dc1response.sendStatus(err2.status);
	    } else {
		logger.error('GET /topology: ' + err2.message);
		dc1response.status(503).send(err2.message);
	    }
	});
});

module.exports = function(opts) {
    router.opts = opts;
    return router;
}
