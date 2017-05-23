'use strict';

let Promise = require('bluebird');
let striptags = require('striptags');
let debug = require('debug')('bot-express:skill');
let rightnow = require('../service/rightnow');

module.exports = class SkillFaq {

    constructor(bot, bot_event){
        this.optional_parameter = {
            rating: {
                message_to_confirm: {
                    type: "template",
                    altText: "この回答、役に立ちました？（はい・いいえ）",
                    template: {
                        type: "confirm",
                        text: "この回答、役に立ちました？",
                        actions: [
                            {type: "message", label: "役立った", text: "役立った"},
                            {type: "message", label: "微妙", text: "微妙"}
                        ]
                    }
                },
                reaction: (error, value, context, resolve, reject) => {
                    if (!error){
                        // Promise List.
                        let tasks = [];

                        // ### Tasks Overview ###
                        // -> Rate content in FAQ database.
                        // -> Reply message depending on the rating.

                        // Rate Content in FAQ database.
                        tasks.push(rightnow.bot_rate_answer(context.confirmed.interaction_id, context.confirmed.answer_id, value, 3));

                        // Reply message depending on the rating.
                        if (value == 3){
                            bot.queue({text: "ホッ。"});
                        } else if (value == 1){
                            bot.queue({text: "ガッビーン。"});
                        }

                        return Promise.all(tasks).then(
                            (response) => {
                                return resolve();
                            }
                        );
                    } else {
                        bot.change_message_to_confirm("rating", {
                            type: "template",
                            altText: "おっとと、まずさっきの情報お役に立ったかおうかがいしてもよいですか？",
                            template: {
                                type: "confirm",
                                text: "おっとと、まずさっきの情報お役に立ったかおうかがいしてもよいですか？",
                                actions: [
                                    {type: "message", label: "役立った", text: "役立った"},
                                    {type: "message", label: "微妙", text: "微妙"}
                                ]
                            }
                        });
                        return resolve();
                    }
                }
            }
        },
        this.clear_context_on_finish = true;
    }

    parse_rating(value, resolve, reject){
        debug(`Parsing rating.`);
        let parsed_value;

        if (value.match(/役立った/) || value.match(/はい/) || value.match(/[yY][eE][sS]/) || value.match(/うん/) || value.match(/もちろん/)){
            parsed_value = 3;
        } else if (value.match(/微妙/) || value.match(/いいえ/) || value.match(/全然/) || value.match(/ぜんぜん/) || value.match(/[nN][oO]/) || value.match(/あまり/) || value.match(/違/)){
            parsed_value = 1;
        } else {
            return reject();
        }
        debug(`Parsed value is ${parsed_value}.`);
        return resolve(parsed_value);
    }

    finish(bot, bot_event, context, resolve, reject){
        // If rating is set, it means we've answered and this event is rating to that answer. So we just reply.
        if (typeof context.confirmed.rating != "undefined"){
            return bot.reply().then(
                (response) => {
                    return resolve();
                }
            );
        }

        context.confirmed.question = bot.extract_message_text();

        // If this is not the message we should handle, we skip this event. Maybe user tap confirm button twice.
        if (context.confirmed.question.match(/役立った/) || context.confirmed.question.match(/微妙/)){
            return resolve();
        }

        return rightnow.bot_search_answer(context.confirmed.question, process.env.RN_PRODUCT).then(
            (response) => {
                // Save interacion id for later rating.
                context.confirmed.interaction_id = response.interaction_id;

                // Save asnwer to context.
                if (!response.result || !response.result.Solution){
                    context.confirmed.answer = "ごめんなさい、ちょっと分かりませんでした。";
                } else {
                    context.confirmed.answer = striptags(response.result.Solution);
                    context.confirmed.answer_id = response.result.ID.attributes.id;
                }

                // Promise List.
                let tasks = [];

                // In case We do not have answer...
                // -> Reply apologies.
                if (!response.result || !response.result.Solution){
                    tasks.push(bot.reply([{text: context.confirmed.answer}]));
                }

                // In case We have an answer...
                // -> Reply answer.
                // -> Collect rating.
                if (response.result && response.result.Solution){
                    bot.queue({text: context.confirmed.answer});
                    bot.collect("rating");
                }

                return Promise.all(tasks);
            }
        ).then(
            (response) => {
                return resolve();
            }
        );
    }
};
