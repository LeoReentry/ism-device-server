#!/usr/bin/env node
'use strict';
// server.js

// =================================================
// =================================================
// SETUP
// =================================================
// =================================================
require('dotenv').config({path: "/home/debian/.ismdata/server/.env" });
var fs = require('fs');
var https = require('https');
var express = require('express');
var app = express();
var port = process.env.PORT || 443;
var morgan = require('morgan'); // Logger
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var validator = require('validator');
var xss = require('xss');
var helmet = require('helmet');
var csrf = require('csurf')

// =================================================
// =================================================
// CONFIGURATION
// =================================================
// =================================================
// -------------------------------------------------
// HTTP Server for asking users to redirect to HTTPS
// -------------------------------------------------
var http = require('http');
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  response.end("<!DOCTYPE html><html><body><h1>Please use HTTPS.</h1></body></html>");
});
server.listen(process.env.HTTPPORT || 80);
// -------------------------------------------------
// General configuration
// -------------------------------------------------
app.use(helmet());
app.use(morgan('dev')); 	// Start logger
app.use(bodyParser.urlencoded({ extended: true })); // Support URL encoded bodies
app.use(bodyParser.json({ extended: true })); // Support JSON encoded bodies
app.use(session({
  name: 'ThisIsACookie',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, httpOnly: true, maxAge: 1000*60*60 }
}))
app.use(flash()); // Flash messages
// HTTPS certificates
var options = {
   key  : fs.readFileSync('/home/debian/.ismdata/server/private.key'),
   cert : fs.readFileSync('/home/debian/.ismdata/server/public.cert')
};
// -------------------------------------------------
// CSRF Tokens
// -------------------------------------------------
var csrfProtection = csrf()
// -------------------------------------------------
// Views
// -------------------------------------------------
app.set('view engine', 'pug');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/public')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.set('views', __dirname+'/views');
require('./app/routes.js')(app, validator, xss, fs, csrfProtection);

// =================================================
// =================================================
// STARTUP
// =================================================
// =================================================
https.createServer(options, app).listen(port, function () {
   console.log('ISM Device server running on port ' + port + '...');
});
