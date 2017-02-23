'use strict';

let Promise = require("bluebird");

module.exports = class SkillApologize {

    constructor() {
    }

    finish(bot, bot_event, conversation){
        let messages = [{
            type: "text",
            text: "ごめんなさい。よくわかりませんでした。"
        }];
        return bot.reply_message(bot_event.replyToken, messages);
    }
};
