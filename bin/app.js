#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

var program = require('commander');
var package = require('../package.json');
var runner = require('./run');

program
    .version(package.version)
    .option('-c, --conf <filename>', 'specify a configuration file')
    .parse(process.argv);

program.conf = path.resolve(program.conf || path.join('.', 'conf', 'server.json')); 

var config = require(program.conf);

runner(config);