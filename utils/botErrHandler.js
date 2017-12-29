'use strict';

const Logger = require('../lib/loggerClass.js');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
/**
 * Main error handler for the bot
 * @param {Error} err
 */
function errHandler(err) {
    logger.error(err);
}
