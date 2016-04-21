var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var logger = require('destcloud/utils/logger');

router.use(function timeLog(req, res, next) {
    logger.debug('Time:', new Date());
    next();
});

/* GET history */
router.get('/', function(req, res, next) {

    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var getHistory = function(db, callback) {

	var history = [];
	var cursor = db.collection('history').find().limit(1);
	cursor.each(function(err, doc) {
	    if (err) {
		callback();
		var msg = 'mongodb cursor error: ' + err.message;
		logger.err(msg);
		res.status(500).send(msg);
		return;
	    }

	    if (doc != null) {
		history = doc.history;
	    } else {
		callback();
		res.send(JSON.stringify(history));
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
	getHistory(db, function() {
	    db.close();
	});
    });
});

/* POST history */
router.post('/', function(req, res, next) {

    logger.debug("== history");
    logger.debug(req.body);

    var history = req.body;

    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var replaceHistory = function(db, history, callback) {

	db.collection('history').findOneAndReplace(
				    {},
				    history,
				    { upsert: true },
				    function(err, r) {
					callback();
					logger.info("Replace history.");
				    });
    };

    mongo.connect(mongourl, function(err, db) {
	if (err) {
	    var msg = 'Cannot connect mongodb. url='
		    + mongourl + ' ' + err.message;
	    logger.error(msg);
	    res.status(500).send(msg);
	    return;
	}
	replaceHistory(db, history, function() {
	    db.close();
	});
    });

    res.sendStatus(200);

});

module.exports = function(opts) {
    router.opts = opts;
    return router;
}
