#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const os = require('os');

var program = require('commander');
var package = require('../package.json');
var runner = require('./run');
var defaults = require('./defaults')();

program
    .version(package.version)
    .option('-c, --conf <filename>', 'specify a configuration file')
    .parse(process.argv);


program.conf = path.resolve(program.conf || defaults.configuration); 

var config = require(program.conf);

runner(config);
