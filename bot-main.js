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
Be able to do basically anything you can on the e621 site
Be able to submit issues
Be able to have a custom profile for the bot
Have really good logging and user-based request monitoring
Be able to make announcements to all users
GET a 'popular by day/week/month' thing working

Notes:
- Telegraf sometimes doesn't like it when you try to return functions for replies
- ctx == context of the message from telegraf
- e621 popular endpoints DO NOT support any url options (limit, tags, etc.)

//TODO: catch errors better! and email admins on fatal crash
//TODO: init help guide
//TODO: get the bot to 'type' while loading requests
//TODO: add more info to each post entry
//TODO: improve user activity logging
//TODO: improve limit settings/db calls
//TODO: allow for page limit AND an items per page limit
//TODO: allow a user to set a blacklist
//TODO: set up a better keyboard thing (scenes)
//TODO: allow user logins
//TODO: setup a state machine for each user
//TODO: fix the scenes not working when @ is used in groups 
//TODO: with the search scene, create another keyboard to allow for
scrolling through the results of a search!!
//TODO: figure out how to make scenes a function to share data??
//TODO: allow a remote restart
*/
logger.info(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);
db.connect();


const searchScene = new Scene('search');
// Search scene
var searchFromID;
var lastSentMessageID;
searchScene.enter((ctx) => {
    // record the caller's ID
    searchFromID = ctx.from.id;
    logger.debug(searchFromID);
    ctx.reply(`Give me some tags to search by. use /back when you're done.`);
});
searchScene.leave((ctx) => ctx.reply('exiting search scene'));
searchScene.command('back', leave());
searchScene.command('onetime', (ctx) => {
    getE621PageContents().then((response) => {
        return ctx.reply(`${response[0].file_url}`, Extra.HTML().markup((m) =>
            m.inlineKeyboard([
                m.callbackButton('Next', 'Next'),
                m.callbackButton('Previous', 'Previous')
            ]))).then((test) => {
                lastSentMessageID = test.message_id;
                logger.debug(JSON.stringify(test.message_id));
            })
    })
});
searchScene.on('text', (ctx) => {
    if (ctx.from.id == searchFromID) {
        // clear the var
        searchFromID == '';
        ctx.scene.leave()
        return searchHandler(ctx, ctx.message.text.trim());
    }
});
searchScene.action(/.+/, (ctx) => {
    if (ctx.match[0] == 'Next') {
        logger.debug(JSON.stringify(ctx.chat, null, 2))
        logger.debug(lastSentMessageID)
        ctx.telegram.editMessageText(ctx.chat.id, lastSentMessageID, null,  'AAAAA')
        return ctx.reply(`AAAAAAA, ${ctx.match[0]}! AAA`);
    }
    //return ctx.reply(`AAAAAAA, ${ctx.match[0]}! AAA`)
    return ctx.reply(`AAAAAAA, ${ctx.match[0]}! AAA`)
})
/*
searchScene.enter((ctx) => {
    // record the caller's ID
    searchFromID = ctx.from.id;
    logger.debug(searchFromID);
    ctx.reply(`Give me some tags to search by. use /back when you're done.`);
});
searchScene.leave((ctx) => ctx.reply('exiting search scene'));
searchScene.command('back', leave());
searchScene.command('onetime', (ctx) => {
    getE621PageContents().then((response) => {
        logger.debug(response.length)
        return ctx.reply(`${response[0].file_url}`, Extra.HTML().markup((m) =>
            m.inlineKeyboard([
                m.callbackButton('Next', 'Next'),
                m.callbackButton('Previous', 'Previous')
            ])))
    })
});
searchScene.on('text', (ctx) => {
    if (ctx.from.id == searchFromID) {
        // clear the var
        searchFromID == '';
        ctx.scene.leave()
        return searchHandler(ctx, ctx.message.text.trim());
    }
});
*/

// Search scene TODO: ADD an ALLTIME listener/handler
const popularScene = new Scene('popular');
var popFromID;
popularScene.enter((ctx) => {
    // record the caller's ID
    popFromID = ctx.from.id;
    logger.debug(popFromID);
    return ctx.reply(`Available options: /daily, /weekly /monthly /alltime`), Markup
        .keyboard([
            ['Daily', 'Weekly'],
            ['Monthly', 'All Time'],
        ])
        .oneTime()
        .resize()
});
popularScene.leave((ctx) => ctx.reply('exiting popular scene'));
popularScene.command('back', leave());
popularScene.command('daily', (ctx) => {
    popularSearchHandler(ctx, 'daily').then(() => {
        ctx.scene.leave();
    })
});
popularScene.command('weekly', (ctx) => popularSearchHandler(ctx, 'weekly'));
popularScene.command('monthly', (ctx) => popularSearchHandler(ctx, 'monthly'));

const stage = new Stage([searchScene, popularScene], { ttl: 30 });
app.startPolling();                                                 // start the bot and keep listening for events
app.use(session());
app.use(stage.middleware());
app.use((ctx, next) => {
    const reply = ctx.reply;
    ctx.reply = (...args) => {
        ctx.session.lastMessage = args;
        reply(...args);
    };
    return next();
});

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

// Note: this should eventually be removed
app.command('search', (ctx) => {                                    // debugging
    if (ctx.message.text.length <= 7) {
        ctx.reply('No tags given, searching most recent...');
        return searchHandler(ctx);
    }
    return searchHandler(ctx, ctx.message.text.trim().substring(7));
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
//TODO: validate those who call this are admins
app.command('ver', (ctx) => {                                       // get the version of the bot
    ctx.reply(VER);
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

/**
 * Send the results of an image search through the E621 API
 * @param {JSON} teleCtx 
 * @param {String | String[]} tagsArg 
 * @returns {<telegraf.reply>}
 */
function searchHandler(teleCtx, tagsArg) {
    let limitSetting = CONFIG.e621DefualtLinkLimit;
    return db.getTelegramUserLimit(teleCtx.message.from.id)
        .then((userData) => {
            return limitSetting = userData[0].setlimit;
        })
        .catch((err) => {
            // there is no user with this ID, use defaults
            return logger.debug(err);
        })
        .then(() => {
            return wrapper.getE621PostIndexPaginate(tagsArg, 1, limitSetting, CONFIG.e621DefaultPageLimit)
                .then((response) => {
                    if (!response) {
                        return teleCtx.reply(`I couldn't find anything, make sure your tags are correct!`);
                    }
                    if (response.length > 0) {
                        var resultCount = 0;
                        var pageContents = [];
                        response.forEach((page, index) => {
                            resultCount = resultCount + page.length;
                            page.forEach((post, postIndex) => {
                                pageContents.push(post.file_url);
                            });
                        });
                        if (pageContents.length < limitSetting) {
                            teleCtx.reply(`Here are your links: ${pageContents.join('\n')}`);
                        }
                        teleCtx.reply(`Here are the first ${limitSetting} results: ${pageContents.slice(0, limitSetting).join('\n')}`);
                        if (limitSetting == CONFIG.e621DefualtLinkLimit) {
                            return teleCtx.reply(`Looks like I got more than ${limitSetting} results! (${pageContents.length}) use the /limit command to change this number to be higher or lower. Pages are currently only allowed up to 3`);
                        }
                        return;
                    }
                    return teleCtx.reply(`I couldn't find anything, make sure your tags are correct!`);
                })
                .catch((err) => {
                    teleCtx.reply(`Looks like I ran into a problem. Make sure your tags don't have a typo!\n\nIf the issue persists contact ${CONFIG.devContactName}`);
                    return errHandler(err);
                })
        })
}

async function getE621PageContents(tagsArg) {
    let pageContents = [];
    let limitSetting = CONFIG.e621DefualtLinkLimit;
    let response = await wrapper.getE621PostIndexPaginate(tagsArg, 1, limitSetting, CONFIG.e621DefaultPageLimit)
    response.forEach((page, index) => {
        page.forEach((post, postIndex) => {
            pageContents.push(post);
        });
    });
    return pageContents;
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
