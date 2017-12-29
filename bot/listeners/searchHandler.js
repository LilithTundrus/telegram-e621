'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');


const { enter, leave } = Stage;
const searchScene = new Scene('search');

searchScene.enter((ctx) => {
    logger.debug(`Search started from ${ctx.message.from.username}`);
    ctx.reply(`Give me some tags to search by. Use /back when you're done.`);
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
    if (ctx.from.id == searchFromID) {
        let limitSetting = CONFIG.e621DefaultPageSize;
        return getTelegramUserLimit(ctx.message.from.id)
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
                        searchSceneArray = response;
                        return ctx.reply(`${response[0].file_url}`, pagingKeyboard)
                            .then((messageResult) => {
                                lastSentMessageID = messageResult.message_id;
                            })
                    })
                    .catch((err) => {
                        return ctx.reply(`Looks like I ran into a problem. If the issue persists contact ${CONFIG.devContactName}`);
                    })
            })

    }
});
searchScene.action(/.+/, (ctx) => {
    if (ctx.match[0] == 'Next') {
        currentIndex++;
        ctx.telegram.editMessageText(ctx.chat.id, lastSentMessageID, null, searchSceneArray[currentIndex].file_url, pagingKeyboard)
    } else if (ctx.match[0] == 'Previous') {
        if (currentIndex !== 0) {
            currentIndex--;
            ctx.telegram.editMessageText(ctx.chat.id, lastSentMessageID, null, searchSceneArray[currentIndex].file_url, pagingKeyboard);
        }
    }
})


async function getE621PageContents(tagsArg, limit) {
    let pageContents = [];
    let response = await wrapper.getE621PostIndexPaginate(tagsArg, 1, limit, CONFIG.e621DefaultPageLimit);
    response.forEach((page, index) => {
        page.forEach((post, postIndex) => {
            pageContents.push(post);
        });
    });
    return pageContents;
}

async function getTelegramUserLimit(teleID) {
    let dbResponse = await db.getTelegramUserLimit(teleID);
    return dbResponse;
}

module.exports = searchScene;