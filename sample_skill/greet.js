'use strict';

let Promise = require("bluebird");

/*
** Just reply the returned sentence from api.ai as it is.
*/
module.exports = class SkillGreet {

    finish(bot, bot_event, conversation){
        let messages = [bot.create_message(conversation.intent.fulfillment.speech, "text")];
        return bot.reply(bot_event, messages);
    }

};
