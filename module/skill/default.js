'use strict';

let debug = require("debug")("skill");

module.exports = class SkillDefault {
    finish(bot, bot_event, context){
        debug(`Going to reply "${context.intent.fulfillment.speech}".`);
        let messages = [bot.create_message(context.intent.fulfillment.speech)];
        return bot.reply(bot_event, messages);
    }
};
