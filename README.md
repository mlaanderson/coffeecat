# coffeecat
Applet Container for NodeJS

![logo](https://cdn.rawgit.com/mlaanderson/coffeecat/f430499d/applets/ROOT/public/coffeecat.png)

## About
CoffeeCat provides a containerized system under [Express](https://www.expressjs.com). Containers are full Express applications
which are mounted automatically by the server at start up. CoffeeCat provides the structure for loading apps and associating them
with paths. It provides a configuration (JSON) based setup for the Express server.

## Installation
#### On Unix:
````
sudo npm install --global --unsafe git+https://github.com/mlaanderson/coffeecat.git
````
This installs the configuration file in ``/etc/coffeecat`` and sets up a single applet for ``/`` in ``/var/coffeecat``. The ``--unsafe`` flag allows the installer to create those folders and install the service.

If the npm installation fails for access, install using an npm tarball installation:
````
sudo npm install --global --unsafe https://github.com/mlaanderson/coffeecat/archive/master.tar.gz
````
To install a specific release (for example v2.1.0):
````
sudo npm install --global --unsafe https://github.com/mlaanderson/coffeecat/archive/v2.1.0.tar.gz
````

#### On Windows:
````
npm install --global git+https://github.com/mlaanderson/coffeecat.git
````

This installs the configuration file in ``%USERPROFILE%\.coffeecat\conf`` and a single applet for ``/`` in ``%USERPROFILE%\.coffeecat\applets``.

TODO: Create a service for Windows.

### Running
To run coffeecat in a console window, just run ``coffeecat``, it will locate and use its configuration file. On Unix, if it was installed with sudo and you want to run as a normal user, use ``coffeecat -c /etc/coffeecat/server.json``.

## Configuration
Configuration is done in a JSON file. The default configuration file location is in conf/server.json. An optional path
can be used by using the -c flag on the command line. An applet is defined by it's container (web path) and it's path (file system path).
Currently, only HTTP, HTTP/2, and HTTPS protocols, with or without WebSockets, are supported.

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
### autoLoadApplets
Specifies a file system location from which to automatically add applets to the applets array. Applets are sub directories
of this location and are loaded by directory name. That is if there is a directory called `hello`, the applet there will be mounted at
`/hello`. The only exception to this is a directory called `ROOT` which will be mounted at the webserver root.

### applets
An array of applet definitions. 
<dl>
    <dt>container</dt>
    <dd>The web root of the applet,</dd>
    <dt>path</dt>
    <dd>The file system path to the applet.</dd>
</dl>

### protocols
Currently supports http and https. Defines the ports to listen on, whether it is encrypted, and whether WebSockets are enabled.
<dl>
    <dt>name</dt>
    <dd>The name of the protocol, e.g. "http" or "https"</dd>
    <dt>port</dt>
    <dd>The numeric port for the protocol to listen on.</dd>
    <dt>listen</dt>
    <dd>A string of the interface address to listen on, or a boolean. False turns off the protocol, True is the same as "0.0.0.0", but not the same as the IPv6 equivalent "::".</dd>
    <dt>ssl</dt>
    <dd>Indicates whether an SSL certificate should be associated with this protocol.</dd>
    <dt>cert</dt>
    <dd>The SSL certificate location relative to the root directory of the coffeecat installation.</dd>
    <dt>key</dt>
    <dd>The SSL private key location relative to the root directory of the coffeecat installation.</dd>
</dl>

## IPv6
To listen on IPv6 addresses along with IPv4 addresses, just duplicate the protocol settings and include an IPv6 address.
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
            "name": "http",
            "port": 8080,
            "listen": "::",
            "websockets": true
        }
    ],
    "errorTemplate": "./conf/errors.ejs"
}
```

## HTTP/2
The built-in http2 module for NodeJS does not work as seamlessly with Express as the [spdy](https://github.com/spdy-http2/node-spdy) library. So install
the spdy library:
````
npm install -s git+https://github.com/spdy-http2/node-spdy.git
````

HTTP/2 is only supported with modern browsers and only with TLS. For Edge and Internet Exlporer, HTTP/2 is only supported in Windows 10 and higher. For Safari, HTTP/2 
is only supported in Mac OS X 10.11 and higher. For further compatibility see the [CanIUse page](https://caniuse.com/#feat=http2).

Configure the SPDY protocol with SSL, identical to an HTTPS configuration:
````
{
    "name": "spdy",
    "port": 8443,
    "listen": "0.0.0.0",
    "ssl": true,
    "cert": "./encryption/coffeecat.crt",
    "key": "./encryption/coffeecat.key"
}
````

In the applet, use the extended features of the HTTP/2 protocol to stream additional resources:

````
router.get('/', (req, res, next) => {
    var stream = res.push('/main.js', {
        status: 200,
        method: 'GET',
        request: {
            accept: '*/*'
        },
        response: {
            'content-type': 'application/javascript'
        }
    });
    stream.end('alert("Hello from SPDY aka HTTP/2");');
    res.render('index',{}); 
});
````
Where the index template includes ``<script src="main.js"></script>``