'use strict';
const chalk = require('chalk').default;
const config = require('../config/config.js');
const fs = require('fs');

class Logger {
    /**
     * Create a new Logger instance
     * 
     *  TODO: actually implement the loggingLevel
     * @class Logger
     */
    constructor() {
    }

    /**
     * @param {string} logStrings 
     * @memberof Logger
     * @returns {null | Error}
     * @description Send a DEBUG message to the console and to the debug log file
     */
    debug(...logStrings) {
        return logStringss.map(function (element) {
            console.log(`${chalk.yellow('DEBUG:')} ${element}`);
            let logMsg = `\n${new Date().toISOString()}: ${element}`;
            return fs.appendFile(config.debugLogDir, logMsg, (err) => {
                if (err) throw err;
            });
        })
    }

    /**
     * @param {string} logStrings 
     * @memberof Logger
     * @returns {null | Error}
     * @description Send an INFO message to the console and to the info log file
     */
    info(...logStringss) {
        return logStringss.map(function (element) {
            console.log(`${chalk.green('INFO:')} ${element}`);
            let logMsg = `\n${new Date().toISOString()}: ${element}`;
            return fs.appendFile(config.infoLogDir, logMsg, (err) => {
                if (err) throw err;
            });
        })
    }

    /**
     * @param {string} logStrings 
     * @memberof Logger
     * @returns {null | Error}
     * @description Send an AUTH message to the console and to the auth log file
     */
    auth(...logStrings) {
        return logStringss.map(function (element) {
            console.log(`${chalk.bgMagenta('AUTH:')} ${element}`);
            let logMsg = `\n${new Date().toISOString()}: ${element}`;
            return fs.appendFile(config.authLogDir, logMsg, (err) => {
                if (err) throw err;
            });
        })
    }

    /**
     * @param {string} logStrings 
     * @memberof Logger
     * @returns {null | Error}
     * @description Send a WARN message to the console and to the warn log file
     */
    warn(...logStrings) {
        return logStringss.map(function (element) {
            console.log(`${chalk.yellow('WARN:')} ${element}`);
            let logMsg = `\n${new Date().toISOString()}: ${element}`;
            return fs.appendFile(config.warnLogDir, logMsg, (err) => {
                if (err) throw err;
            });
        })
    }

    /**
     * @param {string} logStrings 
     * @memberof Logger
     * @returns {null | Error}
     * @description Send an ERROR message to the console and to the error log file
     */
    error(...logStrings) {
        return logStringss.map(function (element) {
            console.log(`${chalk.red('ERROR:')} ${element} At: ${element.stack}`);
            let logMsg = `\n${new Date().toISOString()}: ${element}`;
            return fs.appendFile(config.errorLogDir, logMsg, (err) => {
                if (err) throw err;
            });
        })
    }

    /**
     * @param {string} logStrings 
     * @memberof Logger
     * @returns {null | Error}
     * @description Send an DATABSE message to the console and to the error log file
     */
    db(...logStrings) {
        return logStringss.map(function (element) {
            console.log(`${chalk.bgBlue('DB:')} ${element}`);
            let logMsg = `\n${new Date().toISOString()}: ${element}`;
            return fs.appendFile(config.errorLogDir, logMsg, (err) => {
                if (err) throw err;
            });
        })
    }
}

module.exports = Logger;