const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

var express = require('express');
var logger = require('morgan');
var debug = require('debug')('coffeecat:server');

// Load the server.conf file
var config = Object.assign({
    applets: 'applets',
    errorTemplate: '../conf/errors.ejs',
    port: 8080,
    listen: '0.0.0.0',
    useSSL: false,
    sessionSecret: 'coffee cat'
}, require('../conf/server.json'));

var app = express();

// configure the logger
app.use(logger('dev'));

// make the applets explicitely relative if there is no path seperator
if (config.applets.indexOf(path.sep) < 0) { 
    config.applets = path.resolve(config.applets);
}

// create a configuration object for information applets might need
var appletConfig = {
    port: config.port
}

if (config.sslPort) {
    appletConfig.sslPort = config.sslPort;
}

// loop through the applets in the applet directory
let applets = fs.readdirSync(config.applets);
for (let applet of applets) {
    debug('Loading %s', applet);

    let appletPath = applet === 'ROOT' ? '/' : '/' + applet;
    let handler = require(path.posix.join(config.applets, applet))(appletPath, Object.assign({}, appletConfig));

    app.use(appletPath, handler);

    debug('DONE')
}

if (config.externals) {
    for (let applet of config.externals) {
        debug('Loading %s from %s', applet.name, applet.path);
        let handler = require(applet.path)(applet.name, Object.assign({}, appletConfig));
        app.use('/' + applet.name, handler);
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