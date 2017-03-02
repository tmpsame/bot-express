'use strict';

// Import NPM Packages
let Promise = require("bluebird");
let memory = require("memory-cache");

// Import Flows
let start_conversation_flow = require('./flow/start_conversation');
let reply_flow = require('./flow/reply');
let change_intent_flow = require('./flow/change_intent');
let change_parameter_flow = require('./flow/change_parameter');
let no_way_flow = require('./flow/no_way');

// Import Services
let Line = require("./service/line");
let Apiai = require("./service/apiai");

// Import Virtual Platform abstraction.
let Virtual_platform = require("./virtual-platform");

module.exports = class webhook {
    constructor(options){
        this.options = options;
    }

    run(req){
        console.log("Got following data");
        console.log(req.body);

        // Instantiate Message Platform.
        let vp = new Virtual_platform(this.options);
        console.log("Virtual Message Platform instantiated.");

        // Signature Validation.
        if (process.env.BOT_EXPRESS_ENV != "development"){
            vp.validate_signature(req.get('X-Line-Signature'), req.rawBody);
            console.log("Signature Validation suceeded.");
        }

        // Set Events.
        let bot_events = vp.extract_events(req.body);
        console.log(bot_events);

        // Instantiate api.ai instance
        let apiai = new Apiai(this.options.apiai_client_access_token);
        console.log("api.ai instantiated.");

        for (let bot_event of bot_events){
            //console.log(`Processing following bot event.`);
            //console.log(bot_event);

            // Recall Memory
            let memory_id = vp.extract_memory_id(bot_event);
            console.log(`memory id is ${memory_id}.`);

            let conversation = memory.get(memory_id);
            //console.log(`Previous conversation is following.`);
            //console.log(conversation);

            let promise_flow_completed;
            let flow;

            if (!conversation){
                /*
                ** Start Conversation Flow.
                */

                // Check if this event type is supported in this flow.
                if (!vp.check_supported_event_type("start_conversation", bot_event)){
                    console.log(`This is unsupported event type in this flow so skip processing.`);
                    return Promise.resolve(`skipped-unsupported-event-in-start-conversation-flow`);
                }

                // Set session id for api.ai and text to identify intent.
                let session_id = vp.extract_session_id(bot_event);
                let text = vp.extract_message_text(bot_event);

                promise_flow_completed = apiai.identify_intent(session_id, text).then(
                    (response) => {
                        console.log(`Intent is ${response.result.action}`);

                        // Instantiate the conversation object. This will be saved as Bot Memory.
                        conversation = {
                            intent: response.result,
                            confirmed: {},
                            to_confirm: {},
                            confirming: null,
                            previous: {
                                confirmed: []
                            }
                        };
                        try {
                            flow = new start_conversation_flow(vp, bot_event, conversation, this.options);
                        } catch(err) {
                            return Promise.reject(err);
                        }
                        return flow.run();
                    },
                    (response) => {
                        console.log("Failed to identify intent.");
                        return Promise.reject(response);
                    }
                );
            // End of Start Conversation Flow.
            } else {
                if (!!conversation.confirming){
                    /*
                    ** Reply Flow
                    */

                    // Check if this event type is supported in this flow.
                    if (!vp.check_supported_event_type("reply", bot_event)){
                        console.log(`This is unsupported event type in this flow so skip processing.`)
                        return Promise.resolve(`skipped-unsupported-event-in-reply-flow`);
                    }

                    try {
                        flow = new reply_flow(vp, bot_event, conversation, this.options);
                    } catch(err){
                        return Promise.reject(err);
                    }
                    promise_flow_completed = flow.run();
                    // End of Reply Flow
                } else {

                    // Check the possiblity if this is change intent flow.
                    let possibly_change_intent_flow = true;
                    if (!vp.check_supported_event_type("change_intent", bot_event)){
                        let possibly_change_intent_flow = false;
                    }

                    // Check if this is Change Intent Flow.
                    if (possibly_change_intent_flow){

                        // Set session id for api.ai and text to identify intent.
                        let session_id = vp.extract_session_id(bot_event);
                        let text = vp.extract_message_text(bot_event);

                        promise_flow_completed = apiai.identify_intent(session_id, text).then(
                            (response) => {
                                if (response.result.action != this.options.default_intent){
                                    /*
                                    ** Change Intent Flow
                                    */

                                    // Set new intent while keeping other data.
                                    conversation.intent = response.result;
                                    try {
                                        flow = new change_intent_flow(vp, bot_event, conversation, this.options);
                                    } catch(err){
                                        return Promise.reject(err);
                                    }
                                    return flow.run();
                                    // End of Change Intent Flow
                                } else {
                                    if (conversation.previous.confirmed.length > 0 && conversation.intent.action != this.options.default_intent){
                                        /*
                                        ** Assume this is Change Parameter Flow.
                                        */
                                        try {
                                            flow = new change_parameter_flow(vp, bot_event, conversation, this.options);
                                        } catch(err){
                                            return Promise.reject(err);
                                        }
                                        return flow.run().then(
                                            (response) => {
                                                // Now it is confirmed this is Change Parameter Flow.
                                                return response;
                                            },
                                            (response) => {
                                                if (response == "no_fit"){
                                                    /*
                                                    ** Now it turned to be No Way Flow.
                                                    */
                                                    try {
                                                        flow = new no_way_flow(vp, bot_event, conversation, this.options);
                                                    } catch(err){
                                                        return Promise.reject(err);
                                                    }
                                                    return flow.run();
                                                }
                                            }
                                        ); // End of Assume this is Change Parameter Flow.
                                    } else {
                                        /*
                                        ** No Way Flow.
                                        */
                                        try {
                                            flow = new no_way_flow(vp, bot_event, conversation, this.options);
                                        } catch(err){
                                            return Promise.reject(err);
                                        }
                                        return flow.run();
                                    }
                                }
                            },
                            (response) => {
                                // Failed to identify intent.
                                return Promise.reject(response);
                            }
                        );
                    } else {
                        if (conversation.previous.confirmed.length > 0 && conversation.intent.action != this.options.default_intent){
                            /*
                            ** Assume this is Change Parameter Flow.
                            */
                            try {
                                flow = new change_parameter_flow(vp, bot_event, conversation, this.options);
                            } catch(err){
                                return Promise.reject(err);
                            }
                            return flow.run().then(
                                (response) => {
                                    // It is confirmd this is Change Parameter Flow.
                                    return response;
                                },
                                (response) => {
                                    if (response == "no_fit"){
                                        // It turned out to be No Way Flow.
                                        try {
                                            flow = new no_way_flow(vp, bot_event, conversation, this.options);
                                        } catch(err){
                                            return Promise.reject(err);
                                        }
                                        return flow.run();
                                    }
                                }
                            ); // End of Assume this is Change Parameter Flow.
                        } else {
                            /*
                            ** No Way Flow
                            */
                            try {
                                flow = new no_way_flow(vp, bot_event, conversation, this.options);
                            } catch(err){
                                return Promise.reject(err);
                            }
                            return flow.run();
                        }
                    }
                }
            }

            // Completion of Flow
            return promise_flow_completed.then(
                (response) => {
                    console.log("Successful End of Flow.");

                    // Update memory.
                    memory.put(memory_id, flow.conversation, this.options.memory_retention);

                    return flow.conversation;
                },
                (response) => {
                    console.log("Abnormal End of Flow.");

                    // Clear memory.
                    memory.put(memory_id, null);

                    return Promise.reject(response);
                }
            ); // End of Completion of Flow

        }; // End of Process Event
    }
}
