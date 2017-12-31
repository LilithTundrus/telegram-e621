'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const config = require('../../config/config');
const popularState = require('../../lib/popularStateClass');
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
let popularInstances = [];


popularScene.enter((ctx) => {
    popularEnter(ctx);
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

            return teleCtx.reply(`Top 25 most popular posts ${typeArg}: ${response.slice(0, 24).join('\n')}`);
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

function popularEnter(teleCtx) {
    logger.debug(`Popular query started from ${teleCtx.message.from.username}`);
    let state = new popularState({
        lastSentMessageID: 0,
        searchSceneArray: [],
        currentIndex: 0,
    })
    popularInstances.push({
        id: teleCtx.message.from.id,
        state: state
    })
    if (teleCtx.chat.type !== 'private') {
        teleCtx.scene.leave();
        return teleCtx.reply(`Please only PM this bot for now! Sorry`);
    }
    return teleCtx.reply(`Available options: /daily, /weekly /monthly /alltime`, popularKeyboard)
}

function popularLeave(teleCtx) {

}

function getState(teleID) {
    // handle the state of a user's interaction with the search scene
    let entryToReturn;
    searchInstances.forEach((entry, index) => {
        if (entry.id == teleID) {
            return entryToReturn = entry;
        }
    });
    // if an object matching the ID exists, return the object, if not return a new one for the ID!
    return entryToReturn;
}

function removeStateForUser(teleID) {
    for (var i = popularInstances.length - 1; i >= 0; --i) {
        if (popularInstances[i].id == teleID) {
            popularInstances.splice(i, 1);
        }
    }
    logger.debug(`Removing user with ID: ${teleID} from popularInstances`);
    logger.debug(popularInstances.length);
}

module.exports = popularScene;