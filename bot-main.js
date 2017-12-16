'use strict';

// require all of our packages
const Telegraf = require('telegraf');                               // Telegram API abstract for Node
const Extra = require('telegraf/extra');                            // Extra stuff
const Markup = require('telegraf/markup');                          // For keyboard marjup
// declare our config-based opts and other globals
const CONFIG = require('./config/config.js');                       // Config file for the bot
const Logger = require('./lib/loggerClass.js');                     // Our custom logging class
const e621Helper = require('./lib/e621HelperClass.js');             // E621 API helper class
const VER = CONFIG.VER;
const USER_AGENT = CONFIG.USER_AGENT;
const app = new Telegraf(CONFIG.BOT_TOKEN);
const logger = new Logger();                                        // Create an instance of our custom logger
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

//TODO: create an e621 API wrapper
//TODO: catch errors and email admins on fatal crash
//TODO: setup a pagination system
//TODO: combine ENUMS and utils.js
//TODO: document and clean up what we already have!
//TODO: init help guide
//TODO: get the search function to allow for pagination
*/
logger.info(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);

app.command('start', ({ from, reply }) => {
    logger.info(`Start from ${JSON.stringify(from)}`);              // log when a new user starts the bot
    reply('I am working! Probably..');
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
    if(ctx.message.text.length.trim() <= 7) {
        ctx.reply('No tags given, searching most recent pictures...');
        return sendMessageWithImageResults(ctx);
    }
    return sendMessageWithImageResults(ctx, ctx.message.text.trim().substring(7));
});

app.startPolling();

app.command('custom', ({ reply }) => {
    return reply('Custom buttons keyboard', Markup
        .keyboard([
            ['🔍 Search', '😎 Popular'], // Row1 with 2 buttons
            ['☸ Setting', '📞 Feedback'], // Row2 with 2 buttons
        ])
        .oneTime()
        .resize()
        .extra()
    )
})

// TODO: really make sure this works
app.hears('🔍 Search', (ctx) => {
    ctx.reply('Give me a set of tags to search by and I\'ll give you the first image I find ')
    app.on('message', (ctx) => {
        ctx.reply('got it!')
        sendMessageWithImageResults(ctx, ctx.message.text.trim());
        return
        //allow for a /cancel
    })
})

app.catch((err) => {
    return errHandler(err);
})


function sendMessageWithImageResults(teleCtx, tagsArg) {
    console.log(tagsArg)
    return wrapper.getE621PostIndex(tagsArg, 1)
        .then((response) => {
            var urls = [];
            response.forEach((entry, index) => {
                console.log(entry);
                urls.push(entry);
            })
            return teleCtx.reply(urls[0].file_url);
        })
        .catch((err) => {
            return errHandler(err);
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
