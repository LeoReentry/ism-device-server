'use strict';
// app/routes.js

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('home');
  });
};