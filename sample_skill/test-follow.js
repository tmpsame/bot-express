"use strict";

let debug = require("debug")("bot-express:skill");

module.exports = class SkillFollow {
    finish(messenger, event, context, resolve, reject){
        return messenger.reply([{
            type: "text",
            text: "Welcome."
        }]).then(
            (response) => {
                return resolve();
            }
        )
    }
}
