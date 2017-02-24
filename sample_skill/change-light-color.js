'use strict';

let Promise = require('bluebird');
let hue = require('../sample_service/hue');

const COLOR_MAPPINGS = [{
    label: "青",
    code: "5068FF"
},{
    label: "赤",
    code: "FF7B7B"
},{
    label: "黄",
    code: "FFFA6A"
}];

module.exports = class SkillChangeLightColor {

    constructor() {
        this.required_parameter = {
            color: {
                message_to_confirm: {
                    type: "text",
                    text: "何色にしますか？"
                },
                parse: this.parse_color
            }
        };
    }

    // サポートする色かどうかを判別しカラーコードに変化する
    parse_color(value){
        if (value === null || value == ""){
            throw("Value is emppty.");
        }

        let parsed_value = {};

        let found_color = false;
        for (let color_mapping of COLOR_MAPPINGS){
            if (value == color_mapping.label){
                parsed_value = color_mapping.code;
                found_color = true;
            }
        }
        if (!found_color){
            throw(`Unable to identify color: ${value}.`);
        }
        return parsed_value;
    }

    // IFTTT経由でHueのカラーを変更する
    finish(bot, bot_event, conversation){
        return hue.change_color(conversation.confirmed.color).then(
            (response) => {
                let messages = [{
                    type: "text",
                    text: "了解しましたー。"
                }];
                return bot.reply(bot_event.replyToken, messages);
            },
            (response) => {
                return Promise.reject("Failed to change light color.");
            }
        );
    }
};
