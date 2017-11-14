const path = require('path');
var express = require('express');
var debug = require('debug')('coffeecat:root');
var router = require('./router.js');

var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', router);

module.exports = app;
