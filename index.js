// Main entry point for the bot
'use strict';
/**
 * @type {Telegraf}
 * Bot
 */
const bot = require('./bot/bot-main');
const errHandler = require('./utils/botErrHandler');
const config = require('./config/config');
const Logger = require('./lib/loggerClass');                        // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger

bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
});

// Put middleware stuff here
bot.use(
    require('./bot/commands')
);

// Start the bot
bot.startPolling();
logger.info(`e621client_bot ${config.VER} started at: ${new Date().toISOString()}`);

// Catch any severe errors
bot.catch(errHandler);