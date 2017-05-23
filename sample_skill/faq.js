'use strict';

let Promise = require('bluebird');
let striptags = require('striptags');
let debug = require('debug')('bot-express:skill');
let rightnow = require('../sample_service/rightnow');

module.exports = class SkillFaq {

    constructor(bot, bot_event){
        this.optional_parameter = {
            rating: {
                message_to_confirm: {
                    type: "template",
                    altText: "",
                    template: {
                        type: "confirm",
                        text: "",
                        actions: [
                            {type: "message", label: "解決した", text: "解決した"},
                            {type: "message", label: "解決しない", text: "解決しない"}
                        ]
                    }
                },
                reaction: (error, value, context, resolve, reject) => {
                    if (!error){
                        if (value == "解決した"){
                            bot.queue({text: "ホッ。"});
                        } else if (value == "解決しない"){
                            bot.queue({text: "誠に申し訳ありません。"});
                        }
                    }
                    return resolve();
                }
            }
        }
    }

    finish(bot, bot_event, context, resolve, reject){
        if (typeof context.confirmed.rating != "undefined"){
            return bot.reply().then(
                (response) => {
                    return resolve(response);
                }
            )
        }

        let message_text = bot.extract_message_text();
        return rightnow.search_answer(message_text).then(
            (response) => {
                let messages;
                if (!response || !response.Solution){
                    messages = [{
                        text: "ごめんなさい、ちょっと分かりませんでした。"
                    }];
                    return bot.reply(messages);
                } else {
                    this.optional_parameter.rating.message_to_confirm.altText = striptags(response.Solution);
                    this.optional_parameter.rating.message_to_confirm.template.text = this.optional_parameter.rating.message_to_confirm.altText;
                    bot.collect({rating: this.optional_parameter.rating});
                }
            }
        ).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
