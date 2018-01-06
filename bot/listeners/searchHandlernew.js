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
TODO: The main thing is groups and PMs tend to not mix... it's
likely going to be easiest to add things to the user's state for groups
*/

// A really hacky way to store the state of this function per user
let searchInstancesPM = [];
let searchInstancesGroup = [];

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
    let limitSetting = config.e621DefualtLinkLimit;
    let userState = getState(ctx.message.from.id);
    // only allow for ONE set of tags to be used per search command activation
    if (userState.state.rateLimit < 1) {
        userState.state.rateLimit++;
        ctx.telegram.editMessageText(ctx.chat.id, userState.state.initialMessageID, null, 'Searching...');
        return ctx.db.getTelegramUserLimit(ctx.message.from.id)
            .then((userData) => {
                return limitSetting = userData[0].setlimit;
            })
            .catch((err) => {
                // there is no user with this ID, use defaults
                return logger.db(err);
            })
            .then(() => {
                return getE621PageContents(ctx.message.text, limitSetting)
                    .then((response) => {
                        if (response.length < 1) {
                            return ctx.reply(`I couldn't find anything matching ${ctx.message.text}, make sure your tags are correct!`)
                                .then(() => {
                                    return ctx.scene.leave()
                                })
                        } else {
                            ctx.telegram.editMessageText(ctx.chat.id, userState.state.initialMessageID, null, 'Done!');
                            userState.state.searchSceneArray = response;
                            let message = `Result 1 of ${response.length}\n<a href="${response[0].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(response[0].id)}">E621 Post</a>\n❤️: ${response[0].fav_count}\nType: ${response[0].file_ext}`;
                            return ctx.replyWithHTML(message, pagingKeyboard)
                                .then((messageResult) => {
                                    userState.state.lastSentMessageID = messageResult.message_id;
                                })
                        }
                    })
                    .catch((err) => {
                        logger.error(err)
                        return ctx.reply(`Looks like I ran into a problem. If the issue persists please contact ${config.devContactName}`);
                    })
            })
    }
});
// This is listening for the callback buttons
searchScene.action(/.+/, (ctx) => {
    logger.debug(JSON.stringify(ctx.callbackQuery.from.id))
    let userState = getState(ctx.callbackQuery.from.id)
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
    } else if (ctx.match[0] == 'Jump') {
        return ctx.reply(`Not ready yet! Sorry.`);
    } else {
        logger.error(`Unsupported command in the search scene: ${ctx.match[0]}`);
        return ctx.reply(`Looks like I got an unsupported button command. If the issue persists please contact ${config.devContactName}`);
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
    // Determine if chat is private or group here!!
    // Create separate classes for both types and handle any uknowns
    logger.debug(teleCtx.chat.type);
    let options = {};
    if (teleCtx.chat.type == 'private') {
        logger.debug('Chat is private!');
    } else if (teleCtx.chat.type == 'group') {
        logger.debug('Chat is a group!');
    } else {
        logger.warn(`Unsupported chat type: ${teleCtx.chat.type}`);
        return teleCtx.reply(`Please only PM this bot or add it to a group. Chat type '${teleCtx.chat.type}' is not supported.`);
    }
    return teleCtx.reply(`Give me some tags to search by and press enter. Use /back when you're done.`)
        .then((messageResult) => {
            //return state.initialMessageID = messageResult.message_id;
        })
}

function searchLeave(teleCtx) {
    return teleCtx.reply('Exiting search scene');
}

function getSearchStateForUser(groupID, userID) {
    // return the current state of the search command for a specific user by the chat ID and the user name
}

// Export the scene as the user-facing code. All internal functions cannot be used directly
module.exports = searchScene;