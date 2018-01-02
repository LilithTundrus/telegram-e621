'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Markup = require('telegraf/markup');

const registerHandler = async (ctx) => {
    return ctx.reply('placeHolder');
}

module.exports = registerHandler;