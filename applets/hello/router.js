const path = require('path');
var debug = require('debug')(`coffeecat:${path.basename(__dirname)}`);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var session = require('express-session');

var router = express.Router();

console.log(path.basename(__dirname));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

// allow this router to use files from the ./public directory
router.use(express.static(path.join(__dirname, 'public')));

// example of how to redirect HTTP to HTTPS
router.use((req, res, next) => {
    if (req.secure) {
        next();
    } else {
        let redirPath;
        if (req.config.port && req.config.sslPort) {
            let portReplace = new RegExp(`${req.config.port}$`)
            redirPath = 'https://' + (req.headers.host.replace(portReplace, req.config.sslPort)) + req.config.path + req.url;
        } else {
            redirPath = 'https://' + req.headers.host + req.config.path + req.url;
        }
    
        res.redirect(redirPath);
    }
});

/** TODO: Add application logic here */
router.get('/', (req, res, next) => { 
    if (req.secure) {
        req.session.count = req.session.count ? req.session.count + 1 : 1;
        res.render('index', { secure: req.secure, count: req.session.count });
    } else {
        console.log('ERROR: this should not happen');
    }
});

module.exports = router;