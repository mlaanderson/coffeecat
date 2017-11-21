/**
 * @typedef {{container: string, path: string}} ContainerStruct
 * @typedef {{get(key: any) => ContainerStruct, set(key: any, value: ContainerStruct)}} privateData
 */


/**
 * @type {privateData}
 */
var m_private = new WeakMap();

class ContainerConfiguration {

    /**
     * @param {ContainerStruct} config 
     */
    constructor(config) {
        m_private.set(this, config);
    }

    /** @type {string} */
    get container() {
        return m_private.get(this).container;
    }

    /** @type {string} */
    get path() {
        return m_private.get(this).path;
    }

    /** @type {ContainerStruct} */
    toJSON() {
        let result = {};
        for (let key of ['container', 'path']) {
            result[key] = this[key];
        }
        return result;
    }
}

module.exports = ContainerConfiguration;