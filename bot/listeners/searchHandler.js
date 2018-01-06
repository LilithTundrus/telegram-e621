'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const config = require('../../config/config');
const searchStatePM = require('../../lib/searchStateClassPM');
const searchStateGroup = require('../../lib/searchStateClassGroup');
const e621Helper = require('../../lib/e621HelperClass.js');         // E621 API helper class
const wrapper = new e621Helper();                                   // Create an instance of the API wrapper to use
const telegramKeyboards = require('../../lib/keyboardConsts');
const pagingKeyboard = telegramKeyboards.pagingKeyboard;
const { enter, leave } = Stage;
const searchScene = new Scene('search');

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
    let userState = getSearchStateForUser(ctx.chat.id, ctx.message.from.id);
    logger.debug(JSON.stringify(userState, null, 2));
    // only allow for ONE set of tags to be used per search command activation
    if (userState.rateLimit < 1) {
        userState.rateLimit++;
        ctx.telegram.editMessageText(ctx.chat.id, userState.initialMessageID, null, 'Searching...');
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
                            ctx.telegram.editMessageText(ctx.chat.id, userState.initialMessageID, null, 'Done!');
                            userState.searchSceneArray = response;
                            let message = `Result 1 of ${response.length}\n<a href="${response[0].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(response[0].id)}">E621 Post</a>\n❤️: ${response[0].fav_count}\nType: ${response[0].file_ext}`;
                            return ctx.replyWithHTML(message, pagingKeyboard)
                                .then((messageResult) => {
                                    userState.lastSentMessageID = messageResult.message_id;
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
    let userState = getSearchStateForUser(ctx.chat.id, ctx.callbackQuery.from.id)
    if (ctx.match[0] == 'Next') {
        if (userState.currentIndex !== userState.searchSceneArray.length - 1) {
            userState.currentIndex++;
            let currentUserStateIndex = userState.currentIndex;
            let currentUserStateArray = userState.searchSceneArray;
            let message = `Post ${userState.currentIndex + 1} of ${currentUserStateArray.length}: \n<a href="${currentUserStateArray[currentUserStateIndex].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(currentUserStateArray[currentUserStateIndex].id)}">E621 Post</a>\n❤️: ${currentUserStateArray[currentUserStateIndex].fav_count}\nType: ${currentUserStateArray[currentUserStateIndex].file_ext}`;
            return ctx.telegram.editMessageText(ctx.chat.id, userState.lastSentMessageID, null, message, pagingKeyboard)
        }
        return ctx.reply(`That's the last image. if you want to adjust your limit use the /limit command or the settings keyboard command`);
    } else if (ctx.match[0] == 'Previous') {
        if (userState.currentIndex !== 0) {
            userState.currentIndex--;
            let currentUserStateIndex = userState.currentIndex;
            let currentUserStateArray = userState.searchSceneArray;
            let message = `Post ${userState.currentIndex + 1} of ${currentUserStateArray.length}: \n<a href="${currentUserStateArray[currentUserStateIndex].file_url}">Direct Link</a>/<a href="${wrapper.generateE621PostUrl(currentUserStateArray[currentUserStateIndex].id)}">E621 Post</a>\n❤️: ${currentUserStateArray[currentUserStateIndex].fav_count}\nType: ${currentUserStateArray[currentUserStateIndex].file_ext}`;
            ctx.telegram.editMessageText(ctx.chat.id, userState.lastSentMessageID, null, message, pagingKeyboard);
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
    let options = {};
    // load in a few defaults that aren't group or PM unique
    options.lastSentMessageID = 0;
    options.searchSceneArray = [];
    options.currentIndex = 0;
    options.rateLimit = 0;
    options.originalSender = teleCtx.message.from.id
    teleCtx.reply(`Give me some tags to search by and press enter. Use /back when you're done.`)
        .then((messageResult) => {
            options.initialMessageID = messageResult.message_id;
            logger.debug(options.initialMessageID)
        })
        .then(() => {
            // Create separate classes for both types and handle any uknowns
            if (teleCtx.chat.type == 'private') {
                logger.debug('Chat is private!');
                // set options for Obj
                options.chatID = teleCtx.chat.id;
                // create new private Obj
                let searchState = new searchStatePM(options);
                searchInstancesPM.push(searchState);
            } else if (teleCtx.chat.type == 'group') {
                logger.debug('Chat is a group!');
                // set options for Obj
                options.groupID = teleCtx.chat.id;
                // create new group Obj
                let searchState = new searchStateGroup(options);
                searchInstancesGroup.push(searchState);
            } else {
                logger.warn(`Unsupported chat type: ${teleCtx.chat.type}`);
                return teleCtx.reply(`Please only PM this bot or add it to a group. Chat type '${teleCtx.chat.type}' is not supported.`);
            }
        })


}

function searchLeave(teleCtx) {
    //make sure all of these are defined first!!
    if (!teleCtx.message) {
        removeStateForUser(teleCtx.chat.id, teleCtx.callbackQuery.from.id, teleCtx.chat.type);
    } else {
        removeStateForUser(teleCtx.chat.id, teleCtx.message.from.id, teleCtx.chat.type);
    }
    return teleCtx.reply('Exiting search scene');
}

function getSearchStateForUser(groupID, userID) {
    // return the current state of the search command for a specific user by the chat ID and the user name
    let entryToReturn;
    searchInstancesPM.forEach((entry, index) => {
        if (entry.originalSender == userID && entry.chatID == groupID) {
            logger.debug('Match!!');
            return entryToReturn = entry;
        }
    });
    searchInstancesGroup.forEach((entry, index) => {
        if (entry.originalSender == userID && entry.groupID == groupID) {
            logger.debug('Match!!');
            return entryToReturn = entry;
        }
    });
    // if an object matching the ID exists, return the object
    return entryToReturn;
}

function removeStateForUser(groupID, userID, type) {
    if (type == 'private') {
        for (var i = searchInstancesPM.length - 1; i >= 0; --i) {
            if (searchInstancesPM[i].originalSender == userID && searchInstancesPM[i].chatID == groupID) {
                searchInstancesPM.splice(i, 1);
                logger.debug(`Removing user with ID: ${userID} from searchInstancesPM`);
                logger.debug(searchInstancesPM.length);
            }
        }
    } else if (type == 'group') {
        for (var i = searchInstancesGroup.length - 1; i >= 0; --i) {
            if (searchInstancesGroup[i].originalSender == userID && searchInstancesGroup[i].groupID == groupID) {
                searchInstancesGroup.splice(i, 1);
                logger.debug(`Removing user with ID: ${userID} from searchInstancesGroup`);
                logger.debug(searchInstancesGroup.length);
            }
        }
    }

}

// Export the scene as the user-facing code. All internal functions cannot be used directly
module.exports = searchScene;