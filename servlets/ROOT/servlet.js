const path = require('path');
var express = require('express');
var router = require('./router.js');

var servletPath = '';
var serverConfig = {};
var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Attach the config data to the request for further use
app.use((req, res, next) => {
    req.config = serverConfig;
    next();
});

// Finally add the router 
app.use('/', router);

module.exports = function(name, config = {}) {
    serverConfig = Object.assign({}, config, { path: name });
    servletPath = name;
    return app;
};
