'use strict';

// require all of our packages
const Telegraf = require('telegraf');                               // Telegram API abstract for Node
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
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
//TODO: combine ENUMS and utils.js
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

app.command('test', (ctx) => {                                       // debugging
    return sendRecentMessage(ctx);
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
        return sendRecentMessage(ctx, ctx.message.text.trim());
        
        //allow for a /cancel

    })
})

app.catch((err) => {

    return errHandler(err);
})


function sendRecentMessage(teleCtx, tagsArg) {
    console.log(tagsArg)
    return wrapper.getE621PostIndex(tagsArg, 2)
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
 * Main error handler for the bot
 * @param {Error} err 
 */
function errHandler(err) {
    logger.error(err);
    app.telegram.sendMessage(CONFIG.TELEGRAM_ADMIN_ID, JSON.stringify(err, null, 2));
}
