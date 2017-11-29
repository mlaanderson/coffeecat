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
            "listen": "0.0.0.0",
            "websockets": true
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
An array of applet definitions. 
<dl>
    <dt>container</dt>
    <dd>The web root of the applet,</dd>
    <dt>path</dt>
    <dd>The file system path to the applet.</dd>
</dl>

#### protocols
Currently supports http and https. Defines the ports to listen on, whether it is encrypted, and whether WebSockets are enabled.
<dl>
    <dt>name</dt>
    <dd>The name of the protocol, e.g. "http" or "https"</dd>
    <dt>port</dt>
    <dd>The numeric port for the protocol to listen on.</dd>
    <dt>listen</dt>
    <dd>A string of the interface address to listen on, or a boolean. False turns off the protocol, True is the same as "0.0.0.0"</dd>
    <dt>ssl</dt>
    <dd>Indicates whether an SSL certificate should be associated with this protocol.</dd>
    <dt>cert</dt>
    <dd>The SSL certificate location relative to the root directory of the coffeecat installation.</dd>
    <dt>key</dt>
    <dd>The SSL private key location relative to the root directory of the coffeecat installation.</dd>
    <dt>websockets</dt>
    <dd>Indicates whether to attach a WebSockets server on top of this protocol</dd>
</dl>

## WebSockets
If a protocol supports WebSockets, then a WebSocket server will be started on top of that protocol. WebSocket clients are directed according to the request URI. If there is an applet mounted at /test, then WebSocket clients need to be created for the /test path. A future enhancement might parse the request path to see which applet it needs to be routed to.