'use strict';
const Logger = require('../../lib/loggerClass');                        // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger

const startHandler = async (ctx) => {
    logger.info(`Start from ${JSON.stringify(ctx.message.from)}`);              // log when a new user starts the bot
    return ctx.reply('Henlo! ${WELCOME_MESSAGE_HERE}');
}

module.exports = startHandler;