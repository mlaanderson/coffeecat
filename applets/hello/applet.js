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
var session = require('express-session');
var router = require('./router');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: '95f0d5bd-b3aa-482d-8469-b6ee04776d8a',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: true,
        path: serverConfig.path 
    }
}));

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
