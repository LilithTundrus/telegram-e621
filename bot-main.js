'use strict';
// Require all of our packages
const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
// Declare our config-based opts and other globals
const CONFIG = require('./config/config.js');                       // Config file for the bot
const Logger = require('./lib/loggerClass.js');                     // Our custom logging class
const e621Helper = require('./lib/e621HelperClass.js');             // E621 API helper class
const db = require('./db/database.js');
const VER = CONFIG.VER;
const USER_AGENT = CONFIG.USER_AGENT;
const app = new Telegraf(CONFIG.BOT_TOKEN);
const logger = new Logger();                                        // Create an instance of our custo m logger
const wrapper = new e621Helper();                                   // Create an instance of the API wrapper to use
/*
Main entry point for the bot
Steps:
Get config opts
Set up logging
Init the bot
Connect to DB
...more when I can think of it

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

//TODO: catch errors and email admins on fatal crash
//TODO: init help guide
//TODO: get the bot to 'type' while loading requests
//TODO: set up an popular by x thing
//TODO: add more info to each post entry
//TODO: improve user activity logging
//TODO: improve limit settings/db calls
//TODO: allow for page limit AND an items per page limit
//TODO allow a user to set a blacklist
//TODO set up a better keyboard thing
*/
logger.info(`e621client_bot ${VER} started at: ${new Date().toISOString()}`);
db.connect();




const stepHandler = new Composer()
stepHandler.action('next', (ctx) => {
    ctx.reply('Step 2. Via inline button')
    return ctx.wizard.next()
})
stepHandler.command('next', (ctx) => {
    ctx.reply('Step 2. Via command')
    return ctx.wizard.next()
})
stepHandler.use((ctx) => ctx.replyWithMarkdown('Press `Next` button or type /next'))

const superWizard = new WizardScene('super-wizard',
    (ctx) => {
        ctx.reply('Step 1', Markup.inlineKeyboard([
            Markup.urlButton('❤️', 'http://telegraf.js.org'),
            Markup.callbackButton('➡️ Next', 'next')
        ]).extra())
        return ctx.wizard.next()
    },
    stepHandler,
    (ctx) => {
        ctx.reply('Step 3')
        return ctx.wizard.next()
    },
    (ctx) => {
        ctx.reply('Step 4')
        return ctx.wizard.next()
    },
    (ctx) => {
        ctx.reply('Done')
        return ctx.scene.leave()
    }
)

const stage = new Stage([superWizard], { default: 'super-wizard' });
app.startPolling();                                                 // start the bot and keep listening for events
app.use(session());
app.use(stage.middleware());
// #region appCommands
app.command('start', ({ from, reply }) => {
    logger.info(`Start from ${JSON.stringify(from)}`);              // log when a new user starts the bot
    return reply('Henlo! ${WELCOME_MESSAGE_HERE}');
});

app.command('whoami', (ctx) => {                                    // debugging
    ctx.reply(ctx.message.from.username);
});

app.command('ver', (ctx) => {                                       // get the version of the bot
    ctx.reply(VER);
});

app.command('help', (ctx) => {                                      // get the version of the bot
    ctx.reply('PlaceHolder');
});

app.command('register', (ctx) => {
    ctx.reply('PlaceHolder');
});

app.command('profile', (ctx) => {                                   // get the version of the bot
    ctx.reply('PlaceHolder');
});

app.command('limit', (ctx) => {                                   // get the version of the bot
    if (ctx.message.text.trim().length <= 6) {
        return ctx.reply('Please give a number between 1 and 50 as a limit');
    }
    return limitSetHandler(ctx);
});

app.command('search', (ctx) => {                                    // debugging
    if (ctx.message.text.length <= 7) {
        ctx.reply('No tags given, searching most recent...');
        return searchHandler(ctx);
    }
    return searchHandler(ctx, ctx.message.text.trim().substring(7));
});

app.command('populartoday', (ctx) => {                             // get the version of the bot
    return popularSearchHandler(ctx, 'daily');
});

app.command('custom', ({ reply }) => {
    return reply('Select an option', Markup
        .keyboard([
            ['🔍 Search', '😎 Popular'],
            ['☸ Setting', '📞 Feedback'],
        ])
        .oneTime()
        .resize()
        .extra()
    )
});
// #endregion








//TODO: allow this to show all results through pagination
function popularSearchHandler(teleCtx, typeArg) {
    if (typeArg == 'daily') {
        return wrapper.getE621PopularByDayIndex()
            // returns a single page
            .then((response) => {
                return pushFileUrlToArray(response)
                    .then((pageContents) => {
                        return teleCtx.reply(`Here the first 25 results: ${pageContents.slice(0, 24).join('\n')}`);
                    })
            })
            .catch((err) => {
                teleCtx.reply(`Looks like I ran into a problem.\n\nIf the issue persists contact ${CONFIG.devContactName}`);
                return errHandler(err);
            })
    } else {
        return teleCtx.reply(`Unsupported popularity lookup`);
    }

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
                    if (response.length > 0) {
                        var resultCount = 0;
                        var pageContents = [];
                        response.forEach((page, index) => {
                            resultCount = resultCount + page.length;
                            page.forEach((post, postIndex) => {
                                pageContents.push(post.file_url);
                            });
                        });
                        // avoid the 'message too long' issue
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
                    // return a message that something went wrong to the user
                    teleCtx.reply(`Looks like I ran into a problem. Make sure your tags don't have a typo!\n\nIf the issue persists contact ${CONFIG.devContactName}`);
                    return errHandler(err);
                })
        })
}

function limitSetHandler(teleCtx) {
    let limitVal = teleCtx.message.text.substring(6).trim()
    // validate number is correct
    if (isNaN(parseInt(limitVal)) == true || limitVal.length > 2) {
        return teleCtx.reply(`Sorry, ${limitVal} is not valid`);
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
        .then(() => {
            return logger.debug(`Limit set done for ${teleCtx.message.from.id}`);
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

/**
 * Iterate through a JSON e621Page and push each file_url to an array
 * @param {JSON} e621Page 
 * @returns {Promise}
 */
function pushFileUrlToArray(e621Page) {
    var pageContents = [];
    return new Promise((resolve, reject) => {
        e621Page.forEach((post, index) => {
            pageContents.push(post.file_url);
        });
        return resolve(pageContents);
    });
}
