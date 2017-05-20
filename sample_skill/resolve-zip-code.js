"use strict";

const zip_code = require("../sample_service/zip-code");
const debug = require("debug")("pizza-bot");

module.exports = class SkillResolveZipCode {

    constructor(bot, bot_event) {
        this.required_parameter = {
            zip_code: {
                message_to_confirm: {
                    type: "text",
                    text: "お届け先の郵便番号を教えていただけますか？"
                },
                reaction: (result, value, context, resolve, reject) => {
                    if (result === true){
                        let message = this.required_parameter.city.message_to_confirm;
                        message.altText = "住所は「" + context.confirmed.zip_code.resolved_address + "」でよろしいでしょうか？";
                        message.text = "住所は「" + context.confirmed.zip_code.resolved_address + "」でよろしいでしょうか？";
                        message.template.actions[0].data = context.confirmed.zip_code.resolved_address;
                        bot.collect("city", message);
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
                reaction: (result, value, context, resolve, reject) => {
                    if (result === false){
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
                debug(response);
                let address = response.address1 + response.address2 + response.address3;
                return resolve({
                    zip_code: value,
                    resolved_address: address
                });
            },
            (response) => {
                debug(response);
                return reject(response);
            }
        );
    }

    parse_city(value, resolve, reject){
        if (value == "いいえ"){
            return reject(value);
        } else {
            return resolve(value);
        }
    }

    parse_street(value, resolve, reject){
        if (value == null || value.trim() == ""){
            return reject(value);
        }
        return resolve(value);
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
            },
            (response) => {
                return reject(response);
            }
        )
    }
};
