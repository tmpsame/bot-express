"use strict";

const zip_code = require("../sample_service/zip-code");
const debug = require("debug")("bot-express:skill");

module.exports = class SkillResolveZipCode {

    constructor(bot, bot_event) {
        this.required_parameter = {
            zip_code: {
                message_to_confirm: {
                    type: "text",
                    text: "お届け先の郵便番号を教えていただけますか？"
                },
                reaction: (error, value, context, resolve, reject) => {
                    if (!error){
                        /*
                        let message_to_confirm = this.required_parameter.city.message_to_confirm;
                        message_to_confirm.altText = "住所は「" + context.confirmed.zip_code.resolved_address + "」でよろしいでしょうか？";
                        message_to_confirm.template.text = "住所は「" + context.confirmed.zip_code.resolved_address + "」でよろしいでしょうか？";
                        message_to_confirm.template.actions[0].data = context.confirmed.zip_code.resolved_address;
                        bot.collect({
                            city: {
                                message_to_confirm: message_to_confirm
                            }
                        });
                        */
                        let message_text = "住所は「" + context.confirmed.zip_code.resolved_address + "」でよろしいでしょうか？";
                        this.required_parameter.city.message_to_confirm.altText = message_text;
                        this.required_parameter.city.message_to_confirm.template.text = message_text;
                        this.required_parameter.city.message_to_confirm.template.actions[0].data = context.confirmed.zip_code.resolved_address;
                        bot.collect("city");
                    }
                    return resolve();
                }
            },
            city: {
                message_to_confirm: {
                    type: "template",
                    altText: "",
                    template: {
                        type: "confirm",
                        text: "",
                        actions: [
                            {type: "postback", label: "はい", data: ""},
                            {type: "postback", label: "いいえ", data: "いいえ"}
                        ]
                    }
                },
                reaction: (error, value, context, resolve, reject) => {
                    if (error){
                        bot.collect("zip_code");
                    }
                    return resolve();
                }
            },
            street: {
                message_to_confirm: {
                    type: "text",
                    text: "番地を教えていただけますか？"
                }
            }
        };
    }

    parse_zip_code(value, resolve, reject){
        return zip_code.search(value).then(
            (response) => {
                let address = response.address1 + response.address2 + response.address3;
                return resolve({
                    zip_code: value,
                    resolved_address: address
                });
            },
            (response) => {
                return reject(response);
            }
        );
    }

    parse_city(value, resolve, reject){
        if (value == "いいえ"){
            return reject(value);
        } else if (value == "例外"){
            // For test purpose ONLY
            throw(new Error("例外"));
        } else {
            return resolve(value);
        }
    }

    // パラメーターが全部揃ったら実行する処理を記述します。
    finish(bot, bot_event, context, resolve, reject){
        let address = context.confirmed.city + context.confirmed.street;
        let messages = [{
            text: `ご注文ありがとうございました！30分以内にご指定の${address}までお届けに上がります。`
        }];
        return bot.reply(messages).then(
            (response) => {
                return resolve(response);
            }
        )
    }
};
