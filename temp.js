
      // Decrypt password
      var exec = require('child_process').exec;
      exec('deh -dn password', function(error, stdout, stderr) {
      });

  // Ok, everything is good. Now, let's make the request
  var apiUrl = configData.url + '/api/newdevice/' + configData.name + '?code=' + configData.code + '&password=' + encodeURIComponent(stdout.replace(/[\n\t\r]/g,""));
  console.log(apiUrl);
  var request = require('request');
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
          console.log(data.Error);
          if (data.Error === "Device does not exist.") {
            configData.status = "Denied";
            fs.writeFile('config.json', JSON.stringify(configData), 'utf8');
            req.flash("statuserror", "Device was rejected from portal.")
            return res.redirect('/status');
          }
          req.flash("statusmessage", "Device is not approved yet. Please approve the device and double-check the verification code.")
          return res.redirect('/status');
        }
        // Encrypt secret
        var exec = require('child_process').exec;
        var cmd = 'deh -e -n connectionstring ' + data.Key;
        exec(cmd, function(error, stdout, stderr) {
          // command output is in stdout
        });
        configData.status = "Approved";
        fs.writeFile('config.json', JSON.stringify(configData), 'utf8');
        req.flash('statussuccess', 'Device has been approved.')
        res.redirect('/status');
      } // else (everything ok)
  }); // request.get
