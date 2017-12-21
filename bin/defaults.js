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

    if ((user.uid === 0) || (user.username === 'www-data')) {
        // default to /etc and /var/coffeecat
        result.configuration = path.join('/', 'etc', 'coffeecat', 'server.json');
        result.applets = path.join('/', 'var', 'coffeecat');
        result.user = 'www-data',
        result.group = 'www-data'
    }

    return result;
}