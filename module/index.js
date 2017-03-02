'use strict';

const SUPPORTED_MESSAGE_PLATFORM_TYPE = ["line","facebook"];
const REQUIRED_OPTIONS = {
    line: ["line_channel_id", "line_channel_secret", "line_channel_access_token", "apiai_client_access_token", "default_skill"],
    facebook: ["facebook_page_access_token"]
}
//const DEFAULT_MESSAGE_PLATFORM_TYPE = "line";
const DEFAULT_MEMORY_RETENTION = 60000;
const DEFAULT_SKILL_PATH = "../../../../skill/";
const DEFAULT_INTENT = "input.unknown";

let express = require("express");
let router = express.Router();
let body_parser = require("body-parser");
let Webhook = require("./webhook");

router.use(body_parser.json({
    verify: (req, res, buf, encoding) => {
        req.raw_body = buf;
    }
}));

module.exports = (options) => {
    // Set optional options.
    this.options.memory_retention = this.options.memory_retention || DEFAULT_MEMORY_RETENTION;
    this.options.default_intent = this.options.default_intent || DEFAULT_INTENT;
    if (!!this.options.skill_path){
        this.options.skill_path = "../../../../" + this.options.skill_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        this.options.skill_path = "../../sample_skill/";
    } else {
        this.options.skill_path = DEFAULT_SKILL_PATH;
    }
    if (this.options.enable_ask_retry === null){
        this.options.enable_ask_retry = false;
    }
    this.options.message_to_ask_retry = this.options.message_to_ask_retry || "ごめんなさい、もうちょっと正確にお願いできますか？";

    // Check if Message Platform Type is provided
    if (!this.options.message_platform_type){
        throw(`Required option: "message_platform_type" not set`);
    }

    // Check if Message Platform Type is supported
    if (SUPPORTED_MESSAGE_PLATFORM_TYPE.indexOf(this.options.message_platform_type) === -1){
        throw(`Specified message_platform_type: "${this.options.message_platform_type}" is not supported.`);
    }

    // Check if required options are set.
    for (let req_opt of REQUIRED_OPTIONS[this.options.message_platform_type]){
        if (typeof this.options[req_opt] == "undefined"){
            throw(`Required option: "${req_opt}" not set`);
        }
    }
    console.log("Required options all set.");

    // Webhook Process
    router.post('/', (req, res, next) => {
        res.status(200).end();

        let webhook = new Webhook(this.options);
        webhook.run(req).then(
            (response) => {
                console.log("Successful End of Webhook.");
                console.log(response);
            },
            (response) => {
                console.log("Abnormal End of Webhook.");
                console.log(response);
            }
        );
    });

    // Verify Facebook Webhook
    if (this.options.message_platform_type == "facebook"){
        router.get("/", (req, res, next) => {
            if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.options.facebook_page_access_token) {
                console.log("Validating webhook");
                res.status(200).send(req.query['hub.challenge']);
            } else {
                console.error("Failed validation. Make sure the validation tokens match.");
                res.sendStatus(403);
            }
        });
    }
    return router;
}
