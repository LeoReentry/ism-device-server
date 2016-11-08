'use strict';
// server.js

// =================================================
// =================================================
// SETUP
// =================================================
// =================================================
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var morgan = require('morgan'); // Logger

// =================================================
// =================================================
// CONFIGURATION
// =================================================
// =================================================

// -------------------------------------------------
// General configuration
// -------------------------------------------------
app.use(morgan('dev')); 	// Start logger
// -------------------------------------------------
// Views
// -------------------------------------------------
app.set('view engine', 'pug');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.set('views', __dirname+'/views');
require('./app/routes.js')(app);

// =================================================
// =================================================
// STARTUP
// =================================================
// =================================================
app.listen(port,  function () {
  console.log('ISM Device server running on port ' + port + '...');
});
