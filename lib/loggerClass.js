// create a class for custom logging here
const chalk = require('chalk').default;
const config = require('../config/config.js');
const fs = require('fs');
/**
 * Create a new Logger instance
 *  TODO: create a log listener level, so things like info can be configured to not
 *  show up on the console
 * @class Logger
 */
class Logger {
    constructor(logLevel) {
        this.logLevel = logLevel
    }
    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send a DEBUG message to the console and to the debug log file
    */
    warn(logString) {
        console.log(`${chalk.yellow('DEBUG:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(config.debugLogDir, logMsg);
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
        fs.appendFileSync(config.infoLogDir, logMsg);
    }

    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send an AUTH message to the console and to the auth log file
     */
    auth(logString) {
        console.log(`${chalk.bgMagenta('AUTH:')} ${logString}`);
        let logMsg = `\n${new Date().toISOString()}: ${logString}`
        fs.appendFileSync(config.authLogDir, logMsg)
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
        fs.appendFileSync(config.warnLogDir, logMsg);
    }

    /**
     * @param {string} logString 
     * @memberof Logger
     * @returns {null}
     * @description Send an ERROR message to the console and to the error log file
     */
    error(logString) {
        let logMsg = `\n${new Date().toISOString()}: ${logString}`;
        fs.appendFileSync(config.errorLogDir, logMsg);
        console.log(`${chalk.red('ERROR:')} ${logString}`);
    }
}




module.exports = Logger