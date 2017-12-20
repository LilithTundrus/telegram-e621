'use strict';
const mysql = require('mysql');
const CONFIG = require('../config/config.js');
const Logger = require('../lib/loggerClass.js');
const logger = new Logger();                                          // Create an instance of our custom logger

var con = mysql.createConnection({
    host: CONFIG.dbHost,
    user: CONFIG.dbUserName,
    password: CONFIG.dbPassword,
    database: CONFIG.dbName
});

//put the middleware here!

function connect() {
    return con.connect(function (err) {
        if (err) throw err;
        logger.info('Connected to DB.');
    });
}

function createUserTable() {
    var sql = "CREATE TABLE userdata (teleid VARCHAR(255), setlimit VARCHAR(255))";
    con.query(sql, function (err, result) {
        if (err) throw err;
        logger.debug('Created main table');
    });
}

function checkIfUserExists(teleid) {
    return new Promise((resolve, reject) => {
        var sql = `SELECT * FROM userdata WHERE teleid = '${teleid}'`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                logger.debug(`No user found matching ${teleid}`);
                return resolve(false);
            }
            logger.debug(`Found a user matching ${teleid}`);
            return resolve(true);
        });
    })

}

function addTelegramUserLimit(teleid, limit) {
    var sql = `INSERT INTO userdata (teleid, setlimit) VALUES ('${teleid}', '${limit}')`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        logger.info(`Created new user with ID: ${teleid} and a limit of ${limit}`);
    });
}

function updateTelegramUserLimit(teleid, newLimit) {
    var sql = `UPDATE userdata SET setlimit = '${newLimit}' WHERE teleid = '${teleid}'`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        logger.info(`Updated limit for user with ID: ${teleid} to ${newLimit}`);
    });
}

function getTelegramUserLimit(teleid) {
    var sql = `SELECT * FROM userdata WHERE teleid = '${teleid}'`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        logger.debug(result);
        return result;
    });
}


module.exports.connect = connect;
module.exports.createUserTable = createUserTable;
module.exports.addTelegramUserLimit = addTelegramUserLimit;
module.exports.checkIfUserExists = checkIfUserExists;
module.exports.updateTelegramUserLimit = updateTelegramUserLimit;
module.exports.getTelegramUserLimit = getTelegramUserLimit;