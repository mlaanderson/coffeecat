const path = require('path');
const EventEmitter = require('events');
const debug = require('debug')('coffeecat:service');
const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');

const WebSocketServer = require('coffeecat-ws');
const ContainerConfiguration = require('./containerConfiguration');
const ProtocolConfiguration = require('./protocolConfiguration');
const ServerConfiguration = require('./serverConfiguration');

var express = require('express');
var logger = require('morgan');

var m_private = new WeakMap();

/**
 * @typedef {{container: string, path: string}} container
 * @typedef {{port: number, listen: string|boolean, websockets?: boolean, ssl?: boolean, cert?: string, key?: string}} protocol
 * @typedef {{applets: Array<container>, protocols: { http: protocol, https: protocol }, errorTemplate: string}} server
 * 
 * @typedef {{port: number, listen: string|boolean, websockets?: boolean, ssl?: boolean}} appProtocol
 * @typedef {{applet: container, errorTemplate: string, http?: appProtocol, https?: appProtocol}} appConfig
 */


function handle404Error(req, res, next) {
    let err = new Error("Not Found");
    err.status = 404;
    next(err);
}

function handleError(err, req, res, next) {
    /** @type {servicePrivate} */
    let priv = m_private.get(this);
    
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render(priv.config.errorTemplate);
}

function handleWebSocketConnectionSSL(socket, request) {
    socket.secure = true;
    handleWebSocketConnection.call(this, socket, request);
}

function handleWebSocketConnection(socket, request) {
    /** @type {servicePrivate} */
    let priv = m_private.get(this);

    // make sure the path matches a registered applet path
    let url = '/' + request.url.split('/').filter(p => p.length > 0).filter((p,n) => n < 1).join('/');

    if ((!!priv.wsApplets.get(url)) && (!!priv.wsClients.get(url))) {
        priv.wsClients.get(url).add(socket);
        priv.wsApplets.get(url).emit('connection', socket, request);

        socket.on('close', (code, reason) => {
            priv.wsClients.get(url).delete(socket);
        });
    }
}

function Initialize() {
    /** @type {servicePrivate} */
    let priv = m_private.get(this);
    let useWS = priv.config.protocols.some(p => p.websockets);
    
    let app = express();

    // configure the logger
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // create the applets
    for (let applet of priv.config.applets) {
        debug('Loading %s from %s', applet.container, applet.path);
        let wsc = null;

        if (useWS) {
            priv.wsClients.set(applet.container, new Set());
            wsc = new WebSocketServer(priv.wsClients.get(applet.container));

            priv.wsApplets.set(applet.container, wsc);
        }

        let handler = new (require(applet.path))(this.toJSON(applet.container), wsc);

        app.use(applet.container, handler.app);
    }

    // create the error handlers
    app.use(handle404Error.bind(this));
    app.use(handleError.bind(this));

    // start the services
    for (let protocol of priv.config.protocols) {
        let server;
        if (protocol.ssl) {
            sslOptions = {
                key: fs.readFileSync(protocol.key),
                cert: fs.readFileSync(protocol.cert),
                requestCert: false,
                rejectUnauthorized: false
            }
            server = require(protocol.name).createServer(sslOptions, app);
        } else {
            server = require(protocol.name).createServer(app);
        }

        server.on('listening', () => {
            this.emit('listening');
            debug('Listening on %d', protocol.port);
        });

        if (protocol.websockets) {
            let wss = new WebSocket.Server({ server: server });
            wss.on('connection', protocol.ssl ? handleWebSocketConnectionSSL.bind(this) : handleWebSocketConnection.bind(this));
        }

        if (protocol.listen) {
            server.listen(protocol.port, protocol.listen);
        }
    }
}

/**
 * @typedef {{config: ServerConfiguration, containerMap: Map<string,ContainerConfiguration>, wsClients: Map<string,Set<WebSocket>>, wsApplets: Map<string,WebSocketServer>}} servicePrivate
 */

class Service extends EventEmitter {
    /**
     * 
     * @param {server} config 
     */
    constructor(config) {
        super();

        m_private.set(this, 
        /** @type {servicePrivate} */
        {
            config: new ServerConfiguration(config),
            containerMap: new Map(),
            wsClients: new Map(),
            wsApplets: new Map()
        });

        process.nextTick(Initialize.bind(this));
    }

    /**
     * 
     * @param {string} [name] Optional applet web path
     * @returns {server|appConfig}
     */
    toJSON(name) {
        /** @type {ServerConfiguration} */
        let config = m_private.get(this).config;
        if (!name) return config.toJSON();

        // if the applet name has been specified, return
        // just applet appropriate information
        // hide cert and key paths, etc.
        let result = {};
        result.applet = config.applets.find(applet => applet.container == name);
        result.applet = result.applet ? result.applet.toJSON() : null;
        result.errorTemplate = config.errorTemplate;
        for (let protocol in config.protocols) {
            result[protocol] = {
                port: config.protocols[protocol].port,
                listen: config.protocols[protocol].listen,
                websockets: config.protocols[protocol].websockets,
                ssl: config.protocols[protocol].ssl
            };
        }

        return result;
    }
}

module.exports = Service;
