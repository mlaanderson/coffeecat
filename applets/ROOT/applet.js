const path = require('path');
var express = require('express');

var servletPath = '';
var serverConfig = {};
var app = express();

module.exports = function(name, config = {}) {
    serverConfig = Object.assign({}, config, { path: name });
    servletPath = name;
    return app;
};

/** Place your code here */

// Setup the view engine for the applet
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Add the static file handler 
app.use(express.static(path.join(__dirname, 'public')));

