'use strict';

let Promise = require("bluebird");

/*
** Just reply the returned sentence from api.ai as it is.
*/
module.exports = class SkillGreet {

    finish(bot, bot_event, context){
        let messages = [bot.create_message(context.intent.fulfillment.speech, "text")];
        console.log(messages);
        return bot.reply(bot_event, messages);
    }

};
