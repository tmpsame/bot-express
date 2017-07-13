"use strict";

let debug = require("debug")("bot-express:skill");
let bot_user = require("../sample_service/bot-user");
let Promise = require("bluebird");
let request = require("request");
let app_env = require("../environment_variables");

Promise.promisifyAll(request);

/*
** Register user to database.
** Supported messenger is LINE Only.
*/
const SUPPORTED_MESSENGERS = ["line"];

module.exports = class SkillLeave {
    constructor(messenger, event){
        this.clear_context_on_finish = true;
    }
    
    finish(messenger, event, context, resolve, reject){
        if (SUPPORTED_MESSENGERS.indexOf(messenger.type) === -1){
            debug(`${event.message.type} messenger is not supported in leave skill. Supported messenger is LINE only. We just skip processing this event.`);
            return resolve();
        }

        return bot_user.delete(messenger.extract_sender_id()).then(
            (response) => {
                return resolve();
            }
        )
    }
}
