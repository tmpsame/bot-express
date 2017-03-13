'use strict';

let Promise = require("bluebird");

module.exports = class SkillBye {

    finish(bot, bot_event, context){
        let messages = [bot.create_message("あばよ。", "text")];
        return bot.reply(bot_event, messages);
    }

};
