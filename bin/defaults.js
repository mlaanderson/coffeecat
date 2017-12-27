const os = require('os');
const path = require('path');

/**
 * @returns {{configuration: string, applets: string, user?: string, group?: string}}
 */
module.exports = function defaults() {
    var user = os.userInfo();
    var result = {
        configuration: path.join(os.homedir(), ".coffeecat", "conf", "server.json"),
        applets: path.join(os.homedir(), ".coffeecat", "applets")
    }

    if ((user.username === 'SYSTEM') && (os.platform() === 'win32')) {
        // running as the system user, probably means we're a service
        // look for the configuration file where coffeecat is installed
        let homedir = process.cwd().split(path.sep).filter((s,n,a) => n < a.indexOf('AppData')).join(path.sep);
        result.configuration = path.join(homedir, ".coffeecat", "conf", "server.json");
        result.applets = path.join(homedir, ".coffeecat", "applets");
    }

    if ((user.uid === 0) || (user.username === 'www-data')) {
        // default to /etc and /var/coffeecat
        result.configuration = path.join('/', 'etc', 'coffeecat', 'server.json');
        result.applets = path.join('/', 'var', 'coffeecat');
        result.user = 'www-data',
        result.group = 'www-data'
    }

    return result;
}