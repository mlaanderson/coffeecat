# coffeecat
Applet Container for NodeJS

## About
CoffeeCat provides a containerized system under [Express](https://www.expressjs.com). Containers are full Express applications
which are mounted automatically by the server at start up. CoffeeCat provides the structure for loading apps and associating them
with paths. It provides a configuration (JSON) based setup for the Express server.

## Configuration
Configuration is done in a JSON file. The default configuration file location is in conf/server.xml. An optional path
can be used by using the -c flag on the command line. An applet is defined by it's container (web path) and it's path (file system path).
Currently, only HTTP and HTTPS protocols, with or without WebSockets, are supported.

```
{
    "autoLoadApplets": "./applets",
    "applets": [],
    "protocols": [
        {
            "name": "http",
            "port": 8080,
            "listen": "0.0.0.0"
        }, {
            "name": "https",
            "port": 8443,
            "listen": "0.0.0.0",
            "ssl": true,
            "cert": "./encryption/coffeecat.crt",
            "key": "./encryption/coffeecat.key"
        }
    ],
    "errorTemplate": "./conf/errors.ejs"
}
```
#### autoLoadApplets
Specifies a file system location from which to automatically add applets to the applets array. Applets are sub directories
of this location and are loaded by directory name. That is if there is a directory called `hello`, the applet there will be mounted at
`/hello`. The only exception to this is a directory called `ROOT` which will be mounted at the webserver root.

#### applets
An array of applet definitions. `container` is the web root of the applet, `path` is the file system path to the applet.

#### protocols
Currently supports http and https. Defines the ports to listen on, whether it is encrypted, and whether WebSockets are enabled.
If `listen` is set to `false`, the protocol will not be started. 