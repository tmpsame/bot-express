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
                    line: {
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
                    facebook: {
                        text: "何色にしますか？",
                        quick_replies: [
                            {content_type:"text",title:"青",payload:"青"},
                            {content_type:"text",title:"赤",payload:"赤"},
                            {content_type:"text",title:"黄",payload:"黄"}
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
                let messages = [bot.create_message("了解しましたー。", "text")];
                return bot.reply(bot_event, messages);
            },
            (response) => {
                return Promise.reject("Failed to change light color.");
            }
        );
    }
};
