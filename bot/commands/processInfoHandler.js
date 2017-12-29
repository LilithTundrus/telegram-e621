'use strict';
const Logger = require('../../lib/loggerClass');                    // Our custom logging class
const logger = new Logger();                                        // Create an instance of our custom logger
const config = require('../../config/config');
const os = require('os');                                           // Builts in to Node, used to get OS info

const processInfoHandler = async (ctx) => {
    // Check if user is admin
    if (ctx.message.from.id.toString() !== config.TELEGRAM_ADMIN_ID) {
        logger.auth(`${ctx.message.from.username}(${ctx.message.from.id}) attempted to run the command 'processinfo' at ${new Date().toISOString()}`);
        return ctx.reply(`Sorry, you don't have access to this command. This attempt will be logged.`);
    } else {
        let processInfoMessage = `Bot Version: ${config.VER}\n\nRAM Total: ${Math.round(os.totalmem() / 1024 / 1024)}MB\nRAM free: ${Math.round(os.freemem() / 1024 / 1024)}MB\nIn use by Bot: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB\nCPU load: ${os.loadavg()[0]}%`;
        processInfoMessage = processInfoMessage + `\n\nUptime: ${formatTime(process.uptime())}`;
        return ctx.reply(processInfoMessage);
    }
}

function formatTime(seconds) {                                      // Format process.uptime (or other UNIX long dates (probably))
    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }
    var hours = Math.floor(seconds / (60 * 60));
    var minutes = Math.floor(seconds % (60 * 60) / 60);
    var seconds = Math.floor(seconds % 60);
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

module.exports = processInfoHandler;