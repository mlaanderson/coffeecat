const path = require('path');
const Applet = require('coffeecat-applet');
var express = require('express');

var servletPath = '';
var serverConfig = {};
var app = express();

/** Place your code here */
var session = require('express-session');
var router = require('./router');

class HelloApplet extends Applet {
    constructor(config, webSocketServer) {
        super(config, webSocketServer);

        process.nextTick((() => {
            // set the view engine and template location
            this.setViewEngine('ejs');
            this.setViewPath(path.join(__dirname, 'views'));

            // configure the static file directory
            this.setStaticContentPath(path.join(__dirname, 'public'));


            this.setSession('express-session', {
                secret: '95f0d5bd-b3aa-482d-8469-b6ee04776d8a',
                resave: false,
                saveUninitialized: true,
                cookie: { 
                    secure: true,
                    path: this.configuration.applet.container
                }
            });

            // Finally add the router 
            this.app.use('/', router);
        }).bind(this));
    }
}

module.exports = HelloApplet;

