// Put all of the commands together!!
'use strict';
const { Composer } = require('telegraf');
const Markup = require('telegraf/markup');
const Scene = require('telegraf/scenes/base');
const Extra = require('telegraf/extra');
const Stage = require('telegraf/stage');
// Require the set of commands to use
const startHandler = require('./startHandler');
const processInfoHandler = require('./processInfoHandler');
const menuHandler = require('./menuHandler');
const searchHandler = require('../listeners/searchHandler');
const popularHandler = require('../listeners/popularHandler');

const stage = new Stage([searchHandler, popularHandler]);
const { enter, leave } = Stage;
const composer = new Composer();

composer.use(
    stage.middleware(),
)

// Assign the command listeners to the required components from above
composer.command('start', startHandler);
composer.command('processinfo', processInfoHandler);
composer.command('menu', menuHandler);
composer.command('search', enter('search'));
composer.command('popular', enter('popular'));


module.exports = composer;
