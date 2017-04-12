'use strict';

const REQUIRED_OPTIONS = {
    common: ["apiai_client_access_token"]
}
const DEFAULT_MEMORY_RETENTION = 60000;
const DEFAULT_SKILL_PATH = "../../../../skill/";
const DEFAULT_INTENT = "input.unknown";
const DEFAULT_SKILL = "builtin_default";

let express = require("express");
let router = express.Router();
let body_parser = require("body-parser");
let debug = require("debug")("index");
let Webhook = require("./webhook");

router.use(body_parser.json({
    verify: (req, res, buf, encoding) => {
        req.raw_body = buf;
    }
}));

module.exports = (options) => {
    debug("\nBot Express\n");

    // Set optional options.
    options.default_intent = options.default_intent || DEFAULT_INTENT;
    options.default_skill = options.default_skill || DEFAULT_SKILL;
    options.memory_retention = options.memory_retention || DEFAULT_MEMORY_RETENTION;
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
    options.facebook_verify_token = options.facebook_verify_token || options.facebook_page_access_token;

    // Check if common required options are set.
    for (let req_opt of REQUIRED_OPTIONS["common"]){
        if (typeof options[req_opt] == "undefined"){
            throw(`Required option: "${req_opt}" not set`);
        }
    }
    debug("Common required options all set.");

    // Webhook Process
    router.post('/', (req, res, next) => {
        res.status(200).end();

        let webhook = new Webhook(options);
        webhook.run(req).then(
            (response) => {
                debug("Successful End of Webhook.");
                debug(response);
            },
            (response) => {
                debug("Abnormal End of Webhook.");
                debug(response);
            }
        );
    });

    // Verify Facebook Webhook
    router.get("/", (req, res, next) => {
        if (!options.facebook_verify_token){
            debug("Failed validation. facebook_verify_token not set.");
            res.sendStatus(403);
        }
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === options.facebook_verify_token) {
            debug("Validating webhook");
            res.status(200).send(req.query['hub.challenge']);
        } else {
            debug("Failed validation. Make sure the validation tokens match.");
            res.sendStatus(403);
        }
    });

    return router;
}
