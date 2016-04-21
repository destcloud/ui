var express = require('express');
var router = express.Router();
var dc2request = require('request');
var jsyaml = require('js-yaml');
var logger = require('destcloud/utils/logger');

router.use(function timeLog(req, res, next) {
    logger.debug('Time:', Date.now());
    next();
});

/* POST sub_topology */
router.post('/', function(req, res, next) {

    var dc1response = res;

    var uri = 'http://' + router.opts.host + ':' + router.opts.port;
    uri +=  '/sub_topology';

    try {
	var yaml = jsyaml.safeDump(req.body);
    } catch (err) {
	logger.error('yaml dump error: ' + err.message);
	dc1response.status(500).send('yaml dump error: ' + err.message);
	return;
    }
    logger.debug("== sub_topology body");
    logger.debug(req.body);
    logger.debug("== sub_topology yaml");
    logger.debug(yaml);

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
		    logger.silly("  dc2response body: " + body);

		    var json = jsyaml.safeLoad(body);
		    logger.debug("  sub_topology_ID: " + json.sub_topology_ID);

		    dc1response.status(dc2response.statusCode).send(json);
		});
	} else {
	    dc1response.sendStatus(dc2response.statusCode);
	}
    })
    .on('error', function(err) {
	logger.error('dc2request error: ' + err.message);
	// TODO: use 504 (Gateway Timeout)??
	dc1response.status(503).send(err.message);
    });

});

module.exports = function(opts) {
    router.opts = opts;
    return router;
}
