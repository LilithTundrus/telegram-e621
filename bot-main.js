'use strict';

// require all of our packages
const Telegraf = require('telegraf');                               // Telegram API abstract for Node

// declare our config-based opts and other globals
const CONFIG = require('./config/config.js');
const Logger = require('./lib/loggerClass.js');
const e621Helper = require('./lib/e621HelperClass.js');
const VER = CONFIG.VER;
const USER_AGENT = CONFIG.USER_AGENT;
const app = new Telegraf(CONFIG.BOT_TOKEN);
const logger = new Logger();                                          // Create an instance of our custom logger
const wrapper = new e621Helper();

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

//TODO: Initiate MVP
//TODO: create an e621 API wrapper
//TODO: catch errors and email admins on fatal crash
//TODO: setup a pagination system
*/
logger.info(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);

app.command('start', ({ from, reply }) => {
    // log who started the bot here
    logger.info(`Start from ${JSON.stringify(from)}`);
    reply('I am working! Probably..');
});
app.command('whoami', (ctx) => {                                    // debugging
    ctx.reply(ctx.message.from.username)
});
app.command('ver', (ctx) => {                                       // get the version of the bot
    ctx.reply(VER);
});
app.command('help', (ctx) => {                                       // get the version of the bot
    ctx.reply('PlaceHolder');
});

app.command('recent', (ctx) => {                                       // debugging
    return sendRecentMessage(ctx);
});

app.startPolling();

app.catch((err) => {
    return errHandler(err);
})


function sendRecentMessage(teleCtx) {
    return wrapper.getE621PostIndex()
        .then((response) => {
            var urls = [];
            response.forEach((entry, index) => {
                console.log(entry);
                urls.push(entry.artist)
            })
            return teleCtx.reply(urls);
        })
        .catch((err) => {
            return errHandler(err);
        })

}

/**
 * Main error handler for the bot
 * @param {Error} err 
 */
function errHandler(err) {
    logger.error(err);
    app.telegram.sendMessage(CONFIG.TELEGRAM_ADMIN_ID, err);
}
