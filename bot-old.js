'use strict';
// Require all of our packages
const Telegraf = require('telegraf');
const Composer = require('telegraf/composer');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const Scene = require('telegraf/scenes/base');
const Extra = require('telegraf/extra');
// Declare our config-based opts and other globals
const CONFIG = require('./config/config.js');                       // Config file for the bot
const Logger = require('./lib/loggerClass.js');                     // Our custom logging class
const e621Helper = require('./lib/e621HelperClass.js');             // E621 API helper class
const db = require('./db/database.js');                             // Custom DB abstractor
const VER = CONFIG.VER;
const app = new Telegraf(CONFIG.BOT_TOKEN);
const logger = new Logger();                                        // Create an instance of our custom logger
const wrapper = new e621Helper();                                   // Create an instance of the API wrapper to use
const { enter, leave } = Stage;
/* Main entry point for the bot

Feature intent:
Start/stop the bot remotely
Push updates to code seamlessly
Be able to do basically anything you can on the e621 site
Be able to submit issues
Be able to have a custom profile for the bot
Have really good logging and user-based request monitoring
Be able to make announcements to all users

Notes:
- Telegraf sometimes doesn't like it when you try to return functions for replies
- ctx == context of the message from telegraf
- e621 popular endpoints DO NOT support any url options (limit, tags, etc.)

*/
logger.info(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);
db.connect();

const searchScene = new Scene('search');
const popularScene = new Scene('popular');
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

// TODO: reset all of the vars after an exit scene...this might get really messy
// TODO: on ENTER return a new searcHandler class...this is becoming a mess
function searchConstructor() {
    // Search scene
    var searchFromID;
    var lastSentMessageID;
    let searchSceneArray = [];
    let currentIndex = 0;
    searchScene.enter((ctx) => {
        // record the caller's ID
        searchFromID = ctx.from.id;
        logger.debug(searchFromID);
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
            // clear the var
            searchFromID == '';
            // get the user in the DB
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
}

function popularConstructor() {
    // Popular scene
    // On ENTER, return the class!
    var popFromID;
    popularScene.enter((ctx) => {
        // record the caller's ID
        popFromID = ctx.from.id;
        logger.debug(popFromID);
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
}

//const stage = new Stage([searchScene, popularScene], { ttl: 30 });
const stage = new Stage([searchScene, popularScene]);
searchConstructor();
popularConstructor();
app.use(
    session(),
    stage.middleware(),
    // Allows for a .then() to be attached after sending a message
    (ctx, next) => {
        const reply = ctx.reply;
        ctx.reply = (...args) => {
            ctx.session.lastMessage = args;
            reply(...args);
        };
        return next();
    }
);
app.startPolling();                                                 // Start the bot and keep listening for events


// #region appCommands
app.command('start', ({ from, reply }) => {
    logger.info(`Start from ${JSON.stringify(from)}`);              // log when a new user starts the bot
    return reply('Henlo! ${WELCOME_MESSAGE_HERE}');
});
app.command('help', (ctx) => {                                      // send the help command info
    ctx.reply('PlaceHolder');
});
app.command('register', (ctx) => {
    ctx.reply('PlaceHolder');
});
app.command('profile', (ctx) => {                                   // get a user profile
    ctx.reply('PlaceHolder');
});
app.command('limit', (ctx) => {                                     // set a user's custom limit
    if (ctx.message.text.trim().length <= 6) {
        return ctx.reply('Please give a number between 1 and 50 as a limit');
    }
    return limitSetHandler(ctx);
});
app.command('menu', ({ reply }) => {
    return reply('Select an option', Markup
        .keyboard([
            ['🔍 Search', '😎 Popular'],
            ['☸ Settings', '📞 Feedback'],
        ])
        .oneTime()
        .resize()
        .extra()
    )
});

app.hears('🔍 Search', enter('search'));
app.hears('😎 Popular', enter('popular'));
// #endregion

// #region adminCommands
app.command('ver', (ctx) => {                                       // get the version of the bot
    if (ctx.message.from.id.toString() !== CONFIG.TELEGRAM_ADMIN_ID) {
        return ctx.reply(`Insufficient privilages`);
    }
    return ctx.reply(VER);
});
// #endregion

function popularSearchHandler(teleCtx, typeArg) {
    return wrapper.popularURLHanlder(typeArg)
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

function limitSetHandler(teleCtx) {
    let limitVal = teleCtx.message.text.substring(6).trim();
    // validate number is correct
    if (isNaN(parseInt(limitVal)) == true || limitVal.length > 2) {
        return teleCtx.reply(`Sorry, ${limitVal} is not valid (Max allowed: 50)`);
    }
    if (parseInt(limitVal) > 50 || parseInt(limitVal) < 1) {
        return teleCtx.reply(`Sorry, ${limitVal} is not valid (Max allowed: 50)`);
    }
    // call the DB, make sure the user exists, if not add them by Telegram ID
    return db.getTelegramUserLimit(teleCtx.message.from.id)
        .then((userData) => {
            teleCtx.reply(`Your old limit: ${userData[0].setlimit}`);
            db.updateTelegramUserLimit(teleCtx.message.from.id, limitVal);
            return teleCtx.reply(`Your new limit: ${limitVal}`);
        })
        .catch((err) => {
            // user does not exist (that's the error)
            logger.debug(err);
            db.addTelegramUserLimit(teleCtx.message.from.id, limitVal);
            return teleCtx.reply(`You've been added to the databse, your custom limit is now set to ${limitVal}`);
        })
}

/**
 * Main error handler for the bot for debugging
 * @param {Error} err
 */
function errHandler(err) {
    logger.error(err);
    return app.telegram.sendMessage(CONFIG.TELEGRAM_ADMIN_ID, err.toString());
}
