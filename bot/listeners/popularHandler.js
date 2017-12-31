'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const config = require('../../config/config');
const searchState = require('../../lib/searchStateClass');
const e621Helper = require('../../lib/e621HelperClass.js');         // E621 API helper class
const wrapper = new e621Helper();                                   // Create an instance of the API wrapper to use
const Extra = require('telegraf/extra');
const pagingKeyboard = Extra.HTML().markup((m) =>
    m.inlineKeyboard([
        m.callbackButton('Next', 'Next'),
        m.callbackButton('Previous', 'Previous')]
    ));

const popularKeyboard = Extra.HTML().markup((m) =>
    m.inlineKeyboard([
        m.callbackButton('Daily', 'daily'),
        m.callbackButton('Weekly', 'weekly'),
        m.callbackButton('Monthly', 'monthly'),
        m.callbackButton('All time', 'alltime')]
    ));
const { enter, leave } = Stage;
const popularScene = new Scene('popular');

// Popular scene
// On ENTER, return the class!
popularScene.enter((ctx) => {
    return ctx.reply(`Available options: /daily, /weekly /monthly /alltime`, popularKeyboard)
});
popularScene.leave((ctx) => ctx.reply('exiting popular scene'));
popularScene.command('back', leave());
popularScene.command('daily', (ctx) => {
    popularSearchHandler(ctx, 'daily').then(() => {
        //testing scene leaving on command
        ctx.scene.leave();
    })
});
popularScene.command('weekly', (ctx) => popularSearchHandler(ctx, 'weekly'));
popularScene.command('monthly', (ctx) => popularSearchHandler(ctx, 'monthly'));
popularScene.command('alltime', (ctx) => popularSearchHandler(ctx, 'alltime'));


function popularSearchHandler(teleCtx, typeArg) {
    return getE621PopularContents(typeArg)
        .then((response) => {                                   // returns a single page
            return wrapper.pushFileUrlToArray(response)
                .then((pageContents) => {
                    return teleCtx.reply(`Top 25 most popular posts ${typeArg}: ${pageContents.slice(0, 24).join('\n')}`);
                })
        })
        .catch((err) => {
            teleCtx.reply(`Looks like I ran into a problem.\n\nIf the issue persists contact ${CONFIG.devContactName}`);
            return errHandler(err);
        })
}

async function getE621PopularContents(typeArg) {
    let pageContents = [];
    let response = await wrapper.popularURLHanlder(typeArg);
    response.forEach((post, index) => {
        pageContents.push(post);
    });
    return pageContents;
}

module.exports = popularScene;