'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Markup = require('telegraf/markup');

const limitHanlder = async (ctx) => {
    if (ctx.message.text.trim().length <= 6) {
        return ctx.reply('Please give a number between 1 and 50 as a limit');
    }
    return limitSetHandler(ctx);
}

function limitSetHandler(teleCtx) {
    let limitVal = teleCtx.message.text.substring(6).trim();
    // validate number is correct
    if (isNaN(parseInt(limitVal)) == true || limitVal.length > 2) {
        return teleCtx.reply(`Sorry, ${limitVal} is not valid (Max allowed: 50)`);
    }
    if (parseInt(limitVal) > 50 || parseInt(limitVal) < 1) {
        return teleCtx.reply(`Sorry, ${limitVal} is not valid (Max allowed: 50)`);
    }
    // call the DB, make sure the user exists, if not add them by Telegram ID
    return teleCtx.db.getTelegramUserLimit(teleCtx.message.from.id)
        .then((userData) => {
            teleCtx.reply(`Your old limit: ${userData[0].setlimit}`);
            teleCtx.db.updateTelegramUserLimit(teleCtx.message.from.id, limitVal);
            return teleCtx.reply(`Your new limit: ${limitVal}`);
        })
        .catch((err) => {
            // user does not exist (that's the error)
            logger.debug(err);
            teleCtx.db.addTelegramUserLimit(teleCtx.message.from.id, limitVal);
            return teleCtx.reply(`You've been added to the databse, your custom limit is now set to ${limitVal}`);
        })
}


module.exports = limitHanlder;