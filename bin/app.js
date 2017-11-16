const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

var express = require('express');
var logger = require('morgan');
var debug = require('debug')('coffeecat:server');
var WebSocket = require('ws');
var WebSocketContainer = require('./wscontainer');

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
var appletMap = new Map();
var webSocketClientMap = new Map();
var webSocketUriMap = new Map();

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

    webSocketUriMap.set(appletPath, new Set());
    let wsc = new WebSocketContainer(webSocketUriMap.get(appletPath));
    
    let handler = require(path.posix.join(config.applets, applet))(appletPath, Object.assign({}, appletConfig), wsc);
    
    appletMap.set(appletPath, { handler: handler, wsc: wsc });

    app.use(appletPath, handler);

    debug('DONE')
}

if (config.externals) {
    for (let applet of config.externals) {
        var appletPath = path.resolve(path.join('.', applet.path));
        debug('Loading %s from %s', applet.name, appletPath);

        webSocketUriMap.set('/' + applet.name, new Set());
        let wsc = new WebSocketContainer(webSocketUriMap.get('/' + applet.name));
        
        let handler = require(appletPath)(applet.name, Object.assign({}, appletConfig), wsc);

        appletMap.set('/' + applet.name, { handler: handler, wsc: wsc });

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

// implement WS protocol
if (config.useWS) {
    var wss = new WebSocket.Server({ server: server });
    wss.on('connection', handleWSConnection);
    wss.on('error', handleWSError);
}

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

    // implement WSS protocol
    if (config.useWS) {
        var wssl = new WebSocket.Server({ server: sslServer });
        wssl.on('connection', handleWSSConnection);
        wssl.on('error', handleWSError);
    }

    sslServer.listen(config.sslPort, config.listen);
}

function handleWSConnection(socket, request) { 
    webSocketClientMap.set(socket, request.url);
    webSocketUriMap.get(request.url).add(socket);

    appletMap.get(request.url).wsc.emit('connection', socket, request);

    socket.on('close', (code, reason) => {
        // remove the socket from the sets
        webSocketUriMap.get(request.url).delete(socket);
        webSocketClientMap.delete(socket);
    });
}

function handleWSSConnection(socket, request) { 
    socket.secure = true;
    handleWSConnection(socket, request);
}

function handleWSError(error) {
    // hmm, can't associate this with a path
}

function handleWSHeaders(headers, request) {
    // not sure when this gets fired
}