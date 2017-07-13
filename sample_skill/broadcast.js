"use strict";

let debug = require("debug")("bot-express:skill");
let bot_user = require("../sample_service/bot-user");
let app_env = require("../environment_variables");
let Promise = require("bluebird");

/*
** Just forward the original message to all users.
** Supported messenger is LINE Only.
** Supported message types are text, sticker and location.
*/
const SUPPORTED_MESSENGERS = ["line"];
const SUPPORTED_MESSAGE_TYPES = ["text", "sticker", "location"];

module.exports = class SkillBroadcast {
    constructor(messenger, event){
        this.required_parameter = {
            message_text: {
                message_to_confirm: {
                    type: "text",
                    text: "はい、メッセージをどうぞ。"
                }
            }
        }
    }

    finish(messenger, event, context, resolve, reject){
        if (SUPPORTED_MESSENGERS.indexOf(messenger.type) === -1){
            debug(`${event.message.type} messenger is not supported in broadcast skill. Supported messenger is LINE only. We just skip processing this event.`);
            return resolve();
        }

        if (SUPPORTED_MESSAGE_TYPES.indexOf(event.message.type) === -1){
            debug(`${event.message.type} message type is not supported in broadcast skill. Supported message types are text and sticker message type. We just skip processing this event.`);
            return resolve();
        }

        let user_ids = [];
        bot_user.get_list().then(
            (users) => {
                // Broadcast message !!!! We need to call multicast every 150 users. !!!!
                for (let user of users){
                    // Skip myself.
                    if (user.user_id == messenger.extract_sender_id()){
                        continue;
                    }
                    user_ids.push(user.user_id);
                }

                // We copy original message and just remove id.
                let orig_message = JSON.parse(JSON.stringify(event.message));
                delete orig_message.id;

                return messenger.multicast(user_ids, orig_message);
            }
        ).then(
            (response) => {
                return messenger.reply([{
                    type: "text",
                    text: user_ids.length + "人にメッセージを送信しました。"
                }]);
            },
            (response) => {
                return messenger.reply([{
                    type: "text",
                    text: "メッセージの送信に失敗しました。"
                }]);
            }
        ).then(
            (response) => {
                return resolve();
            }
        )
    }
}
