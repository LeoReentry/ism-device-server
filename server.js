'use strict';
// server.js

// =================================================
// =================================================
// SETUP
// =================================================
// =================================================
require('dotenv').config();
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
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Please use https!\n");
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
  cookie: { secure: true }
}))
app.use(flash()); // Flash messages
// HTTPS certificates
var options = {
   key  : fs.readFileSync(__dirname + '/private.key'),
   cert : fs.readFileSync(__dirname + '/public.cert')
};
// -------------------------------------------------
// Views
// -------------------------------------------------
app.set('view engine', 'pug');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/public')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.set('views', __dirname+'/views');
require('./app/routes.js')(app, validator, xss, fs);

// =================================================
// =================================================
// STARTUP
// =================================================
// =================================================
https.createServer(options, app).listen(port, function () {
   console.log('ISM Device server running on port ' + port + '...');
});
