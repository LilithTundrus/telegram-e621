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

    constructor() {
        this.info = function (logString) {
            console.log(`${chalk.green('INFO:')} ${logString}`);
            let logMsg = `\n${new Date().toDateString()}: ${logString}`
            fs.appendFileSync(config.infoLogDir, logMsg)
        }
        this.auth = function (logString) {
            console.log(`${chalk.bgMagenta('AUTH:')} ${logString}`);
            let logMsg = `\n${new Date().toDateString()}: ${logString}`
            fs.appendFileSync(config.authLogDir, logMsg)
        }
        this.warn = function (logString) {
            console.log(`${chalk.yellow('WARN:')} ${logString}`);
            let logMsg = `\n${new Date().toDateString()}: ${logString}`
            fs.appendFileSync(config.warnLogDir, logMsg)
        }
        this.error = function (logString) {
            let logMsg = `\n${new Date().toDateString()}: ${logString}`
            fs.appendFileSync(config.errorLogDir, logMsg)
            console.log(`${chalk.red('ERROR:')} ${logString}`);
        }
    }
}




module.exports = Logger