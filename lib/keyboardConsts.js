const Extra = require('telegraf/extra');

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

exports.pagingKeyboard = pagingKeyboard;
exports.popularKeyboard = popularKeyboard;