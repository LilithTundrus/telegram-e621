'use strict';
const Markup = require('telegraf/markup');

const menuHanlder = async (ctx) => {
    return ctx.reply('Select an option', Markup
        .keyboard([
            ['🔍 Search', '😎 Popular'],
            ['☸ Settings', '📞 Feedback', '❓ Help']
        ])
        .oneTime()
        .resize()
        .extra()
    )
}

module.exports = menuHanlder;