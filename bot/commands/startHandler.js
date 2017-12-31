'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Markup = require('telegraf/markup');


const startHandler = async (ctx) => {
    logger.info(`Start from ${JSON.stringify(ctx.message.from)}`);  // log when a new user starts the bot
    return ctx.reply('Henlo! ${WELCOME_MESSAGE_HERE}', Markup
        .keyboard([
            ['🔍 Search', '😎 Popular'],
            ['☸ Settings', '📞 Feedback'],
        ])
        .oneTime()
        .resize()
        .extra()
    );
}

module.exports = startHandler;