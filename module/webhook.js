'use strict';

const REQUIRED_OPTIONS = {
    line: ["line_channel_id", "line_channel_secret", "line_channel_access_token"],
    facebook: ["facebook_app_secret", "facebook_page_access_token"]
}

// Import NPM Packages
let Promise = require("bluebird");
let memory = require("memory-cache");
let debug = require("debug")("webhook");

// Import Flows
let beacon_flow = require('./flow/beacon');
let start_conversation_flow = require('./flow/start_conversation');
let reply_flow = require('./flow/reply');
let change_intent_flow = require('./flow/change_intent');
let change_parameter_flow = require('./flow/change_parameter');
let no_way_flow = require('./flow/no_way');

// Import Services
let Line = require("./service/line");
let Apiai = require("./service/apiai");

// Import Platform Abstraction.
let Virtual_platform = require("./virtual-platform");

module.exports = class webhook {
    constructor(options){
        this.options = options;
    }

    run(req){
        debug("\nWebhook runs.\n");

        // FOR TEST PURPOSE ONLY: Clear Memory.
        if (process.env.BOT_EXPRESS_ENV == "test" && req.clear_memory){
            debug(`Deleting memory of ${req.clear_memory}`);
            memory.del(req.clear_memory);
            return Promise.resolve({
                message: "memory cleared",
                memory_id: req.clear_memory
            });
        }

        // Identify Message Platform.
        if (req.get("X-Line-Signature") && req.body.events){
            this.options.message_platform_type = "line";
        } else if (req.get("X-Hub-Signature") && req.body.object == "page"){
            this.options.message_platform_type = "facebook";
        } else {
            return Promise.resolve(`This event comes from unsupported message platform. Skip processing.`);
        }
        debug(`Message Platform is ${this.options.message_platform_type}`);

        // Check if required options for this message platform are set.
        for (let req_opt of REQUIRED_OPTIONS[this.options.message_platform_type]){
            if (typeof this.options[req_opt] == "undefined"){
                return Promise.reject({
                    reason: "required option missing",
                    missing_option: req_opt
                });
            }
        }
        debug("Message Platform specific required options all set.");

        // Instantiate Message Platform.
        let vp = new Virtual_platform(this.options);
        debug("Virtual Message Platform instantiated.");

        // Signature Validation.
        if (!vp.validate_signature(req)){
            return Promise.reject("Signature Validation failed.");
        }
        debug("Signature Validation suceeded.");

        // Set Events.
        let bot_events = vp.extract_events(req.body);

        // Instantiate api.ai instance
        let apiai = new Apiai(this.options.apiai_client_access_token, this.options.language);
        debug("api.ai instantiated.");

        for (let bot_event of bot_events){
            debug(`Processing following event.`);
            debug(bot_event);

            vp.bot_event = bot_event;

            // Recall Memory
            let memory_id = vp.extract_memory_id();
            debug(`memory id is ${memory_id}.`);

            let context = memory.get(memory_id);
            vp.context = context;

            let promise_flow_completed;
            let flow;

            if (vp.extract_event_type() == "beacon"){
                /*
                ** Beacon Flow
                */
                let beacon_event_type = vp.extract_beacon_event_type();

                if (!beacon_event_type){
                    return Promise.resolve("Unsupported beacon event.");
                }
                if (!this.options.beacon_skill || !this.options.beacon_skill[beacon_event_type]){
                    return Promise.resolve(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`);
                }
                debug(`This is beacon flow and we use ${this.options.beacon_skill[beacon_event_type]} as skill`);

                // Instantiate the conversation object. This will be saved as Bot Memory.
                context = {
                    intent: {action: this.options.beacon_skill[beacon_event_type]},
                    confirmed: {},
                    to_confirm: [],
                    confirming: null,
                    previous: {
                        confirmed: [],
                        message: []
                    }
                };
                vp.context = context;
                try {
                    flow = new beacon_flow(vp, bot_event, context, this.options);
                } catch(err) {
                    return Promise.reject(err);
                }
                promise_flow_completed = flow.run();
            } else if (!context){
                /*
                ** Start Conversation Flow.
                */

                // Check if this event type is supported in this flow.
                if (!vp.check_supported_event_type("start_conversation")){
                    return Promise.resolve(`unsupported event for start conversation flow`);
                }

                // Set session id for api.ai and text to identify intent.
                let session_id = vp.extract_session_id();
                let text = vp.extract_message_text();

                promise_flow_completed = apiai.identify_intent(session_id, text).then(
                    (response) => {
                        debug(`Intent is ${response.result.action}`);

                        // Instantiate the conversation object. This will be saved as Bot Memory.
                        context = {
                            intent: response.result,
                            confirmed: {},
                            to_confirm: [],
                            confirming: null,
                            previous: {
                                confirmed: [],
                                message: []
                            }
                        };
                        vp.context = context;
                        try {
                            flow = new start_conversation_flow(vp, bot_event, context, this.options);
                        } catch(err) {
                            return Promise.reject(err);
                        }
                        return flow.run();
                    },
                    (response) => {
                        debug("Failed to identify intent.");
                        return Promise.reject(response);
                    }
                );
                // End of Start Conversation Flow.
            } else {
                if (!!context.confirming){
                    /*
                    ** Reply Flow
                    */

                    // Check if this event type is supported in this flow.
                    if (!vp.check_supported_event_type("reply")){
                        debug(`This is unsupported event type in this flow so skip processing.`)
                        return Promise.resolve(`unsupported event for reply flow`);
                    }

                    try {
                        flow = new reply_flow(vp, bot_event, context, this.options);
                    } catch(err){
                        return Promise.reject(err);
                    }
                    promise_flow_completed = flow.run();
                    // End of Reply Flow
                } else {
                    // Check if this is Change Intent Flow.
                    let promise_is_change_intent_flow;

                    if (!vp.check_supported_event_type("change_intent")){
                        promise_is_change_intent_flow = new Promise((resolve, reject) => {
                            resolve({
                                result: false,
                                intent: {fulfillment: {speech: ""}},
                                reason: "unsupported event for change intent flow"
                            });
                        });
                    } else {
                        // Set session id for api.ai and text to identify intent.
                        let session_id = vp.extract_session_id();
                        let text = vp.extract_message_text();

                        promise_is_change_intent_flow = apiai.identify_intent(session_id, text).then(
                            (response) => {
                                if (response.result.action != this.options.default_intent){
                                    // This is change intent flow or restart intent flow.
                                    debug("This is change intent flow or restart intent flow since we could identify intent.");
                                    return {
                                        result: true,
                                        intent: response.result
                                    }
                                } else {
                                    debug("This is not change intent flow since we could not identify intent.");
                                    return {
                                        result: false,
                                        intent: response.result
                                    }
                                }
                            },
                            (response) => {
                                // Failed to identify intent.
                                return Promise.reject(response);
                            }
                        );
                    }

                    promise_flow_completed = promise_is_change_intent_flow.then(
                        (response) => {
                            if (response.result){
                                if (response.intent.action == context.intent.action){
                                    /*
                                    ** Restart Intent Flow (= Start Conversation Flow)
                                    */
                                    // Instantiate the conversation object. This will be saved as Bot Memory.
                                    context = {
                                        intent: response.intent,
                                        confirmed: {},
                                        to_confirm: [],
                                        confirming: null,
                                        previous: {
                                            confirmed: [],
                                            message: []
                                        }
                                    };
                                    vp.context = context;
                                    try {
                                        flow = new start_conversation_flow(vp, bot_event, context, this.options);
                                    } catch(err) {
                                        return Promise.reject(err);
                                    }
                                    return flow.run();
                                    // End of Restart Intent Flow
                                } else {
                                    /*
                                    ** Change Intent Flow
                                    */
                                    // Set new intent while keeping other data.
                                    context.intent = response.intent;
                                    try {
                                        flow = new change_intent_flow(vp, bot_event, context, this.options);
                                    } catch(err){
                                        return Promise.reject(err);
                                    }
                                    return flow.run();
                                    // End of Change Intent Flow
                                }
                            } else {
                                context.intent.fulfillment = response.intent.fulfillment;

                                // Check if this is Change Parameter Flow.
                                let promise_is_change_parameter_flow;
                                if (!context.previous.confirmed || context.previous.confirmed.length == 0 || context.intent.action == this.options.default_intent){
                                    // This is not Change Parameter Flow.
                                    debug("This is not change parameter flow since we cannot find previously confirmed parameter. Or previous intent was default intent.")
                                    promise_is_change_parameter_flow = new Promise((resolve, reject) => {
                                        resolve({
                                            result: false
                                        });
                                    });
                                } else {
                                    // Assume this is Change Parameter Flow.
                                    try {
                                        flow = new change_parameter_flow(vp, bot_event, context, this.options);
                                    } catch(err){
                                        return Promise.reject(err);
                                    }
                                    promise_is_change_parameter_flow = flow.run();
                                }

                                return promise_is_change_parameter_flow.then(
                                    (response) => {
                                        if (response.result){
                                            /*
                                            ** This was Change Parameter Flow
                                            */
                                            debug("This was change parameter flow since we could change parameter.");
                                            return response.response;
                                        }

                                        /*
                                        ** This is No Way Flow
                                        */
                                        try {
                                            flow = new no_way_flow(vp, bot_event, context, this.options);
                                        } catch(err){
                                            return Promise.reject(err);
                                        }
                                        return flow.run();
                                    },
                                    (response) => {
                                        // This is exception. Stop processing webhook and reject.
                                        return Promise.reject(response);
                                    }
                                );
                            }
                        },
                        (response) => {
                            // This is exception. Stop processing webhook and reject.
                            return Promise.reject(response);
                        }
                    );
                }
            }

            // Completion of Flow
            return promise_flow_completed.then(
                (response) => {
                    debug("Successful End of Flow.");

                    // Update memory.
                    memory.put(memory_id, flow.context, this.options.memory_retention);

                    return flow.context;
                },
                (response) => {
                    debug("Abnormal End of Flow.");

                    // Clear memory.
                    memory.del(memory_id);

                    return Promise.reject(response);
                }
            ); // End of Completion of Flow

        }; // End of Process Event
    }
}
