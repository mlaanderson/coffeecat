const path = require('path');
var express = require('express');

var servletPath = '';
var serverConfig = {};
var app = express();

/** Place your code here */
var session = require('express-session');
var router = require('./router');

class Applet {
    constructor(config, webSocketServer) {
        this.app = express();

        process.nextTick((() => {
            // set the view engine and template location
            this.app.set('view engine', 'ejs');
            this.app.set('views', path.join(__dirname, 'views'));

            // configure the static file directory
            this.app.use(express.static(path.join(__dirname, 'public')));

            // configure the sessions
            this.app.use(session({
                secret: '95f0d5bd-b3aa-482d-8469-b6ee04776d8a',
                resave: false,
                saveUninitialized: true,
                cookie: { 
                    secure: true,
                    path: serverConfig.path 
                }
            }));

            // Finally add the router 
            this.app.use('/', router);
        }).bind(this));
    }
}

module.exports = Applet;

