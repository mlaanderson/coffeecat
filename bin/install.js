#!/usr/bin/env node 
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const Promisify = require('../lib/promisify');
const ejs = require('ejs');

const defaults = require('./defaults')();


fs.writeFile = Promisify(fs.writeFile);
fs.copyFile = Promisify(fs.copyFile);
fs.mkdir = Promisify(fs.mkdir);
ejs.renderFile = Promisify(ejs.renderFile);

/**
 * create a directory, creating parent directories as needed
 * @param {string} dir 
 * @param {string|number} mode 
 */
fs.mkdirp = async function(dir, mode) {
    mode = mode || 0o777;
    try {
        await fs.mkdir(dir, mode);
    } catch (error) {
        if ((error.code === "ENOENT") && (path.dirname(dir) !== dir)) {
            await fs.mkdirp(path.dirname(dir), mode);
            await fs.mkdir(dir, mode);
        } else {
            throw error;
        }
    }
}

/**
 * Picks the first file from the list that exists and returns
 * that filename. Or if none of the files exist returns false.
 * @param {Array<string>} files 
 * @returns {string|false}
 */
fs.pickFile = function pickFile(...files) {
    for (let f of files) {
        if (fs.existsSync(f)) {
            return f;
        }
    }
    return false;
}

var config = {
    "autoLoadApplets": defaults.applets,
    "applets": [],
    "protocols": [
        {
            "name": "http",
            "port": 8080,
            "listen": "0.0.0.0",
            "ssl": false,
            "cert": null,
            "key": null
        }
    ],
    "errorTemplate": path.join(path.dirname(defaults.configuration), "errors.ejs")
}

var ROOT = path.join(config.autoLoadApplets, 'ROOT');
var ROOT_FILES = ['package.json', 'rootApplet.js', path.join('public', 'coffeecat.png'), path.join('public','favicon.ico'), path.join('public', 'index.html'), path.join('public','style.css')];

(async () => {
    console.log('Coffeecat Configuration:', defaults.configuration);
    console.log('Coffeecat Applets:      ', defaults.applets);
    
    // create the configuration file
    if (fs.existsSync(defaults.configuration) === false) {
        if (fs.existsSync(path.dirname(defaults.configuration)) === false) {
            await fs.mkdirp(path.dirname(defaults.configuration));
        }
        await fs.writeFile(defaults.configuration, JSON.stringify(config, null, 4));
    }

    // create the ROOT applet directory
    if (fs.existsSync(path.join(ROOT, 'package.json')) === false) {
        if (fs.existsSync(ROOT) === false) {
            await fs.mkdirp(ROOT);
            await fs.mkdirp(path.join(ROOT, 'public'));
        }

        console.log('Creating ROOT applet...');

        for (let file of ROOT_FILES) {
            console.log(file);
            await fs.copyFile(path.resolve(path.join('.', 'applets', 'ROOT', file)), path.resolve(path.join(ROOT, file)));
        }
        execSync('npm install', {
            cwd: ROOT
        });

        console.log('DONE');
    }

    // Create the user and group, change ownership of the applets folder to the user
    if (defaults.user && defaults.group) {
        // Need to breakout between OS's here
        switch(os.platform()) {
            case 'win32':
                // how do we add a user and change ownership in Windows?
                // net user www-data password /add
                // how to create a random password?
                // probably can ignore group on windows
                // use takeown to change ownership of the applet director
                break;
            case 'linux':
            case 'freebsd':
            case 'sunos':
                {
                    let shell;
                    if (shell = fs.pickFile('/usr/sbin/nologin', '/bin/false', '/usr/bin/false')) {
                        shell = "-s " + shell
                    } else {
                        shell = "";
                    }

                    // create the user and group if necessary
                    try { 
                        execSync(`id -u "${defaults.user}" > /dev/null 2>&1`);
                        execSync(`getent group "${defaults.group}"`);
                    } catch (err) {
                        // the user does not exist, create it (and the group)
                        try {
                            execSync(`groupadd -f "${defaults.group} > /dev/null 2>&1`);
                            execSync(`useradd -c "The coffeecat user" -d "${config.autoLoadApplets}" -g "${defaults.group}" ${shell} ${defaults.user} > /dev/null 2>&1`);
                        } catch (err2) {
                            // hit this if the user exists, but not the group
                        }
                    }

                    // change ownership of the applet directory
                    execSync(`chown -R "${defaults.user}":"${defaults.group}" "${config.autoLoadApplets}"`);
                }
                break;
            case 'darwin':
                break;
        }
    }

    // create the service
    switch (os.platform()) {
        case "win32":
            // create the service with node-windows?
            {
                let Service = require('node-windows');
                let service = new Service({
                    name: 'Coffeecat',
                    description: 'The Coffeecat Server',
                    script: path.join(os.userInfo().homedir, 'AppData', 'Roaming', 'npm', 'node_modules', 'coffeecat', 'bin', 'coffecat.js')
                });

                service.on('install', () => {
                    service.start();
                });

                service.install();
            }
            break;
        case "linux":
            {
                let user = defaults.user || 'root';
                let group = defaults.group || 'root';
                // check to see if we need to use systemd or init scripts
                if (fs.existsSync('/lib/systemd')) {
                    // this one uses systemd
                    let service = await ejs.renderFile('./install/coffeecat.service', { user: user, group: group });
                    await fs.writeFile('/lib/systemd/system/coffeecat.service', service);
                    execSync('systemctl daemon-reload');
                    execSync('systemctl enable coffeecat');
                    execSync('systemctl start coffeecat');
                } else {
                    // this one uses init scripts
                    let service = await ejs.renderFile('./install/coffeecat.init', { user: user, group: group });
                    await fs.writeFile('/etc/init.d/coffeecat', service);
                    execSync('chmod +x /etc/init.d/coffeecat');
                    execSync('update-rc.d coffeecat defaults');
                    execSync('service coffeecat start');
                }
            }
            break;
        case "freebsd":
        case "sunos":
            // assume init scripts
            break;
    }
})();
