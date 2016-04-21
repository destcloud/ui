var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('destcloud/utils/logger');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var multipart = multer();
//var uuid_list = require('./uuid_list');

var dc2host = 'localhost';
var dc2port = 4567;

// mongoDB
var dbhost = 'localhost';
var dbport = 27017;
var dbname = 'destcloud';

var routes = require('./routes/index');
var entities = require('./routes/entities')({
			    host: dc2host, port: dc2port });
var topology = require('./routes/topology')({
			    host: dc2host, port: dc2port });
var sub_topology = require('./routes/sub_topology')({
			    host: dc2host, port: dc2port });
var scenario = require('./routes/scenario')({
			    host: dc2host, port: dc2port,
			    dbhost: dbhost, dbport: dbport, dbname: dbname });
var reload = require('./routes/reload')({
			    host: dc2host, port: dc2port });
var search = require('./routes/search')({
			    dbhost: dbhost, dbport: dbport, dbname: dbname });
var history = require('./routes/history')({
			    dbhost: dbhost, dbport: dbport, dbname: dbname });
var entity = require('./routes/entity')({
			    dbhost: dbhost, dbport: dbport, dbname: dbname });
var dclog = require('./routes/log')({
			    dbhost: dbhost, dbport: dbport, dbname: dbname });

var app = express();

if (app.get('env') == 'development') {
    logger.transports.file.level = 'debug';
}

logger.info("Express env: " + app.get('env') + "\n");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// NOTE: Overriding Express logger
logger.debug('Overriding Express default logger by winston and morgan');
app.use(morgan('dev', { 'stream': logger.stream }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// NOTE: parse multipart/form-data for /scenario path
app.use('/scenario', multipart.any());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/entities', entities);
app.use('/topology', topology);
app.use('/sub_topology', sub_topology);
app.use('/scenario', scenario);
app.use('/reload', reload);
app.use('/search', search);
app.use('/history', history);
app.use('/entity', entity);
app.use('/logs', dclog);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
