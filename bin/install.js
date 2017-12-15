#!/usr/bin/env node 
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const defaults = require('./defaults')();

(() => {
    var _writeFile = fs.writeFile;
    fs.writeFile = function writeFile(path, data) {
        return new Promise((resolve, reject) => {
            _writeFile(path, data, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
})();

(() => {
    var _copyFile = fs.copyFile;
    fs.copyFile = function copyFile(src, dest) {
        return new Promise((resolve, reject) => {
            _copyFile(src, dest, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
})();

(() => {
    var _mkdir = fs.mkdir;
    fs.mkdir = function mkdir(dir, mode) {
        mode = mode || 0o777;
        return new Promise((resolve, reject) => {
            _mkdir(dir, mode, (err) => { 
                if (err) {
                    if ((err.code == "ENOENT") && (path.dirname(dir) !== dir)) {
                        (async() => {
                            try {
                                await mkdir(path.dirname(dir), mode);
                                await mkdir(dir, mode);
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        })();
                        return;
                    } else {
                        return reject(err);
                    }
                }
                resolve();
            });
        });
    }
})();

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
            await fs.mkdir(path.dirname(defaults.configuration));
        }
        await fs.writeFile(defaults.configuration, JSON.stringify(config, null, 4));
    }

    // create the ROOT applet directory
    if (fs.existsSync(path.join(ROOT, 'package.json')) === false) {
        if (fs.existsSync(ROOT) === false) {
            await fs.mkdir(ROOT);
            await fs.mkdir(path.join(ROOT, 'public'));
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
})();
