/**
 * @typedef {{name: string, port: number, listen: string|boolean, websockets?: boolean, ssl?: boolean, cert?: string, key?: string}} ProtocolStruct
 */

 /**
 * @type {{get(key: any) => ProtocolStruct, set(key: any, value: ProtocolStruct)}}
 */
var m_private = new WeakMap();


class ProtocolConfiguration {
    /**
     * 
     * @param {ProtocolStruct} config 
     */
    constructor(config) {
        config = Object.assign({
            name: '',
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
     * The protocol name. e.g. http or https
     * @type {string}
     */
    get name() {
        return m_private.get(this).name;
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
     * @return {ProtocolStruct}
     */
    toJSON() {
        let result = {};
        for (let key of ['port', 'listen', 'websockets', 'ssl', 'cert', 'key']) {
            result[key] = this[key];
        }
        return result;
    }
}

module.exports = ProtocolConfiguration;