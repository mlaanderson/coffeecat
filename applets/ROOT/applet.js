const path = require('path');
var express = require('express');

class Applet {
    constructor(config, webSocketServer) {
        this.app = express();

        process.nextTick((() => {
            this.app.use(express.static(path.join(__dirname, 'public')));
        }).bind(this));
    }
}



module.exports = Applet;

