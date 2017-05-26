'use strict';

let debug = require("debug")("bot-express:skill");

/*
** Just reply the text response provided from api.ai.
*/
module.exports = class SkillSimpleResponse {
    finish(bot, bot_event, context, resolve, reject){
        debug(`Going to reply "${context.intent.fulfillment.speech}".`);
        let messages = [{
            type: "template",
            altText: "hoge",
            template: {
                text: "hoge",
                actions: [{
                    type: "text",
                    label: "hoge1",
                    text: "hoge1"
                }]
            }
        }]
        /*
        let messages = [{
            text: context.intent.fulfillment.speech
        }];
        */
        return bot.reply(messages).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
