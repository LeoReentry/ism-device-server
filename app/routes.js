'use strict';
// app/routes.js

module.exports = function(app, validator, xss, fs) {
  app.get('/shutdown', (req, res) => {
    res.render('shutdown', {
      pagetitle: "Shutdown",
      message: "Server is shut down."
    });
    // process.exit();
  });
  app.get('/shutdown/yes', (req, res) => {
    process.exit();
  });
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
          return res.render('err', {
            message: 'An error occured trying to contact the server.',
            pagetitle: 'Configuration'
          });
        // Something bad has happened
        } else if (res.statusCode !== 200) {
          console.log('Status:', res.statusCode);
          return res.render('err', {
            message: "Error. The server API doesn't work as expected",
            pagetitle: 'Configuration'
          });
        // Everything OK
        } else {
          // data is already parsed as JSON
          return res.render('configuration_complete', {
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
          return res.render('err', {
            message: 'An error occured trying to contact the server.',
            pagetitle: 'Configuration'
          });
        // Something bad has happened
        } else if (res.statusCode !== 200) {
          console.log('Status:', res.statusCode);
          return res.render('err', {
            message: "Error. The server API doesn't work as expected",
            pagetitle: 'Configuration'
          });
        // Everything OK
        } else {
          // Oh no, an error in the request
          if (data.Error) {
            if (data.Error === "This device ID is already taken.") {
              req.flash('nameError', data.Error);
              return res.redirect(307, '/configuration');
            }
            return res.render("err", {
              message: "An unexpected error has occured.",
              pagetitle: 'Configuration'
            });
          }

          // Encrypt password
          var exec = require('child_process').exec;
          var cmd = 'deh -en password "' + data.Password + '"';
          exec(cmd, function(error, stdout, stderr) {
            if (/Tpm is defending against dictionary attacks/.test(stdout)) {
              cmd = 'tpm_resetdalock -z';
              exec(cmd, function(error, stdout, stderr) {
                res.render('err', {
                  message: "Error. The device encryption module is in lockdown mode because it is protecting itself against dictionary attacks. We will reset it. Please restart configuration. If this error persists, you might be under attack.",
                  pagetitle: 'Configuration'
                });
              });
            } else {
              // data is already parsed as JSON
              var config = {
                name: nm,
                url: url,
                sw: sw,
                hw: hw,
                loc: loc,
                code: data.Code,
                status: "Approval pending"
              }
              fs.writeFile("config.json", JSON.stringify( config ), "utf8" );
              res.render('status', {
                pagetitle: 'Configuration',
                code: data.Code,
                name: data.Id,
                status: config.status,
                type: 'conf'
              });
            }
          }); // Exec deh
        }
    });
  });

  // =================================================
  // =================================================
  // STATUS PAGE
  // =================================================
  // =================================================
  app.get('/status', function(req, res) {
    fs.readFile('config.json', (err, data) => {
      if (err) {
        return res.render('err', {
          message: 'Please configure the device.',
          pagetitle: "Status"
        });
      }
      var status = JSON.parse(data);
      if (status.code === undefined || status.name === undefined) {
        return res.render('err', {
          message: 'Please configure the device.',
          pagetitle: "Status"
        });
      }
      res.render('status',{
        type: 'status',
        code: status.code,
        name: status.name,
        status: status.status,
        pagetitle: 'Status',
        message: req.flash('statusmessage'),
        error: req.flash('statuserror'),
        success: req.flash('statussuccess'),
      });
    });
  });


  // =================================================
  // =================================================
  // CHECK APPROVAL PAGE
  // =================================================
  // =================================================
  var nop = function(){};

  app.post('/status', (req, res) => {
    // Promise for reading configuration file
    var fileRead = new Promise((resolve, reject) => {
      // Read file
      fs.readFile('config.json', (err, config) => {
        // Handle error
        if (err) {
          req.flash('errormessage', 'Device not configured.')
          return reject('Error');
        }
        // Parse the configuration data
        var configData = JSON.parse(config);
        // If the device is already approved, we don't need to to anything. Redirect.
        if (configData.status === 'Approved')
          return reject('Status');
        // Ok, everything's fine
        resolve(configData);
      }); // fs.readFile
    }); // Promise fileRead
    // Promise that we'll decrypt the password
    var passwordRead = new Promise((resolve, reject) => {
      // Execute child processes
      var exec = require('child_process').exec;
      // A for child processes
      function callback(error, stdout, stderr) {
        // Some error
        if (error) {
          console.error(error);
          req.flash('errormessage', 'An error happened during the decryption of the password.');
          return reject('Error');
        }
        // Everything is ok
        resolve(stdout);
      }
      // First reset the DA lock (just in case), then decrypt the password
      exec('tpm_resetdalock -z', exec('deh -dn password', callback) );
    }); // Promise passwordRead


    // Execute reading config data and password
    Promise.all([fileRead, passwordRead])
    // Make API request to see if we have been approved
    .then((values) => {
      // Get variables
      var configData = values[0];
      var password = values[1];
      // Build API request URL
      var apiUrl = configData.url + '/api/newdevice/' + configData.name + '?code=' + configData.code + '&password=' + encodeURIComponent(password.replace(/[\n\t\r]/g,""));
      // Make the request
      var request = require('request');
      return new Promise((resolve, reject) => {
        request.get({ url: apiUrl, json: true }, (err, resp, data) => {
          resolve( {err: err, resp: resp, data:data, configData: configData} );
        });
      });
    })
    // Process the API response
    .then((values) => {
      // Request finished
      // An error occured
      if (values.err) {
        console.error(values.err);
        req.flash('errormessage', 'An error occured trying to contact the server.');
        // Abort promise chain
        throw new Error('Error');
      }
      // Something bad has happened in the request
      if (values.resp.statusCode !== 200) {
        console.log('Status: ' + values.resp.statusCode);
        req.flash('errormessage', "Error. The server API doesn't work as expected");
        // Abort promise chain
        throw new Error('Error');
      }
      // Device has been removed or denied
      if (values.data.Error && values.data.Error == "Device does not exist.") {
        values.configData.status = "Denied";
        fs.writeFile('config.json', JSON.stringify(values.configData), 'utf8');
        req.flash('statuserror', "Device was rejected from portal.");
        // Abort promise chain
        throw new Error('Status');
      }
      // Device is not approved yet
      if (values.data.Error) {
        req.flash('statusmessage', "Device is not approved yet. Please approve the device and double-check the verification code.");
        // Abort promise chain
        throw new Error('Status');
      }
      // Everything's good.
      // Write configuration back to device
      values.configData.status = "Approved";
      fs.writeFile('config.json', JSON.stringify(values.configData), 'utf8');

      // Encrypt data
      // Execute child processes
      var exec = require('child_process').exec;
      return new Promise((resolve, reject) => {
        // Properly escape double quotes in JSON string by using single quotes in bash
        var cmd = "deh -en settings '" + JSON.stringify(values.data) + "'";
        // Reset TPM DA lock and encrypt the settings
        exec('tpm_resetdalock -z', exec(cmd, (error, stdout, stderr) => {
          if(error) {
            console.error(error);
            req.flash('errormessage', 'An error happened during the encryption of the data. Please reconfigure the device.');
            return reject('Error');
          }
          resolve()
        }));
      });
    })
    // Process the received data
    .then(() => {
      req.flash('statussuccess', 'Device has been approved.')
      return res.redirect('/status');
    })
    .catch((error) => {
      if (error == 'Error') {
        return res.render('err', {
          pagetitle: 'Status',
          message: req.flash('errormessage')
        });
      }
      else if (error == 'Error: Status' || error == 'Status') {
        return res.redirect('/status');
      }
      else {
        console.error(error);
        res.render('err', {
          pagetitle: 'Error',
          message: error
        });
      }
    }); // catch
  }); // app.get

};
