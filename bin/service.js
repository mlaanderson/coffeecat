const path = require('path');
const EventEmitter = require('events');
const debug = require('debug')('coffeecat:service');
const WebSocketContainer = require('./wscontainer');
const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');

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


class ContainerConfiguration {
    /**
     * 
     * @param {container} config 
     */
    constructor(config) {
        m_private.set(this, config);
    }

    /**
     * The web path for this container
     * @type {string}
     */
    get container() {
        return m_private.get(this).container;
    }

    /**
     * The file system path for this container
     * @type {string}
     */
    get path() {
        return m_private.get(this).path;
    }

    /**
     * @return {container}
     */
    toJSON() {
        let result = {};
        for (let key of ['container', 'path']) {
            result[key] = this[key];
        }
        return result;
    }
}

class ProtocolConfiguration {
    /**
     * 
     * @param {protocol} config 
     */
    constructor(config) {
        config = Object.assign({
            port: -1,
            listen: false,
            websockets: false,
            ssl: false,
            cert: null,
            key: null
        }, config);

        m_private.set(this, config);
    }

    /**
     * The port to listen on for this protocol
     * @type {number}
     */
    get port() {
        return m_private.get(this).port;
    }

    /**
     * The address to listen on for this protocol, or 
     * false do not listen, or true listen to all 
     * (same as "0.0.0.0")
     * @type {string|boolean}
     */
    get listen() {
        let result = m_private.get(this).listen;
        if (result === true) {
            result = '0.0.0.0';
        }
        return result;
    }

    /**
     * Indicates if this service will allow upgrades to 
     * WebSockets. Only valid for HTTP or HTTPS
     * @type {boolean}
     */
    get websockets() {
        return m_private.get(this).websockets;
    }

    /**
     * Indicates if this service will use SSL. Not
     * valid for HTTP.
     * @type {boolean}
     */
    get ssl() {
        return m_private.get(this).ssl;
    }

    /**
     * The path to the ssl certificate file. Defaults
     * to null.
     * @type {string}
     */
    get cert() {
        return m_private.get(this).cert;
    }

    /**
     * The path to the ssl key file. Defaults
     * to null.
     * @type {string}
     */
    get key() {
        return m_private.get(this).key;
    }

    /**
     * @return {protocol}
     */
    toJSON() {
        let result = {};
        for (let key of ['port', 'listen', 'websockets', 'ssl', 'cert', 'key']) {
            result[key] = this[key];
        }
        return result;
    }
}

class ServerConfiguration {
    /**
     * 
     * @param {server} config 
     */
    constructor(config) {
        // setup the default configuration
        config = Object.assign({
            applets: [
                { container: '/', path: path.resolve(path.join('.', 'applets', 'ROOT')) }
            ],
            errorTemplate: path.resolve(path.join('.', 'conf', 'errors.ejs'))
        }, config);
        
        
        config.applets = config.applets.map(c => new ContainerConfiguration(c));
        

        for (let protocol of ['http', 'https']) {
            if (config.protocols[protocol]) {
                config.protocols[protocol] = new ProtocolConfiguration(config.protocols[protocol]);
            }
        }

        m_private.set(this, config);
    }

    /**
     * The list of applets for this service
     * @type {Array<ContainerConfiguration>}
     */
    get applets() {
        return m_private.get(this).applets;
    }

    /**
     * The map of protocols for this service
     * @type {Object.<string,ProtocolConfiguration>}
     */
    get protocols() {
        return m_private.get(this).protocols;
    }

    /**
     * The http protocol configuration for this service or null
     * @type {ProtocolConfiguration}
     */
    get http() {
        return this.protocols['http'] || null;
    }

    /**
     * The https protocol configuration for this service or null
     * @type {ProtocolConfiguration}
     */
    get https() {
        return this.protocols['https'] || null;
    }

    /**
     * The filesystem path to the default error template
     * @type {string}
     */
    get errorTemplate() {
        return m_private.get(this).errorTemplate;
    }

    /**
     * @return {server}
     */
    toJSON() {
        let result = {};
        for (let key of ['applets', 'protocols', 'errorTemplate']) {
            result[key] = this[key];
        }
        return result;
    }
}

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

    if (priv.wsApplets.get(request.url) !== null) {
        priv.wsClients.get(request.url).add(socket);
        priv.wsApplets.get(request.url).emit('connection', socket, request);

        socket.on('close', (code, reason) => {
            priv.wsClients.get(request.url).delete(socket);
        });
    }
}

function Initialize() {
    /** @type {servicePrivate} */
    let priv = m_private.get(this);
    let useWS = priv.config.http.websockets || print.config.https.websockets;
    
    let app = express();

    // configure the logger
    app.use(logger('dev'));

    // create the applets
    for (let applet of priv.config.applets) {
        debug('Loading %s from %s', applet.container, applet.path);

        priv.wsClients.set(applet.container, new Set());
        let wsc = useWS ? new WebSocketContainer(priv.wsClients.get(applet.container)) : null;

        priv.wsApplets.set(applet.container, wsc);

        let handler = new (require(applet.path))(this.toJSON(applet.container), wsc);

        app.use(applet.container, handler.app);
    }

    // create the error handlers
    app.use(handle404Error.bind(this));
    app.use(handleError.bind(this));

    // start the services
    if (priv.config.http && priv.config.http.listen) {
        let httpServer = http.createServer(app);

        httpServer.on('listening', () => {
            this.emit('listening');
            debug('Listening on %d', priv.config.http.port);
        });

        if (priv.config.http.websockets) {
            let wss = new WebSocket.Server({ server: httpServer });
            wss.on('connection', handleWebSocketConnection.bind(this));
        }

        httpServer.listen(priv.config.http.port, priv.config.http.listen);
    }

    if (priv.config.https && priv.config.https.listen) {
        let httpsOptions = {
            key: fs.readFileSync(priv.config.https.key),
            cert: fs.readFileSync(priv.config.https.cert),
            requestCert: false,
            rejectUnauthorized: false
        }
        let httpsServer = https.createServer(httpsOptions, app);

        httpsServer.on('listening', () => {
            this.emit('listening');
            debug('Listening on %d', priv.config.https.port);
        });

        if (priv.config.https.websockets) {
            let wss = new WebSocket.Server({ server: httpsServer });
            wss.on('connection', handleWebSocketConnectionSSL.bind(this));
        }

        httpsServer.listen(priv.config.https.port, priv.config.https.listen);
    }
}

/**
 * @typedef {{config: ServerConfiguration, containerMap: Map<string,ContainerConfiguration>, wsClients: Map<string,Set<WebSocket>>, wsApplets: Map<string,WebSocketContainer>}} servicePrivate
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
