'use strict';

// Require all of our packages
const Telegraf = require('telegraf');                               // Telegram API abstract for Node
const Extra = require('telegraf/extra');                            // Extra stuff
const Markup = require('telegraf/markup');                          // For keyboard marjup
// Declare our config-based opts and other globals
const CONFIG = require('./config/config.js');                       // Config file for the bot
const Logger = require('./lib/loggerClass.js');                     // Our custom logging class
const e621Helper = require('./lib/e621HelperClass.js');             // E621 API helper class
const VER = CONFIG.VER;
const USER_AGENT = CONFIG.USER_AGENT;
const app = new Telegraf(CONFIG.BOT_TOKEN);
const logger = new Logger();                                        // Create an instance of our custo m logger
const wrapper = new e621Helper();                                   // Create an instance of the API wrapper to use
/*
Main entry point for the bot

Steps:
Get config opts
Set up logging
Init the bot
Connect to DB (eventually)
...more when I can think of it

Feature intent:
Be able to do basically anything you can on the e621 site
Be able to submit issues
Be able to have a custom profile for the bot
Have really good logging and user-based request monitoring
Be able to make announcements to all users
GET a 'popular by day/week/month' thing working

Notes:
- Telegraf sometimes doesn't like it when you try to return functions for replies
- ctx == context of the message from telegraf

//TODO: catch errors and email admins on fatal crash
//TODO: document and clean up what we already have!
//TODO: init help guide
//TODO: get the search function to allow for pagination
//TODO: get the bot to 'type' while loading requests
*/
logger.info(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);
app.startPolling();                                                 // start the bot and keep listening for events

// #region appCommands
app.command('start', ({ from, reply }) => {
    logger.info(`Start from ${JSON.stringify(from)}`);              // log when a new user starts the bot
    reply('Henlo! ${WELCOME_MESSAGE_HERE}');
});

app.command('whoami', (ctx) => {                                    // debugging
    ctx.reply(ctx.message.from.username);
});

app.command('ver', (ctx) => {                                       // get the version of the bot
    ctx.reply(VER);
});

app.command('help', (ctx) => {                                       // get the version of the bot
    ctx.reply('PlaceHolder');
});

//TODO: make this a lot more robust if we can't figure out the keyboard thing
app.command('search', (ctx) => {                                       // debugging
    if (ctx.message.text.length <= 7) {
        ctx.reply('No tags given, searching most recent pictures...');
        return sendMessageWithImageResults(ctx);
    }
    return sendMessageWithImageResults(ctx, ctx.message.text.trim().substring(7));
});

app.command('test', (ctx) => {                                       // get the version of the bot
    return paginateTest(ctx)
});

// #endregion

app.catch((err) => {
    return errHandler(err);
})

/**
 * Send the results of an image search through the E621 API
 * @param {JSON} teleCtx 
 * @param {String | String[]} tagsArg 
 * @returns {<telegraf.reply>}
 */
function sendMessageWithImageResults(teleCtx, tagsArg) {
    console.log(tagsArg);//debugging
    return wrapper.getE621PostIndexPaginate(tagsArg, 1, 60, 3)
        .then((response) => {
            var resultCount = 0;
            response.forEach((entry, index) => {
                resultCount = resultCount + entry.length;
            })
            return teleCtx.reply(`I got ${response.length} pages with ${resultCount} results at a page limit of 3 with 60 results per page, here's the first item: ${response[0][0].file_url}`)
        })
        .catch((err) => {
            // return a message that something went wrong to the user
            teleCtx.reply(`Looks like I ran into a problem. Make sure your tags don't have a typo!\n\nIf the issue persists contact {DEVELOPER_CONTACT_INFO}`)
            return errHandler(err);
        })
}

function paginateTest(teleCtx) {
    return wrapper.paginateE621Endpoint()
        .then((response) => {
            return teleCtx.reply(`I got ${response.length} pages, here's one item: ${response[0][3].file_url}`)
        })
}

/**
 * Main error handler for the bot for debugging
 * @param {Error} err 
 */
function errHandler(err) {
    logger.error(err);
    return app.telegram.sendMessage(CONFIG.TELEGRAM_ADMIN_ID, err.toString());
}
