'use strict';
const { Composer } = require('telegraf');
const composer = new Composer();

const searchHandler = require('./searchHandler');

composer.hears('🔍 Search', searchHandler);



module.exports = composer;
