'use strict';

let Promise = require('bluebird');
let hue = require('../sample_service/hue');

const COLOR_MAPPINGS = [
    {label: "青",code: "5068FF"},
    {label: "赤",code: "FF7B7B"},
    {label: "黄",code: "FFFA6A"}
];

/*
** Change the color of LED lighting of Hue.
*/
module.exports = class SkillChangeLightColor {

    constructor() {
        this.required_parameter = {
            color: {
                message_to_confirm: {
                    type: "template",
                    altText: "何色にしますか？（青か赤か黄）",
                    template: {
                        type: "buttons",
                        text: "何色にしますか？",
                        actions: [
                            {type:"postback",label:"青",data:"青"},
                            {type:"postback",label:"赤",data:"赤"},
                            {type:"postback",label:"黄",data:"黄"}
                        ]
                    }
                },
                parse: this.parse_color
            }
        };
    }

    // サポートする色かどうかを判別しカラーコードに変化する
    parse_color(value){
        if (value === null || value == ""){
            return false;
        }

        let parsed_value = {};

        let found_color = false;
        for (let color_mapping of COLOR_MAPPINGS){
            if (value.replace("色", "") == color_mapping.label){
                parsed_value = color_mapping.code;
                found_color = true;
            }
        }
        if (!found_color){
            return false
        }
        return parsed_value;
    }

    // IFTTT経由でHueのカラーを変更する
    finish(bot, bot_event, context){
        return hue.change_color(context.confirmed.color).then(
            (response) => {
                let messages = [{
                    text: "了解しましたー。"
                }];
                return bot.reply(messages);
            },
            (response) => {
                return Promise.reject("Failed to change light color.");
            }
        );
    }
};
