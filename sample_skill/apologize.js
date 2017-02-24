'use strict';

let Promise = require("bluebird");

/*
** Just apologize. Intended for default skill.
*/
module.exports = class SkillApologize {

    finish(bot, bot_event, conversation){
        let messages = [{
            type: "text",
            text: "ごめんなさい。よくわかりませんでした。"
        }];
        return bot.reply(bot_event.replyToken, messages);
    }

};
