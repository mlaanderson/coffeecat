const EventEmitter = require('events');
var dataMap = new WeakMap();

class WebSocketContainer extends EventEmitter {
    constructor(clients) {
        super();
        dataMap.set(this, clients);
    }

    get clients() {
        return dataMap.get(this);
    }

    get CONNECTING() {
        return 0;
    }

    get OPEN() {
        return 1;
    }

    get CLOSING() {
        return 2;
    }

    get CLOSED() {
        return 3;
    }
}

module.exports = WebSocketContainer;