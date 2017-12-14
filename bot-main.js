'use strict';

// require all of our packages
const Telegraf = require('telegraf');                               // Telegram API abstract for Node

// declare our config-based opts and other globals
const CONFIG = require('./config/config.js');
const Logger = require('./lib/loggerClass.js');
const VER = CONFIG.VER;
const app = new Telegraf(CONFIG.BOT_TOKEN);
const logger = new Logger();                                          // Create an instance of our custom logger

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


//TODO: Initiate MVP
//TODO: create an e621 API wrapper
*/

logger.info(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);

app.command('start', ({ from, reply }) => {
     reply('I am working! Probably..');
});
app.command('whoami', (ctx) => {                                    //debugging
    ctx.reply(ctx.message.from.username)
});
app.command('ver', (ctx) => {                                       //get the version of the bot
    ctx.reply(VER);
});



app.startPolling();

app.catch((err) => {
    logger.error(err)
    ctx.reply(err);
})
