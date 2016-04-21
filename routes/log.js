var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var logger = require('destcloud/utils/logger');

var MAX_LOGS = 5000;

/* GET logs
 * query params is JSON
 *
 * time: <last time>
 * destcloud: [true|false] -- ident destcloud[123] only
 */
router.get('/', function(req, res, next) {

    logger.info("== GET logs: query: ");
    logger.info(req.query);

    var destcloud_flag = (req.query.destcloud === 'true') ? true : false;

    var url = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport +
		    '/' + router.opts.dbname;

    var logs = [];
    mongo.connect(url, function(err, db) {

	if (err) {
	    var msg = 'Cannot connect mongodb. url=' + url + ' ' + err.message;
	    logger.error(msg);
	    res.status(500).send(msg);
	    return;
	}

	var isodate = new Date(Number(req.query.time)).toISOString();
	logger.info("  ISODate: " + isodate);

	var query;
	if (destcloud_flag) {
	    query = { 'time':
			{ '$gt' : new Date(isodate) },
		      'ident': new RegExp(/destcloud/i)
		    };
	} else {
	    query = { 'time': { '$gt' : new Date(isodate) } };
	}

	var cursor = db.collection('logs').find(query);
	cursor.each(function(err, doc) {
	    if (doc != null) {
		logs.push({
		    time: doc.time.getTime(),
		    message: doc.message,
		    host: doc.host,
		    ident: doc.ident,
		});
	    } else {
		db.close();

		logs.sort(function(a, b) {
		    return a.time - b.time;
		});

		if (logs.length > MAX_LOGS) {
		    logger.debug("logs length = " + logs.length);
		    logs = logs.slice(logs.length - MAX_LOGS);
		    logger.debug("reduced logs length = " + logs.length);
		}
		var json = JSON.stringify(logs);
		res.send(json);
	    }
	});
    });

});

// logs opts
//    dbhost: mongoDB host
//    dbpost: mongoDB port
//    dbname: mongoDB db name
//
module.exports = function(opts) {
    router.opts = opts;
    return router;
}
