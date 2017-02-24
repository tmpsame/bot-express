'use strict';

let Promise = require("bluebird");

/*
** Just reply the returned sentence from api.ai as it is.
*/
module.exports = class SkillGreet {

    finish(bot, bot_event, conversation){
        let messages = [{
            type: "text",
            text: conversation.intent.fulfillment.speech
        }];
        return bot.reply(bot_event.replyToken, messages);
    }

};
