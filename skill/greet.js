'use strict';

let Promise = require("bluebird");

module.exports = class SkillGreet {

    constructor() {
    }

    finish(bot, bot_event, conversation){
        let messages = [{
            type: "text",
            text: conversation.intent.fulfillment.speech
        }];
        return bot.reply_message(bot_event.replyToken, messages);
    }
};
