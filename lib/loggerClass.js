'use strict';
const chalk = require('chalk').default;
const CONFIG = require('../config/config.js');
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
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send a DEBUG message to the console and to the debug log file
     */
    debug(logString) {
        console.log(`${chalk.yellow('DEBUG:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(CONFIG.debugLogDir, logMsg);
    }

    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send an INFO message to the console and to the info log file
     */
    info(logString) {
        console.log(`${chalk.green('INFO:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(CONFIG.infoLogDir, logMsg);
    }

    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send an AUTH message to the console and to the auth log file
     */
    auth(logString) {
        console.log(`${chalk.bgMagenta('AUTH:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(CONFIG.authLogDir, logMsg);
    }

    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send a WARN message to the console and to the warn log file
     */
    warn(logString) {
        console.log(`${chalk.yellow('WARN:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(CONFIG.warnLogDir, logMsg);
    }

    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send an ERROR message to the console and to the error log file
     */
    error(logString) {
        console.log(`${chalk.red('ERROR:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(CONFIG.errorLogDir, logMsg);
    }

    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send an DATABSE message to the console and to the error log file
     */
    db(logString) {
        console.log(`${chalk.bgBlue('DB:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(CONFIG.errorLogDir, logMsg);
    }
}

module.exports = Logger;