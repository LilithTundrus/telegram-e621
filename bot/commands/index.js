//put all of the commands together!!
'use strict';

const { Composer } = require('telegraf');
const composer = new Composer();

const startHandler = require('./startHandler');




composer.command('start', startHandler);


module.exports = composer;
