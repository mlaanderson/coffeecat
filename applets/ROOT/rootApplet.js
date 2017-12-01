const path = require('path');
const Applet = require('coffeecat-applet');
var express = require('express');

class RootApplet extends Applet{
    constructor(config, webSocketServer) {
        super(config, webSocketServer);

        process.nextTick((() => {
            // this is a simple static resource applet only
            this.app.use(express.static(path.join(__dirname, 'public')));
        }).bind(this));
    }
}

module.exports = RootApplet;

