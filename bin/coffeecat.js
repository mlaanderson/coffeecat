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
    // .option('-i, --init', 'initialize a Coffeecat server')
    .parse(process.argv);


// if (program.init) {
//     require('child_process').execSync('node bin/install.js');
// } else {
    program.conf = path.resolve(program.conf || defaults.configuration); 

    var config = require(program.conf);

    runner(config);
// }