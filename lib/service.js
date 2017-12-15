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

function parseUrl(url) {
    let priv = m_private.get(this);
    if (url === '/') return url;
    let urls = url.split('/').filter(s => s.length > 0);

    if ((urls.length > 0) && ('/' + urls[0] in priv.applets)) {
        return '/' + urls[0];
    }
    return '/';
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

function Initialize() {
    /** @type {servicePrivate} */
    let priv = m_private.get(this);
    let useWS = priv.config.protocols.some(p => p.websockets);
    
    let app = express();
    priv.applets = {};

    // configure the logger
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // create the applets
    for (let applet of priv.config.applets) {
        debug('Loading %s from %s', applet.container, applet.path);

        let handler = new (require(applet.path))(this.toJSON(applet.container));
        priv.applets[applet.container] = handler;

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

        server.on('listening', (() => {
            this.emit('listening');
            for (let path in priv.applets) {
                priv.applets[path].emit('listening');
            }
            debug('Listening on %d', protocol.port);
        }).bind(this));

        server.on('upgrade', ((req, socket, head) => {
            let url = parseUrl.call(this, req.url);
            priv.applets[url].upgrade(req, socket, head);
        }).bind(this));

        server.on('error', ((error) => {
            process.stderr.write("ERROR: " + error.toString() + "\r\n");
            this.emit('error');
            for (let path in priv.applets) {
                priv.applets[path].emit('error');
            }
        }).bind(this));

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
