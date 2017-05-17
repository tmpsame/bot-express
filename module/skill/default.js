'use strict';

let debug = require("debug")("bot-express:skill");

module.exports = class SkillDefault {
    finish(bot, bot_event, context, resolve, reject){
        debug(`Going to reply "${context.intent.fulfillment.speech}".`);
        let messages = [{
            text: context.intent.fulfillment.speech
        }];
        return bot.reply(messages).then(
            (response) => {
                return resolve(response);
            },
            (response) => {
                return reject(response);
            }
        );
    }
};
