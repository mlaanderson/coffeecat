const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

var express = require('express');
var logger = require('morgan');
var debug = require('debug')('coffeecat:server');
var session = require('express-session');

// Load the server.conf file
var config = Object.assign({
    servlets: 'servlets',
    errorTemplate: '../conf/errors.ejs',
    port: 8080,
    listen: '0.0.0.0',
    useSSL: false,
    sessionSecret: 'coffee cat'
}, require('../conf/server.json'));

var app = express();

// configure the logger
app.use(logger('dev'));

// configure sessions
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

// make the servlets explicitely relative if there is no path seperator
if (config.servlets.indexOf(path.sep) < 0) { 
    config.servlets = path.resolve(config.servlets);
}

// create a configuration object for information servlets might need
var servletConfig = {
    port: config.port
}

if (config.sslPort) {
    servletConfig.sslPort = config.sslPort;
}

// loop through the servlets in the servlet directory
let servlets = fs.readdirSync(config.servlets);
for (let servlet of servlets) {
    debug('Loading %s', servlet);

    let servletPath = servlet === 'ROOT' ? '/' : '/' + servlet;
    let handler = require(path.posix.join(config.servlets, servlet, 'servlet.js'))(servletPath, Object.assign({}, servletConfig));

    app.use(servletPath, handler);

    debug('DONE')
}

if (config.externals) {
    for (let servlet of config.externals) {
        debug('Loading %s from %s', servlet.name, servlet.path);
        let handler = require(servlet.path)(servlet.name, Object.assign({}, servletConfig));
        app.use('/' + servlet.name, handler);
    }
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
server.on('listening', () => {
    debug(`Listening on ${config.port}`);
});
server.listen(config.port, config.listen);

if (config.useSSL === true) {
    var sslOptions = {
        key: fs.readFileSync(config.key),
        cert: fs.readFileSync(config.cert),
        requestCert: false,
        rejectUnauthorized: false
    }

    var sslServer = https.createServer(sslOptions, app);
    sslServer.on('listening', () => {
        debug(`Listening on ${config.sslPort}`);
    });
    sslServer.listen(config.sslPort, config.listen);
}