'use strict';

let Promise = require('bluebird');
let striptags = require('striptags');
let debug = require('debug')('skill');
let rightnow = require('../sample_service/rightnow');

module.exports = class SkillFaq {

    constructor(){
        this.optional_parameter = {
            rating: {
                message_to_confirm: {
                    type: "template",
                    altText: "",
                    template: {
                        type: "confirm",
                        text: "",
                        actions: [
                            {type: "message", label: "いいね！", text: "いいね！"},
                            {type: "message", label: "微妙", text: "微妙"}
                        ]
                    }
                },
                reaction: (parse_result, value, bot) => {
                    if (parse_result === true){
                        if (value == 1){
                            return bot.queue({text: "ホッ。"});
                        } else if (value == 0){
                            return bot.queue({text: "この度は誠に申し訳ありませんでした。"});
                        }
                    }
                }
            }
        }
    }

    parse_rating(value){
        debug(`Parsing rating.`);
        let parsed_value = false;
        if (value.match(/いいね/) || value.match(/[lL][iI][kK][eE]/)){
            parsed_value = 1;
        } else if (value.match(/微妙/)){
            parsed_value = 0;
        }
        debug(`Parsed value is ${parsed_value}.`);
        return parsed_value;
    }

    finish(bot, bot_event, context){
        if (typeof context.confirmed.rating != "undefined"){
            return bot.reply(bot_event).then(
                (response) => {
                    return context = null;
                },
                (response) => {
                    return Promise.reject(response);
                }
            )
        }

        let message_text = bot.extract_message_text(bot_event);
        return rightnow.search_answer(message_text).then(
            (response) => {
                let messages;
                if (!response || !response.Solution){
                    messages = [{
                        text: "ごめんなさい、ちょっと分かりませんでした。"
                    }];
                    context.confirmed.answer = "ごめんなさい、ちょっと分かりませんでした。";
                } else {
                    messages = [{
                        type: "template",
                        text: striptags(response.Solution)
                    }];
                    context.confirmed.answer = striptags(response.Solution);
                }
                this.optional_parameter.rating.message_to_confirm.altText = context.confirmed.answer;
                this.optional_parameter.rating.message_to_confirm.template.text = context.confirmed.answer;
                return bot.collect(bot_event, {rating: this.optional_parameter.rating});
            },
            (response) => {
                debug(response);
                return Promise.reject("Failed to get answer from rightnow.");
            }
        );
    }
};
