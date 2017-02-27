'use strict';

let Promise = require("bluebird");

/*
** Just apologize. Intended for default skill.
*/
module.exports = class SkillApologize {

    finish(bot, bot_event, conversation){
        let messages = [bot.create_message("ごめんなさい。よくわかりませんでした。", "text")];
        return bot.reply(bot_event, messages);
    }

};
