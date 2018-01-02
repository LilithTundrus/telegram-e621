// Main entry point for the bot
'use strict';
/**
 * @type {Telegraf}
 * Bot
 */
const bot = require('./bot/bot-main');
const session = require('telegraf/session');
const errHandler = require('./utils/botErrHandler');
const config = require('./config/config');
const Logger = require('./lib/loggerClass');                        // Our custom logging class
const db = require('./db/database');                                // Custom DB abstractor
const logger = new Logger();                                        // Create an instance of our custom logger

//TODO: set up a response time checker
//TODO: set up the / commands in the botfather options

// Connect to the DB once throughout the while bot code
db.connect();

// Get the name of the bot and assign it to bot options
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
});

// Put middleware stuff here
bot.use(
    session(),
    // get the 'index.js' in the /bot/commands folder which contains listeners and handlers for commands
    require('./bot/commands'),
    require('./bot/listeners'),
    // Allow for attached .then() to a ctx.reply()
    (ctx, next) => {
        const reply = ctx.reply;
        ctx.reply = (...args) => {
            ctx.session.lastMessage = args;
            reply(...args);
        };
        return next();
    },
);

// Assign the db abstractor to ctx.db
bot.context.db = db;

// Start the bot
bot.startPolling();
logger.info(`e621client_bot ${config.VER} started at: ${new Date().toISOString()}`);

// Catch any severe errors
bot.catch(errHandler);