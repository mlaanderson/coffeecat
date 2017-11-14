const path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

// allow this router to use files from the ./public directory
router.use(express.static(path.join(__dirname, 'public')));

/** TODO: Add application logic here */

module.exports = router;