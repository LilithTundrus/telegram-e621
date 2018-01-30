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
function disconnect() {
    logger.info('DB DISCONNECT');
    return con.destroy();
}

function createUserTable() {
    var sql = "CREATE TABLE userdata (teleid VARCHAR(255), setlimit VARCHAR(255))";
    con.query(sql, function (err, result) {
        if (err) throw err;
        logger.debug('Created main table');
    });
}

/**
 * Add a user to the userdata table
 * @param {Number} teleid 
 * @param {Number} limit 
 */
function addTelegramUserLimit(teleid, limit) {
    var sql = `INSERT INTO userdata (teleid, setlimit) VALUES ('${teleid}', '${limit}')`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        logger.auth(`Created new user with ID: ${teleid} and a limit of ${limit}`);
    });
}

/**
 * Update an existing user's limitset
 * @param {Number} teleid 
 * @param {Number} newLimit 
 */
function updateTelegramUserLimit(teleid, newLimit) {
    var sql = `UPDATE userdata SET setlimit = '${newLimit}' WHERE teleid = '${teleid}'`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        logger.auth(`Updated limit for user with ID: ${teleid} to ${newLimit}`);
    });
}

/**
 * Get a user's limit by their Telegram ID
 * @param {Number} teleid 
 * @returns {JSON}
 */
function getTelegramUserLimit(teleid) {
    return new Promise((resolve, reject) => {
        var sql = `SELECT * FROM userdata WHERE teleid = '${teleid}'`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            if (result.length < 1) {
                return reject(`No user was found with the ID ${teleid}`);
            } else {
                logger.db(`Found ID in database: ${result[0].teleid}`);
                return resolve(result);
            }
        });
    });
}

/**
 * REMOVE a user from userdata by ID
 * @param {Number} teleid 
 * @returns {Void}
 */
function removeTelegramUser(teleid) {
    return new Promise((resolve, reject) => {
        var sql = `DELETE FROM userdata WHERE teleid = '${teleid}'`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            resolve(logger.db(`REMOVED user with ID ${teleid} from userdata`));
        });
    });
}



module.exports.connect = connect;
module.exports.createUserTable = createUserTable;
module.exports.addTelegramUserLimit = addTelegramUserLimit;
module.exports.updateTelegramUserLimit = updateTelegramUserLimit;
module.exports.getTelegramUserLimit = getTelegramUserLimit;
module.exports.removeTelegramUser = removeTelegramUser;
module.exports.disconnect = disconnect;
