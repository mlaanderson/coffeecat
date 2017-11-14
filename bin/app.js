const path = require('path');
const fs = require('fs');
const http = require('http');

var express = require('express');
var logger = require('morgan');
var debug = require('debug')('coffeecat:server');

var config = Object.assign({
    servlets: 'servlets',
    errorTemplate: '../conf/errors.ejs',
    port: 8080,
    listen: '0.0.0.0'
}, require('../conf/server.json'));

var app = express();

app.use(logger('dev'));

// make the servlets explicitely relative if there is no path seperator
if (config.servlets.indexOf(path.sep) < 0) { 
    config.servlets = path.resolve(config.servlets);
}

// loop through the servlets in the servlet directory
let servlets = fs.readdirSync(config.servlets);
for (let servlet of servlets) {
    debug('Loading %s', servlet);
    let handler = require(path.posix.join(config.servlets, servlet, 'servlet.js'));
    if (servlet === 'ROOT') {
        // handle the special case
        app.use('/', handler);
    } else {
        app.use('/' + servlet, handler);
    }
    debug('DONE')
}

// catch 404 and forward to the error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500);
    res.render(config.errorTemplate);
});

var server = http.createServer(app);
server.listen(config.port, config.listen);