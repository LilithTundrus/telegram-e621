'use strict';

// require all of our packages
const Telegraf = require('telegraf');                               // Telegram API abstract for Node


// declare our config-based opts and other globals
const CONFIG = require('./config/config.js');
const VER = CONFIG.VER;

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

*/
const app = new Telegraf(CONFIG.BOT_TOKEN);
console.log(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);

app.command('start', ({ from, reply }) => {
    console.log('start', from);
    return reply('I am working! Probably..');
});
app.command('whoami', (ctx) => {                                    //debugging
    // Using shortcut
    ctx.reply(ctx.message.from.username)
});
app.command('ver', (ctx) => {                                       //get the version of the bot
    // Using shortcut
    ctx.reply(VER);
});

app.startPolling();
app.catch((err) => {
    console.log(err);
    // maybe DON'T send the error to the bot, just to admins
    ctx.reply(err);
})
