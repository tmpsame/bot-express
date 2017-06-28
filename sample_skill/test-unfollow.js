"use strict";

let debug = require("debug")("bot-express:skill");

module.exports = class SkillUnfollow {
    finish(messenger, event, context, resolve, reject){
        return messenger.reply([{
            type: "text",
            text: "Bye."
        }]).then(
            (response) => {
                return resolve();
            }
        )
    }
}
