'use strict';

let Promise = require("bluebird");

module.exports = class SkillFulfill {

    constructor() {
    }

    finish(message_platform_type, message_platform, bot_event, conversation){
        switch(message_platform_type){
            case "line":
                let messages = [{
                    type: "text",
                    text: conversation.intent.fulfillment.speech
                }];
                return message_platform.reply_message(bot_event.replyToken, messages);
            break;
            default:
                return Promise.reject(`Unsupported message platform type: ${message_platform_type}`);
            break;
        }
    }
};
