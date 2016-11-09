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
  // ABOUT PAGE
  // =================================================
  // =================================================
  app.get('/about', function(req, res) {
    res.render('about', {
      pagetitle: 'About'
    });
  });
  // =================================================
  // =================================================
  // CONFIG PAGE
  // =================================================
  // =================================================
  // -------------------------------------------------
  // BASIC config page
  // -------------------------------------------------
  app.get('/configuration', function(req, res) {
    res.render('configuration', {
      pagetitle: 'Configuration',
      url: 'https://ismportal.azurewebsites.net'
    });
  });
  // POST
  // URL is defined
  app.post('/configuration', function(req, res) {
    // XSS protection
    var url = xss(req.body.portalurl);
    // If URL isn't valid, ask user to use correct URL
    if (!validator.isURL(url)) {
      return res.render('configuration', {
        pagetitle: 'Configuration',
        error: 'Please specify a correct URL',
        url: url
      });
    }

    // URL is valid
    var request = require('request');
    // Add API to URL
    var apiUrl = url + '/api/newdevice';
    // Make request to API to get Locations
    request.get({
        url: apiUrl,
        json: true
      }, (err, resp, data) => {
        // An error occured
        if (err) {
          console.log('Error:', err);
          res.render('err');
        // Something bad has happened
        } else if (res.statusCode !== 200) {
          console.log('Status:', res.statusCode);
          res.render('err');
        // Everything OK
        } else {
          // data is already parsed as JSON
          res.render('configuration_complete', {
            pagetitle: 'Configuration',
            portalurl: url,
            data: data,
            error: req.flash('nameError'),
            urlMessage: req.flash('urlError'),
            inName:req.body.name
          });
        }
    });
  })

  app.post('/configuration/done', function(req, res){
    // XSS protection
    var url = xss(req.body.portalurl);
    var sw = xss(req.body.software);
    var hw = xss(req.body.hardware);
    var loc = xss(req.body.location);
    var nm = xss(req.body.name);

    // Only alphanumerical  characters allowed
    var r = /^[\w]+$/
    // If no name has been specified or name invalid
    if (nm.length == 0 || !nm.match(r)) {
      // Make a 307 redirect
      // That means make same post request again
      req.flash('nameError', 'Please specify a name. Only alphanumerical characters and underscore allowed.')
      return res.redirect(307, '/configuration');
    }

    // Ok, if nobody is tampering with our website, we're good to go
    // Just double check URL
    if (!validator.isURL(url)) {
      req.flash('urlError', 'Incorrect URL format.')
      return res.redirect(307, '/configuration');
    }
    // This only applies if someone actively tries to edit the POST data since it's from select fields
    if (isNaN(sw) || isNaN(hw) || isNaN(loc)) {
      return res.redirect(307, '/configuration');
    }

    // We're good
    // Make the request to the api
    var request = require('request');
    // Add API to URL
    var apiUrl = url + '/api/newdevice/' + nm + '?sw=' + sw + '&hw=' + hw + '&loc=' + loc;
    // Make request to API to get Locations
    request.get({
        url: apiUrl,
        json: true
      }, (err, resp, data) => {
        // An error occured
        if (err) {
          console.log('Error:', err);
          res.render('err');
        // Something bad has happened
        } else if (res.statusCode !== 200) {
          console.log('Status:', res.statusCode);
          res.render('err');
        // Everything OK
        } else {
          // Oh no, an error in the request
          if (data.Error) {
            if (data.Error === "This device ID is already taken.") {
              req.flash('nameError', data.Error);
              return res.redirect(307, '/configuration');
            }
            return res.render("err", {
              message: "An unexpected error has occured."
            });
          }

          // data is already parsed as JSON
          res.render('status', {
            pagetitle: 'Configuration',
            code: data.Code,
            name: data.Id,
            type: 'conf'
          });
        }
    });


  });

  app.get('/status', function(req, res) {
    res.render('status',{
      type: 'status',
      code: '123456',
      name: 'name',
      pagetitle: 'Status'
    });
  });

};
