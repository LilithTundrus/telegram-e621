'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger


const searcHanlder = async (ctx) => {
    logger.debug(`Search started from ${ctx.message.from.username}`);
    return ctx.reply('AAAAAAAAAA');
}

module.exports = searcHanlder;