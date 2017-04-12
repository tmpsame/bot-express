'use strict';

let debug = require("debug")("skill");

module.exports = class SkillHandlePizzaOrder {

    // コンストラクター。このスキルで必要とする、または指定することができるパラメータを設定します。
    constructor() {
        this.required_parameter = {
            pizza: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザはお決まりでしょうか？ マルゲリータ、マリナーラからお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザはお決まりでしょうか？",
                        actions: [
                            {type:"message",label:"マルゲリータ",text:"マルゲリータ"},
                            {type:"message",label:"マリナーラ",text:"マリナーラ"}
                        ]
                    }
                }
            },
            size: {
                message_to_confirm: {
                    type: "template",
                    altText: "サイズはいかがいたしましょうか？ S、M、Lからお選びください。",
                    template: {
                        type: "buttons",
                        text: "サイズはいかがいたしましょうか？",
                        actions: [
                            {type:"message",label:"S",text:"S"},
                            {type:"message",label:"M",text:"M"},
                            {type:"message",label:"L",text:"L"}
                        ]
                    }
                }
            },
            address: {
                message_to_confirm: {
                    type: "text",
                    text: "お届け先の住所を教えていただけますか？"
                }
            },
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "最後に、お客様のお名前を教えていただけますか？"
                }
            }
        };

        this.clear_context_on_finish = true;
    }

    parse_pizza(value){
        let parsed_value;
        if (value.match(/マルゲリータ/)){
            parsed_value = "マルゲリータ";
        } else if (value.match(/マリナーラ/)){
            parsed_value = "マリナーラ";
        } else {
            parsed_value = false;
        }
        return parsed_value;
    }

    parse_size(value){
        let parsed_value;
        if (value.match(/[sS]/) || value.match(/小/)){
            parsed_value = "S";
        } else if (value.match(/[mM]/) || value.match(/中/) || value.match(/普通/)){
            parsed_value = "M";
        } else if (value.match(/[lL]/) || value.match(/大/)){
            parsed_value = "L";
        } else {
            parsed_value = false;
        }
        return parsed_value;
    }

    parse_address(value){
        let parsed_value;
        if (typeof value == "string"){
            parsed_value = {
                address: value.replace("です", "").replace("でーす", "").replace("ですー", "").replace("。", ""),
                latitude: null,
                longitude: null
            }
        } else if (typeof value == "object"){
            if (value.address){
                // This is LINE location message.
                parsed_value = {
                    address: value.address,
                    latitude: value.latitude,
                    longitude: value.longitude
                }
            } else if (value.attachments){
                for (let attachment of value.attachments){
                    if (attachment.type == "location"){
                        parsed_value = {
                            address: null, // Need to fill out some day...
                            latitude: attachment.payload.coordinates.lat,
                            longitude: attachment.payload.coordinates.long
                        }
                    }
                }
            } else {
                parsed_value = false;
            }
        } else {
            parsed_value = false;
        }

        return parsed_value;
    }

    parse_name(value){
        let parsed_value;
        parsed_value = value.replace("です", "").replace("でーす", "").replace("ですー", "").replace("と申します", "").replace("。", "");
        return parsed_value;
    }

    // パラメーターが全部揃ったら実行する処理を記述します。
    finish(bot, bot_event, context){
        let messages = [bot.create_text_message(`${context.confirmed.name} 様、ご注文ありがとうございました！${context.confirmed.pizza}の${context.confirmed.size}サイズを30分以内にご指定の${context.confirmed.address.address}までお届けに上がります。`)];
        return bot.reply(bot_event, messages);
    }
};
