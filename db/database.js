'use strict';
const mysql = require('mysql');
const CONFIG = require('../config/config.js');
const Logger = require('../lib/loggerClass.js');
const logger = new Logger();                                          // Create an instance of our custom logger

var con = mysql.createConnection({
    host: CONFIG.dbHost,
    user: CONFIG.dbUserName,
    password: CONFIG.dbPassword
});

function connect() {
    return con.connect(function (err) {
        if (err) throw err;
        logger.info('Connected to DB.');
    });
}

//put the middleware here!

module.exports.connect = connect;