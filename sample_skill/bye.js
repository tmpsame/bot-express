'use strict';

let debug = require("debug")("skill");

/*
** Intended for use of beacon leave event.
*/
module.exports = class SkillBye {
    finish(bot, bot_event, context){
        debug(`Going to reply "Bye".`);
        let messages = [{
            text: "Bye"
        }];
        return bot.reply(bot_event, messages);
    }
};
