// Put all of the commands together!!
'use strict';
const { Composer } = require('telegraf');
const composer = new Composer();

// Require the set of commands to use
const startHandler = require('./startHandler');
const processInfoHandler = require('./processInfoHandler');
const menuHandler = require('./menuHandler');

// Assign the command listeners to the required components from above
composer.command('start', startHandler);
composer.command('processinfo', processInfoHandler);
composer.command('menu', menuHandler);

module.exports = composer;
