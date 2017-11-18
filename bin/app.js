const path = require('path');
const fs = require('fs');
const Service = require('./service');

var debug = require('debug')('coffeecat:server');
var program = require('commander');
var package = require('../package.json');

program
    .version(package.version)
    .option('-c, --conf <filename>', 'specify a configuration file')
    .parse(process.argv);

program.conf = program.conf || path.resolve(path.join('.', 'conf', 'server.json'));

var config = require(program.conf);

if (config.autoLoadApplets) {
    let applets = fs.readdirSync(path.resolve(config.autoLoadApplets));
    for (let applet of applets) {
        let container = applet === 'ROOT' ? '/' : '/' + applet;
        config.applets.push({
            container: container,
            path: path.resolve(path.join('.', config.autoLoadApplets, applet))
        });
    }
}

if (config.errorTemplate) {
    config.errorTemplate = path.resolve(config.errorTemplate);
}

var service = new Service(config);