'use strict';

let Promise = require("bluebird");
let moji = require("moji");
let debug = require("debug")("skill");
let is_email = require("isemail");

module.exports = class SkillSurvey {

    constructor(){
        this.required_parameter = {
            satisfaction: {
                message_to_confirm: {
                    text: "勉強会お疲れ様でした！今回の満足度を5段階で教えてください。（5が最高、1が最低）",
                    quick_replies: [
                        {content_type:"text", title:"5 高", payload:5},
                        {content_type:"text", title:"4", payload:4},
                        {content_type:"text", title:"3", payload:3},
                        {content_type:"text", title:"2", payload:2},
                        {content_type:"text", title:"1 低", payload:1},
                    ]
                }
            }, // End of satisfaction
            difficulty: {
                message_to_confirm: {
                    text: "難易度はどうでした？",
                    quick_replies: [
                        {content_type:"text", title:"難しい", payload:"難しい"},
                        {content_type:"text", title:"適当", payload:"適当"},
                        {content_type:"text", title:"易しい", payload:"易しい"}
                    ]
                }
            }, // End of difficulty
            free_comment: {
                message_to_confirm: {
                    text: "是非感想を教えてください！"
                }
            }, // End of free_comment
            mail: {
                message_to_confirm: {
                    text: "最後にメールアドレス教えてもらえますか？"
                }
            } // End of mail
        } // End of required_parameter

        this.clear_context_on_finish = true;
    }

    parse_satisfaction(value){
        debug(`Parsing satisfaction.`);
        let parsed_value;
        try {
            parsed_value = Number(moji(value).convert('ZE', 'HE').toString());
        } catch(error){
            parsed_value = false;
        }
        if (typeof parsed_value != "number" || parsed_value == NaN || parsed_value < 1 || parsed_value > 5){
            debug(`Value is outside of range.`);
            parsed_value = false;
        }
        debug(`Parsed value is ${parsed_value}.`);
        return parsed_value;
    }

    parse_difficulty(value){
        debug(`Parsing difficulty.`);
        let parsed_value = false;
        if (value.match(/難/) || value.match(/むずかし/) || value.match(/むずい/) || value.match(/げきむず/) || value.match(/ゲキムズ/) || value.match(/激ムズ/)){
            parsed_value = 1;
        } else if (value.match(/適/) || value.match(/てきとう/) || value.match(/てきせつ/) || value.match(/ちょうど/) || value.match(/普通/) || value.match(/ふつう/)){
            parsed_value = 0;
        } else if (value.match(/易/) || value.match(/やさしい/) || value.match(/簡単/) || value.match(/かんたん/) || value.match(/easy/) || value.match(/イージー/)){
            parsed_value = -1;
        }
        debug(`Parsed value is ${parsed_value}.`);
        return parsed_value;
    }

    parse_free_comment(value){
        debug(`Parsing free_comment.`);
        let parsed_value = value;
        debug(`Parsed value is ${parsed_value}.`);
        return parsed_value;
    }

    parse_mail(value){
        debug(`Parsing mail.`);
        let parsed_value;
        if (is_email.validate(value)){
            parsed_value = value;
        } else {
            parsed_value = false;
        }
        debug(`Parsed value is ${parsed_value}.`);
        return parsed_value;
    }

    finish(bot, bot_event, context){
        let messages = [bot.create_text_message(`完璧です！ありがとうございました！！`)];
        return bot.reply(bot_event, messages);
    }
};
