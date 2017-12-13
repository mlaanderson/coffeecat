const path = require('path');
const fs = require('fs');
const Service = require('../lib/service');

var debug = require('debug')('coffeecat:server');
var program = require('commander');
var package = require('../package.json');

program
    .version(package.version)
    .option('-c, --conf <filename>', 'specify a configuration file')
    .parse(process.argv);

program.conf = path.resolve(program.conf || path.join('.', 'conf', 'server.json')); 

var config = require(program.conf);

if (config.autoLoadApplets) {
    let autoload = path.resolve(config.autoLoadApplets);
    let applets = fs.readdirSync(autoload);
    for (let applet of applets) {
        let container = applet === 'ROOT' ? '/' : '/' + applet;
        config.applets.push({
            container: container,
            path: path.resolve(path.join(autoload, applet))
        });
    }
}

if (config.errorTemplate) {
    config.errorTemplate = path.resolve(config.errorTemplate);
}

var service = new Service(config);