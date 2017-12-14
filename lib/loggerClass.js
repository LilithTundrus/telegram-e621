// create a class for custom logging here
const chalk = require('chalk').default;
const config = require('../config/config.js');
const fs = require('fs');
/**
 * Create a new Logger instance
 * 
 * @class Logger
 */
class Logger {
    /**
     * Creates an instance of Logger.
     * @memberof Logger
     */
    constructor() {

    }

    /**
     * Send an INFO message to the console and to the info log file
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     */
    info(logString) {
        console.log(`${chalk.green('INFO:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`
        fs.appendFileSync(config.infoLogDir, logMsg)
    }

    /**
     * Send an AUTH message to the console and to the auth log file
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     */
    auth(logString) {
        console.log(`${chalk.bgMagenta('AUTH:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`
        fs.appendFileSync(config.authLogDir, logMsg)
    }

    /**
     * Send a WARN message to the console and to the warn log file
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     */
    warn(logString) {
        console.log(`${chalk.yellow('WARN:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`
        fs.appendFileSync(config.warnLogDir, logMsg)
    }

    /**
     * Send an ERROR message to the console and to the error log file
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     */
    error(logString) {
        let logMsg = `\n${new Date().toISOString()}: ${logString}`
        fs.appendFileSync(config.errorLogDir, logMsg)
        console.log(`${chalk.red('ERROR:')} ${logString}`);
    }
}




module.exports = Logger