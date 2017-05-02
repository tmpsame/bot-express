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
                            {type: "message", label: "解決した", text: "解決した"},
                            {type: "message", label: "解決しない", text: "解決しない"}
                        ]
                    }
                },
                reaction: (parse_result, value, bot) => {
                    if (parse_result === true){
                        if (value == "解決した"){
                            return bot.queue({text: "ホッ。"});
                        } else if (value == "解決しない"){
                            return bot.queue({text: "誠に申し訳ありません。"});
                        }
                    }
                }
            }
        }
    }

    finish(bot, bot_event, context){
        if (typeof context.confirmed.rating != "undefined"){
            return bot.reply().then(
                (response) => {
                    debug("Reply succeeded.");
                    return;
                },
                (response) => {
                    debug("Failed to reply.");
                    return Promise.reject(response);
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
                    return bot.collect({rating: this.optional_parameter.rating});
                }
            },
            (response) => {
                debug(response);
                return Promise.reject("Failed to get answer from rightnow.");
            }
        );
    }
};
