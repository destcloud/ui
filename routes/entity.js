var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var logger = require('destcloud/utils/logger');

/* GET entity[s] */
router.get('/', function(req, res, next) {

    logger.info("== GET entity");

    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var findEntities = function(db, callback) {

	var list = [];
	var cursor = db.collection('entities').find();
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

	findEntities(db, function() {
	    db.close();
	});
    });
});

/* POST entity */
router.post('/', function(req, res, next) {

    logger.info("== POST entity");
    logger.debug(req.body);

    var entities = req.body;

    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var findOneAndUpdateEntity = function(db, entity, callback) {

	console.log("-- findOneAndUpdateEntity:");
	console.log(entity);

	db.collection('entities').findOneAndUpdate(
	    { "IP_address": entity.IP_address },
	    {
		$set: {
		    "entity_name" : entity.entity_name,
		    "port_number" : entity.port_number,
		    "protocol"    : entity.protocol,
		    "network_os"  : entity.network_os,
		    "username"    : entity.username,
		    "password"    : entity.password,
		},
		$currentDate: { "lastModified": true }
	    }, {
		upsert: true
	    }, function(err, results) {
		callback();
	    }
	);
    };

    mongo.connect(mongourl, function(err, db) {

	if (err) {
	    var msg = 'Cannot connect mongodb. url=' + mongourl + ' ' + err.message;
	    logger.error(msg);
	    res.status(500).send(msg);
	    return;
	}

	entities.forEach(function(v, i) {
	    findOneAndUpdateEntity(db, v, function() {
		db.close();
	    });
	});

	res.send('');
    });
});

router.delete('/', function(req, res, next) {

    logger.info("== DELETE entity");
    logger.debug(req.body);

    var entity = req.body;

    var mongourl = 'mongodb://' + router.opts.dbhost + ':' + router.opts.dbport
		    + '/' + router.opts.dbname;

    var findOneAndDeleteEntity = function(db, entity, callback) {

	console.log("-- findOneAndDeleteEntity:");
	console.log(entity);

	db.collection('entities').findOneAndDelete(
	    entity,
	    {
	    }, function(err, results) {
		if (err) {
		    console.log('findOneAndDelete error: ' + err);
		} else {
		    logger.info("remove ");
		    logger.info(entity);
		}
		callback();
	    }
	);
    };

    mongo.connect(mongourl, function(err, db) {

	if (err) {
	    var msg = 'Cannot connect mongodb. url=' + mongourl + ' ' + err.message;
	    logger.error(msg);
	    res.status(500).send(msg);
	    return;
	}

	findOneAndDeleteEntity(db, entity, function() {
	    db.close();
	});

	res.send('');
    });
});

module.exports = function(opts) {
    router.opts = opts;
    return router;
}
