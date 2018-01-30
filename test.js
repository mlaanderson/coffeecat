const fs = require('fs');
const { fork } = require('child_process');
const path = require('path');

var filename = path.resolve(path.join('.', 'temp-config.conf'));
var conf = {
    "applets": [{ container: '/', path: path.resolve(path.join('.', 'applets', 'ROOT')) }],
    "protocols": [
        {
            "name": "http",
            "port": 65531,
            "listen": "0.0.0.0",
            "ssl": false,
            "cert": null,
            "key": null
        }
    ],
    "errorTemplate": "./conf/errors.ejs"
}

fs.writeFile(filename, JSON.stringify(conf, null, 4), (err) => {
    if (err) {
        console.log("ERROR:", err);
        return process.exit(1);
    }

    var task = fork("node bin/coffeecat.js", ["-c", filename], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    setTimeout(() => {
        if (task) task.kill();
        fs.unlink(filename, (err) => {
            if (err) {
                console.log("ERROR:", err);
                return process.exit(1);
            }
            process.exit(0);
        });
    }, 5000);
});