'use strict';
// app/routes.js

module.exports = function(app, validator, xss, fs, csrfProtection) {
  var configFilePath = "/home/debian/.ismdata/config.json"
  app.get('/shutdown', csrfProtection, (req, res) => {
    res.render('shutdown', {
      pagetitle: "Shutdown",
      message: "Server is shut down.",
      Token: req.csrfToken()
    });
  });
  app.post('/shutdown/yes', csrfProtection, (req, res) => {
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
  app.get('/configuration', csrfProtection, function(req, res) {
    res.render('configuration', {
      pagetitle: 'Configuration',
      url: 'https://ismportal.azurewebsites.net',
      Token: req.csrfToken()
    });
  });
  // POST
  // URL is defined
  app.post('/configuration', csrfProtection, function(req, res) {
    // XSS protection
    var url = xss(req.body.portalurl);
    // If URL isn't valid, ask user to use correct URL
    if (!validator.isURL(url)) {
      return res.render('configuration', {
        pagetitle: 'Configuration',
        error: 'Please specify a correct URL',
        url: url,
        Token: req.csrfToken()
      });
    }

    // URL is valid
    var request = require('request');
    // Add API to URL
    var apiUrl = url + '/api/newdevice';
    // Make request to API to get Locations
    request.get({ url: apiUrl, json: true }, (err, resp, data) => {
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
      }
      // data is already parsed as JSON
      return res.render('configuration_complete', {
        pagetitle: 'Configuration',
        portalurl: url,
        data: data,
        error: req.flash('nameError'),
        urlMessage: req.flash('urlError'),
        inName:req.body.name,
        Token: req.csrfToken()
      });
    });
  })

  app.post('/configuration/done', csrfProtection, function(req, res){
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
    // Promise for request
    var getRequest = new Promise((resolve, reject) => {
      request.get({ url: apiUrl, json: true }, (err, resp, data) => {
        // An error occured
        if (err) {
          console.log('Error: ', err);
          req.flash('errormessage', 'An error occured trying to contact the server.');
          reject('Error');
        // Something bad has happened
        } else if (resp.statusCode !== 200) {
          console.log('Status: ' + resp.statusCode);
          req.flash('errormessage', "Error. The server API doesn't work as expected.");
          reject('Error');
        } else {
          // Everything's fine, return our data
          resolve(data);
        }
      });
    });

    getRequest.then((data) => {
      // An API error occured
      if (data.Error) {
        if (data.Error === "This device ID is already taken.") {
          req.flash('nameError', data.Error);
          throw new Error('Configuration');
        }
        req.flash('errormessage', "An unexpected error has occured.");
        throw new Error('Error');
      }
      // Encrypt password
      var exec = require('child_process').exec;
      var cmd = "/usr/sbin/tpm_resetdalock -z && /home/debian/bin/deh -en password '" + data.Password + "'";
      exec(cmd, function(error, stdout, stderr) {
        if (error) {
          console.error('An error occured while trying to encrypt the password: ' + error);
          req.flash('errormessage', "An error occured while trying to encrypt the password. Please restart configuration.");
          throw new Error('Error');
        }
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
        fs.writeFile(configFilePath, JSON.stringify( config ), "utf8" );
        res.render('status', {
          pagetitle: 'Configuration',
          code: data.Code,
          name: data.Id,
          status: config.status,
          type: 'conf',
          Token: req.csrfToken()
        });
      }); // exec
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
      else if (error == 'Error: Configuration' || error == 'Configuration') {
        return res.redirect(307, '/configuration');
      }
      else {
        console.error(error);
        res.render('err', {
          pagetitle: 'Error',
          message: error
        });
      }
    });
  });

  // =================================================
  // =================================================
  // STATUS PAGE
  // =================================================
  // =================================================
  app.get('/status', csrfProtection, function(req, res) {
    fs.readFile(configFilePath, (err, data) => {
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
        Token: req.csrfToken()
      });
    });
  });


  // =================================================
  // =================================================
  // CHECK APPROVAL PAGE
  // =================================================
  // =================================================
  var nop = function(){};

  app.post('/status', csrfProtection, (req, res) => {
    // Promise for reading configuration file
    var fileRead = new Promise((resolve, reject) => {
      // Read file
      fs.readFile(configFilePath, (err, config) => {
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
      exec('/usr/sbin/tpm_resetdalock -z && /home/debian/bin/deh -dn password', callback);
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
        fs.writeFile(configFilePath, JSON.stringify(values.configData), 'utf8');
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
      values.configData.publicKeyUrl = values.data.PublicKeyUrl;
      fs.writeFile(configFilePath, JSON.stringify(values.configData), 'utf8');

      // Encrypt data
      // Execute child processes
      var exec = require('child_process').exec;
      return new Promise((resolve, reject) => {
        // Properly escape double quotes in JSON string by using single quotes in bash
        var cmd = "/home/debian/bin/deh -en settings '" + JSON.stringify(values.data) + "'";
        // Reset TPM DA lock and encrypt the settings
        exec('/usr/sbin/tpm_resetdalock -z && ' + cmd, (error, stdout, stderr) => {
          if(error) {
            console.error(error);
            req.flash('errormessage', 'An error happened during the encryption of the data. Please reconfigure the device.');
            return reject('Error');
          }
          resolve()
        });
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
