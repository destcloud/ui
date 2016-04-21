var express = require('express');
var router = express.Router();
var dc2request = require('request');
var jsyaml = require('js-yaml');
var logger = require('destcloud/utils/logger');

/* GET entities */
router.get('/', function(req, res, next) {

    var dc1response = res;

    var options = {
      url: 'http://' + router.opts.host + ':' + router.opts.port + '/entities',
    };

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
		logger.error('GET /entities: ' + err2.status);
		dc1response.sendStatus(err2.status);
	    } else {
		logger.error('GET /entities: ' + err2.message);
		dc1response.status(503).send(err2.message);
	    }
	});
});

/* POST entities */
router.post('/', function(req, res, next) {

    var dc1response = res;

    var uri = 'http://' + router.opts.host + ':' + router.opts.port;
    uri +=  '/entities';

    try {
	var yaml = jsyaml.safeDump(req.body);
    } catch (err) {
	logger.error('yaml dump error: ' + err.message);
	dc1response.status(500).send('yaml dump error: ' + err.message);
	return;
    }
    logger.debug("== entities yaml");
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
	dc1response.sendStatus(dc2response.statusCode);
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
