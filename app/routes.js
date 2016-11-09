'use strict';
// app/routes.js

module.exports = function(app, validator, xss) {
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
  // -------------------------------------------------
  // BASIC config page
  // Asks for URL of Portal
  // -------------------------------------------------
  app.get('/configuration', function(req, res) {
    var request = require('request');
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
  // POST
  // URL is defined
  app.post('/configuration', function(req, res) {
    // XSS protection
    var url = xss(req.body.portalurl);
    // If URL isn't valid, ask user to use correct URL
    if (!validator.isURL(url)) {
      res.render('configuration', {
        pagetitle: 'Configuration',
        error: 'Please specify a correct URL',
        url: url
      });
    }
    res.render('configuration_complete', {
      pagetitle: 'Configuration',
      portalurl: url,
      valid: validator.isURL(url)
    })
  })

};
