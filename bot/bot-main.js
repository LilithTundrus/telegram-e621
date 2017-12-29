'use strict';

const Telegraf = require('telegraf');
const config = require('../config/config');

const bot = new Telegraf(config.BOT_TOKEN);

module.exports = bot;