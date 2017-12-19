'use strict';
const mysql = require('mysql');
const CONFIG = require('../config/config.js');


var con = mysql.createConnection({
  host: CONFIG.dbHost,
  user: CONFIG.dbUserName,
  password: CONFIG.dbPassword
});


con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});