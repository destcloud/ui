var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var logger = require('destcloud/utils/logger');

var MAX_LOGS = 5000;

/* GET search logs */
/*
 * query params is JSON
 *
 * start_time: <start_time>
 * end_time: <end_time>
 * uuids: [ <uuids> ]
 * text: <string>
 * destcloud: [true|false]
 *
 */
router.get('/', function(req, res, next) {

    logger.debug("== GET search: query: ");
    logger.debug(req.query);

    var dc_flag = (req.query.destcloud === 'true') ? true : false;

    var findLog = undefined;

    if (req.query.start_time || req.query.end_time) {

	// time range search
	var start_time = Number(req.query.start_time);
	var end_time = Number(req.query.end_time);

	findLog = function(db, callback) {
	    var query;
	    if (start_time && end_time) {
		var start_isodate = new Date(start_time).toISOString();
		var end_isodate = new Date(end_time).toISOString();
		logger.debug("  start ISODate: " + start_isodate);
		logger.debug("  end   ISODate: " + end_isodate);
		query = { "time" : {
				"$gte" : new Date(start_isodate),
				"$lte" : new Date(end_isodate)
			}};
	    } else if (start_time) {
		var start_isodate = new Date(start_time).toISOString();
		logger.debug("  start ISODate: " + start_isodate);
		query = { "time" : {
				"$gte" : new Date(start_isodate)
			}};
	    } else if (end_time) {
		var end_isodate = new Date(end_time).toISOString();
		logger.debug("  end   ISODate: " + end_isodate);
		query = { "time" : {
				"$lte" : new Date(end_isodate)
			}};
	    }
	
	    queryLog(dc_flag, db, query, res, callback);		
	};

    } else if (req.query.uuids) {
	// uuids search

	var regex = [];
	req.query.uuids.forEach(function(v, i) {
	    if (v) regex.push(new RegExp(v, 'i'));
	});
	findLog = function(db, callback) {
	    var query = { "message" : { $in: regex }};
	    queryLog(dc_flag, db, query, res, callback);		
	};

    } else if (req.query.text) {

	logger.debug("  search text: " + req.query.text);

	// text search
	findLog = function(db, callback) {
	    var query = { "message" : new RegExp(req.query.text, 'i') };
	    queryLog(dc_flag, db, query, res, callback);		
	};
    } else { 
	findLog = function(db, callback) {
	    var query = {};
	    queryLog(dc_flag, db, query, res, callback);		
	};
    }


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

	findLog(db, function() {
	    db.close();
	});
    });
});

var queryLog = function(dc_flag, db, query, res, callback) {

    if (dc_flag) {
	query.ident = new RegExp(/destcloud/i);
    }

    var list = [];
    var cursor = db.collection('logs').find(query);
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

	    list.sort(function(a, b) {
		return a.time - b.time;
	    });

	    if (list.length > MAX_LOGS) {
		logger.debug("list length = " + list.length);
		list = list.slice(list.length - MAX_LOGS);
		logger.debug("reduced list length = " + list.length);
	    }
	    res.send(JSON.stringify(list));
	}
    });
};


// logs opts
//    dbhost: mongoDB host
//    dbpost: mongoDB port
//    dbname: mongoDB db name
//
module.exports = function(opts) {
    router.opts = opts;
    return router;
}
