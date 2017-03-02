'use strict';

const REQUIRED_OPTIONS = {
    common: ["apiai_client_access_token", "default_skill"]
}
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
    console.log("\nBot Express\n");

    // Set optional options.
    options.memory_retention = options.memory_retention || DEFAULT_MEMORY_RETENTION;
    options.default_intent = options.default_intent || DEFAULT_INTENT;
    if (!!options.skill_path){
        options.skill_path = "../../../../" + options.skill_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development" || process.env.BOT_EXPRESS_ENV == "test"){
        // This is for Bot Express development environment only.
        options.skill_path = "../../sample_skill/";
    } else {
        options.skill_path = DEFAULT_SKILL_PATH;
    }
    if (options.enable_ask_retry === null){
        options.enable_ask_retry = false;
    }
    options.message_to_ask_retry = options.message_to_ask_retry || "ごめんなさい、もうちょっと正確にお願いできますか？";
    options.facebook_verify_token = options.facebook_verify_token || options.facebook_page_access_token;

    // Check if common required options are set.
    for (let req_opt of REQUIRED_OPTIONS["common"]){
        if (typeof options[req_opt] == "undefined"){
            throw(`Required option: "${req_opt}" not set`);
        }
    }
    console.log("Common required options all set.");

    // Webhook Process
    router.post('/', (req, res, next) => {
        res.status(200).end();

        let webhook = new Webhook(options);
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
    router.get("/", (req, res, next) => {
        if (!options.facebook_verify_token){
            console.error("Failed validation. facebook_verify_token not set.");
            res.sendStatus(403);
        }
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === options.facebook_verify_token) {
            console.log("Validating webhook");
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error("Failed validation. Make sure the validation tokens match.");
            res.sendStatus(403);
        }
    });

    return router;
}
