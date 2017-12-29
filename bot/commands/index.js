//put all of the commands together!!
'use strict';
const { Composer } = require('telegraf');
const composer = new Composer();

// Require the set of commands to use
const startHandler = require('./startHandler');
const processInfoHandler = require('./processInfoHandler');

// Assign the command listeners to the required components from above
composer.command('start', startHandler);
composer.command('processinfo', processInfoHandler);

module.exports = composer;
