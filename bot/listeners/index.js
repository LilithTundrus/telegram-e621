'use strict';
const { Composer } = require('telegraf');
const composer = new Composer();
const Markup = require('telegraf/markup');
const Scene = require('telegraf/scenes/base');
const Extra = require('telegraf/extra');
const Stage = require('telegraf/stage');

const searchHandler = require('./searchHandler');
const popularHandler = require('./popularHandler');

const stage = new Stage([searchHandler, popularHandler]);
const { enter, leave } = Stage;

composer.use(
    stage.middleware(),
)

composer.hears('🔍 Search', enter('search'));
composer.hears('😎 Popular', enter('popular'));


module.exports = composer;
