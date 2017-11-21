const path = require('path');
const ContainerConfiguration = require('./containerConfiguration');
const ProtocolConfiguration = require('./protocolConfiguration');

/**
 * @typedef {{container: string, path: string}} ContainerStruct
 * @typedef {{name: string, port: number, listen: string|boolean, websockets?: boolean, ssl?: boolean, cert?: string, key?: string}} ProtocolStruct
 * @typedef {{applets: Array<ContainerStruct>, protocols: Array<ProtocolStruct>, errorTemplate: string}} ServerStruct
 */

/**
 * @type {{get(key: any) => ServerConfiguration, set(key: any, value: ServerConfiguration)}}
 */
 var m_private = new WeakMap();

class ServerConfiguration {
    /**
     * 
     * @param {ServerStruct} config 
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

        config.protocols = config.protocols.map(p => new ProtocolConfiguration(p));


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
     * The list of protocols for this service
     * @type {Array<ProtocolConfiguration>}
     */
    get protocols() {
        return m_private.get(this).protocols;
    }

    /**
     * The http protocol configuration for this service or null
     * @type {ProtocolConfiguration}
     */
    get http() {
        return this.protocols.find(el => el.name == 'http');
    }

    /**
     * The https protocol configuration for this service or null
     * @type {ProtocolConfiguration}
     */
    get https() {
        return this.protocols.find(el => el.name == 'https');
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

module.exports = ServerConfiguration;