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
const telegramKeyboards = require('../../lib/keyboardConsts');
const pagingKeyboard = telegramKeyboards.pagingKeyboard;
const popularKeyboard = telegramKeyboards.popularKeyboard;
const { enter, leave } = Stage;
const popularScene = new Scene('popular');

let popularInstances = [];

popularScene.enter((ctx) => {
    popularEnter(ctx);
});
popularScene.leave((ctx) => {
    popularLeave(ctx);
});
popularScene.command('back', leave());
popularScene.command('daily', (ctx) => popularSearchHandler(ctx, 'daily'));
popularScene.command('weekly', (ctx) => popularSearchHandler(ctx, 'weekly'));
popularScene.command('monthly', (ctx) => popularSearchHandler(ctx, 'monthly'));
popularScene.command('alltime', (ctx) => popularSearchHandler(ctx, 'alltime'));

function popularSearchHandler(teleCtx, typeArg) {
    let userState = getState(teleCtx.chat.id);
    return getE621PopularContents(typeArg)
        .then((response) => {                                   // returns a single page
            userState.state.popularSceneArray = response;
            let message = `Result 1 of ${response.length}\n<a href="${response[0].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(response[0].id)}">E621 Post</a>\n❤️: ${response[0].fav_count}\nType: ${response[0].file_ext}`;
            return teleCtx.replyWithHTML(message, pagingKeyboard)
                .then((messageResult) => {
                    userState.state.lastSentMessageID = messageResult.message_id;
                })
        })
        .catch((err) => {
            logger.error(err)
            return teleCtx.reply(`Looks like I ran into a problem. If the issue persists contact ${config.devContactName}`);
        })
}
// This is listening for the callback buttons
popularScene.action(/.+/, (ctx) => {
    let userState = getState(ctx.chat.id)
    if (ctx.match[0] == 'Next') {
        if (userState.state.currentIndex !== userState.state.popularSceneArray.length - 1) {
            userState.state.currentIndex++;
            let currentUserStateIndex = userState.state.currentIndex;
            let currentUserStateArray = userState.state.popularSceneArray;
            let message = `Post ${userState.state.currentIndex + 1} of ${currentUserStateArray.length}: \n<a href="${currentUserStateArray[currentUserStateIndex].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(currentUserStateArray[currentUserStateIndex].id)}">E621 Post</a>\n❤️: ${currentUserStateArray[currentUserStateIndex].fav_count}\nType: ${currentUserStateArray[currentUserStateIndex].file_ext}`;
            return ctx.telegram.editMessageText(ctx.chat.id, userState.state.lastSentMessageID, null, message, pagingKeyboard);
        }
        return ctx.reply(`That's the last image. Popular posts are limited to 32 results`);
    } else if (ctx.match[0] == 'Previous') {
        if (userState.state.currentIndex !== 0) {
            userState.state.currentIndex--;
            let currentUserStateIndex = userState.state.currentIndex;
            let currentUserStateArray = userState.state.popularSceneArray;
            let message = `Post ${userState.state.currentIndex + 1} of ${currentUserStateArray.length}: \n<a href="${currentUserStateArray[currentUserStateIndex].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(currentUserStateArray[currentUserStateIndex].id)}">E621 Post</a>\n❤️: ${currentUserStateArray[currentUserStateIndex].fav_count}\nType: ${currentUserStateArray[currentUserStateIndex].file_ext}`;
            ctx.telegram.editMessageText(ctx.chat.id, userState.state.lastSentMessageID, null, message, pagingKeyboard);
        }
    }
})

async function getE621PopularContents(typeArg) {
    let pageContents = [];
    let response = await wrapper.popularURLHanlder(typeArg);
    response.forEach((post, index) => {
        pageContents.push(post);
    });
    return pageContents;
}

function popularEnter(teleCtx) {
    logger.debug(`Popular query started from ${teleCtx.message.from.username}  with chat ID ${ctx.chat.id}`);
    let state = new popularState({
        lastSentMessageID: 0,
        popularSceneArray: [],
        currentIndex: 0,
    })
    popularInstances.push({
        id: teleCtx.chat.id,
        state: state
    })
    return teleCtx.reply(`Available options: /daily, /weekly /monthly /alltime`, popularKeyboard)
}

function popularLeave(teleCtx) {
    // remove the user from the state array
    removeStateForUser(teleCtx.chat.id);
    // debugging
    return teleCtx.reply('Exiting popular scene');
}

function getState(teleID) {
    // handle the state of a user's interaction with the search scene
    let entryToReturn;
    popularInstances.forEach((entry, index) => {
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