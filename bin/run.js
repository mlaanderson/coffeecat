const path = require('path');
const fs = require('fs');
const Service = require('../lib/service');

var debug = require('debug')('coffeecat:server');
var package = require('../package.json');

module.exports = function(config) {
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
}