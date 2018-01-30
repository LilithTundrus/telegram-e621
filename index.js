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
//TODO: set up the /commands in the botfather options
//TODO: support ALL actions through BOTH command types (/commands and keyboard input)
//TODO: re-add support for user limit stuff via settings
//TODO: allow for users to provide their username/pw to create a custom profile for them
//TODO: allow for blacklist get from API or a bot-stored blacklist for each teleID
//TODO: update README.MD
//TODO: get settings menu working
//TODO: salt, hash the DB data
//TODO: make the bot more user friendly (add a help section!)
//TODO: create a 'picutre of the day' message thing to send daily
//TODO: error handle the e621 helper like MAD..it feels kind of brittle
//TODO: when allowing users to set a blacklist, ensure that the tags are valid
//against a JSON DB table that contains all possible valid e621 tags
//TODO: make everything a scene
//TODO: improve group usability
//TODO: improve user activity logging
//TODO: improve limit settings/db calls
//TODO: allow for user defined page limit AND an items per page limit
//TODO: allow a user to set a blacklist
//TODO: allow user logins
//TODO: get the bot to 'type' while loading requests
//TODO: fix the issue when exiting scenes and editing the last sent message that the HTML markup doesn't stay
//TODO: Allow for parts of the bot to be enabled/disabled by modules (module.enable/disable) for easy debugging and isolation

// Connect to the DB once throughout the while bot code
db.connect();

// Uncomment this if the DB has been destroyed
// db.createUserTable();

// Get the name of the bot and assign it to bot options
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
});

// Put middleware stuff here
bot.use(
    session(),
    // get the 'index.js' in the /bot/commands folder which contains listeners and handlers for commands
    require('./bot/commands'),
    // do the same for non '/command' listeners
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