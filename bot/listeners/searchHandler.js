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

const { enter, leave } = Stage;
const searchScene = new Scene('search');

let searchInstances = [];


searchScene.enter((ctx) => {
    // return a new searchHandler?!
    searchEnter(ctx);
});
searchScene.leave((ctx) => {
    // reset all the vars used here
    // debugging
    ctx.reply('exiting search scene');
});
searchScene.command('back', leave());
searchScene.hears('🔍 Search', (ctx) => {
    ctx.scene.leave().then(() => {
        return ctx.scene.enter('search');
    });
});
searchScene.hears('😎 Popular', (ctx) => {
    ctx.scene.leave().then(() => {
        return ctx.scene.enter('popular');
    });
});
searchScene.on('text', (ctx) => {
    let limitSetting = config.e621DefaultPageSize;
    let userState = getState(ctx.message.from.id)
    return ctx.db.getTelegramUserLimit(ctx.message.from.id)
        .then((userData) => {
            return limitSetting = userData[0].setlimit;
        })
        .catch((err) => {
            // there is no user with this ID, use defaults
            return logger.debug(err);
        })
        .then(() => {
            return getE621PageContents(ctx.message.text, limitSetting)
                .then((response) => {
                    userState.state.searchSceneArray = response;
                    return ctx.reply(`${response[0].file_url}`, pagingKeyboard)
                        .then((messageResult) => {
                            userState.state.lastSentMessageID = messageResult.message_id;
                        })
                })
                .catch((err) => {
                    logger.error(err)
                    return ctx.reply(`Looks like I ran into a problem. If the issue persists contact ${config.devContactName}`);
                })
        })
});
searchScene.action(/.+/, (ctx) => {
    let userState = getState(ctx.chat.id)
    logger.debug(JSON.stringify(ctx.chat))
    if (ctx.match[0] == 'Next') {
        userState.state.currentIndex++;
        ctx.telegram.editMessageText(ctx.chat.id, userState.state.lastSentMessageID, null, userState.state.searchSceneArray[userState.state.currentIndex].file_url, pagingKeyboard)
    } else if (ctx.match[0] == 'Previous') {
        if (userState.state.currentIndex !== 0) {
            userState.state.currentIndex--;
            ctx.telegram.editMessageText(ctx.chat.id, userState.state.lastSentMessageID, null, userState.state.searchSceneArray[userState.state.currentIndex].file_url, pagingKeyboard);
        }
    }
})

async function getE621PageContents(tagsArg, limit) {
    let pageContents = [];
    let response = await wrapper.getE621PostIndexPaginate(tagsArg, 1, limit, config.e621DefaultPageLimit);
    response.forEach((page, index) => {
        page.forEach((post, postIndex) => {
            pageContents.push(post);
        });
    });
    return pageContents;
}

function searchEnter(teleCtx) {
    logger.debug(`Search started from ${teleCtx.message.from.username}`);
    let state = new searchState({
        lastSentMessageID: 0,
        searchSceneArray: [],
        currentIndex: 0,
        teleID: teleCtx.message.from.id
    })
    searchInstances.push({
        id: teleCtx.message.from.id,
        state: state
    })
    if (teleCtx.chat.type !== 'private') {
        teleCtx.scene.leave();
        return teleCtx.reply(`Please only PM this bot`);
    }
    return teleCtx.reply(`Give me some tags to search by. Use /back when you're done.`);
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

module.exports = searchScene;