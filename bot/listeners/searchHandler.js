'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const config = require('../../config/config');
const searchState = require('../../lib/searchStateClass');
const e621Helper = require('../../lib/e621HelperClass.js');         // E621 API helper class
const wrapper = new e621Helper();                                   // Create an instance of the API wrapper to use
const telegramKeyboards = require('../../lib/keyboardConsts');
const pagingKeyboard = telegramKeyboards.pagingKeyboard;
const { enter, leave } = Stage;
const searchScene = new Scene('search');
/*
TODO: on text, ensure all tags are valid
TODO: better error handle issues
TODO: better support group chats
*/

// A really hacky way to store the state of this function per user
let searchInstances = [];

searchScene.enter((ctx) => {
    searchEnter(ctx);
});
searchScene.leave((ctx) => {
    searchLeave(ctx);
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
    let userState = getState(ctx.chat.id);
    userState.state.rateLimit++;
    logger.debug(`Current rate limit for ${ctx.chat.id}`)
    // only allow for ONE set of tags to be used per search command activation
    if (userState.state.rateLimit <= 1) {
        ctx.telegram.editMessageText(ctx.chat.id, userState.state.initialMessageID, null, 'Searching...');
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
                        ctx.telegram.editMessageText(ctx.chat.id, userState.state.initialMessageID, null, 'Done!');
                        userState.state.searchSceneArray = response;
                        let message = `Result 1 of ${response.length}\n<a href="${response[0].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(response[0].id)}">E621 Post</a>\n❤️: ${response[0].fav_count}\nType: ${response[0].file_ext}`;
                        return ctx.replyWithHTML(message, pagingKeyboard)
                            .then((messageResult) => {
                                userState.state.lastSentMessageID = messageResult.message_id;
                            })
                    })
                    .catch((err) => {
                        logger.error(err)
                        return ctx.reply(`Looks like I ran into a problem. If the issue persists contact ${config.devContactName}`);
                    })
            })
    }
});
// This is listening for the callback buttons
searchScene.action(/.+/, (ctx) => {
    let userState = getState(ctx.chat.id)
    if (ctx.match[0] == 'Next') {
        if (userState.state.currentIndex !== userState.state.searchSceneArray.length - 1) {
            userState.state.currentIndex++;
            let currentUserStateIndex = userState.state.currentIndex;
            let currentUserStateArray = userState.state.searchSceneArray;
            let message = `Post ${userState.state.currentIndex + 1} of ${currentUserStateArray.length}: \n<a href="${currentUserStateArray[currentUserStateIndex].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(currentUserStateArray[currentUserStateIndex].id)}">E621 Post</a>\n❤️: ${currentUserStateArray[currentUserStateIndex].fav_count}\nType: ${currentUserStateArray[currentUserStateIndex].file_ext}`;
            return ctx.telegram.editMessageText(ctx.chat.id, userState.state.lastSentMessageID, null, message, pagingKeyboard)
        }
        return ctx.reply(`That's the last image. if you want to adjust your limit use the /limit command or the settings keyboard command`);
    } else if (ctx.match[0] == 'Previous') {
        if (userState.state.currentIndex !== 0) {
            userState.state.currentIndex--;
            let currentUserStateIndex = userState.state.currentIndex;
            let currentUserStateArray = userState.state.searchSceneArray;
            let message = `Post ${userState.state.currentIndex + 1} of ${currentUserStateArray.length}: \n<a href="${currentUserStateArray[currentUserStateIndex].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(currentUserStateArray[currentUserStateIndex].id)}">E621 Post</a>\n❤️: ${currentUserStateArray[currentUserStateIndex].fav_count}\nType: ${currentUserStateArray[currentUserStateIndex].file_ext}`;
            ctx.telegram.editMessageText(ctx.chat.id, userState.state.lastSentMessageID, null, message, pagingKeyboard);
        }
    } else if (ctx.match[0] == 'Exit') {
        return ctx.scene.leave();
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
    logger.debug(`Search started from ${teleCtx.message.from.username} with chat ID ${teleCtx.chat.id}`);
    let state = new searchState({
        lastSentMessageID: 0,
        initialMessageID: 0,
        searchSceneArray: [],
        currentIndex: 0,
        rateLimit: 0,
    })
    searchInstances.push({
        id: teleCtx.chat.id,
        state: state
    })
    return teleCtx.reply(`Give me some tags to search by. Use /back when you're done.`)
        .then((messageResult) => {
            state.initialMessageID = messageResult.message_id;
        })
}

function searchLeave(teleCtx) {
    let userState = getState(teleCtx.chat.id);
    let currentUserStateIndex = userState.state.currentIndex;
    let currentUserStateArray = userState.state.searchSceneArray;
    let message = `Post ${userState.state.currentIndex + 1} of ${currentUserStateArray.length}: \n<a href="${currentUserStateArray[currentUserStateIndex].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(currentUserStateArray[currentUserStateIndex].id)}">E621 Post</a>\n❤️: ${currentUserStateArray[currentUserStateIndex].fav_count}\nType: ${currentUserStateArray[currentUserStateIndex].file_ext}`;

    // remove the user from the state array
    teleCtx.telegram.editMessageText(teleCtx.chat.id, userState.state.lastSentMessageID, null, message);

    removeStateForUser(teleCtx.chat.id);
    // debugging
    return teleCtx.reply('Exiting search scene');
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
    for (var i = searchInstances.length - 1; i >= 0; --i) {
        if (searchInstances[i].id == teleID) {
            searchInstances.splice(i, 1);
        }
    }
    logger.debug(`Removing user with ID: ${teleID} from searchInstances`);
    logger.debug(searchInstances.length);
}

// Export the scene as the user-facing code. All internal functions cannot be used directly
module.exports = searchScene;