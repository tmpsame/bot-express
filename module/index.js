'use strict';

const SUPPORTED_MESSAGE_PLATFORM_TYPE = ["line"];
const REQUIRED_OPTIONS = {
    line: ["line_channel_id", "line_channel_secret", "line_channel_access_token", "apiai_client_access_token", "default_skill"]
}
const DEFAULT_MESSAGE_PLATFORM_TYPE = "line";
const DEFAULT_MEMORY_RETENTION = 60000;
const DEFAULT_SKILL_PATH = "../../../../skill/";
const DEFAULT_INTENT = "input.unknown";

let express = require("express");
let router = express.Router();
let body_parser = require("body-parser");
let Webhook = require("./webhook");

router.use(body_parser.json({
    verify: (req, res, buf, encoding) => {
        req.rawBody = buf;
    }
}));

module.exports = (options) => {
    // Set optional options.
    options.message_platform_type = options.message_platform_type || DEFAULT_MESSAGE_PLATFORM_TYPE;
    options.memory_retention = options.memory_retention || DEFAULT_MEMORY_RETENTION;
    options.default_intent = options.default_intent || DEFAULT_INTENT;
    if (!!options.skill_path){
        options.skill_path = "../../../../" + options.skill_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        options.skill_path = "../../sample_skill/";
    } else {
        options.skill_path = DEFAULT_SKILL_PATH;
    }
    if (options.enable_ask_retry === null){
        options.enable_ask_retry = false;
    }
    options.message_to_ask_retry = options.message_to_ask_retry || "ごめんなさい、もうちょっと正確にお願いできますか？";

    // Check if Message Platform Type is supported
    if (SUPPORTED_MESSAGE_PLATFORM_TYPE.indexOf(options.message_platform_type) === -1){
        throw(`Specified message_platform_type: "${options.message_platform_type}" is not supported.`);
    }

    // Check if required options are set.
    for (let req_opt of REQUIRED_OPTIONS[options.message_platform_type]){
        if (typeof options[req_opt] == "undefined"){
            throw(`Required option: "${req_opt}" not set`);
        }
    }
    console.log("Required options all set.");

    // Webhook Process
    router.post('/', function(req, res, next){
        res.status(200).end();

        let webhook = new Webhook(options);
        webhook.run(req).then(
            (response) => {
                console.log("Successful End of Webhook.");
            },
            (response) => {
                console.log("Abnormal End of Webhook.");
            }
        );
    });
    return router;
}
