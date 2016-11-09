'use strict';
// app/routes.js

module.exports = function(app) {
  // =================================================
  // =================================================
  // HOME PAGE
  // =================================================
  // =================================================
  app.get('/', function(req, res) {
    res.render('home', {
      pagetitle: 'Home'
    });
  });
  app.get('/home', function(req, res) {
    res.redirect('/');
  });
  // =================================================
  // =================================================
  // HOME PAGE
  // =================================================
  // =================================================
  app.get('/about', function(req, res) {
    res.render('about', {
      pagetitle: 'About'
    });
  });
  // =================================================
  // =================================================
  // Config PAGE
  // =================================================
  // =================================================
  app.get('/configuration', function(req, res) {var request = require('request');
    var url = 'https://ismportal.azurewebsites.net/api/newdevice';
    request.get({
        url: url,
        json: true
      }, (err, resp, data) => {
        if (err) {
          console.log('Error:', err);
          res.render('err');
        } else if (res.statusCode !== 200) {
          console.log('Status:', res.statusCode);
          res.render('err');
        } else {
          // data is already parsed as JSON:
          res.render('configuration', {
            pagetitle: 'Configuration',
            data: data
          });
        }
    });
  });

};
