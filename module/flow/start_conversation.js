'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let ParseError = require("../error/parse");
let Flow = require("./flow");
let Apiai = require("../service/apiai");

module.exports = class StartConversationFlow extends Flow {
    /*
    ** ### Start Conversation Flow ###
    ** -> Check if the event is supported one in this flow.
    ** -> Translate the message text.
    ** -> Identify intent.
    ** -> Process parameters.
    ** -> Run final action.
    */

    constructor(vp, bot_event, options) {
        let context = {
            _flow: "start_conversation",
            intent: null,
            confirmed: {},
            to_confirm: [],
            confirming: null,
            previous: {
                confirmed: [],
                message: []
            },
            _message_queue: [],
            sender_language: null
        };
        vp.context = context;
        super(vp, bot_event, context, options);
    }

    run(){
        debug("### This is Start Conversation Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.vp.check_supported_event_type("start_conversation")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return Promise.resolve(`This is unsupported event type in this flow so skip processing.`);
        }

        let message_text = this.vp.extract_message_text();

        let translated;
        if (!this.vp.translater){
            translated = Promise.resolve(message_text);
        } else {
            translated = this.vp.translater.detect(message_text).then(
                (response) => {
                    this.context.sender_language = response[0].language;
                    debug(`Bot language is ${this.options.language} and sender language is ${this.context.sender_language}`);

                    // If sender language is different from bot language, we translate message into bot language.
                    if (this.options.language === this.context.sender_language){
                        debug("We do not translate message text.");
                        return [message_text];
                    } else {
                        debug("Translating message text...");
                        return this.vp.translater.translate(message_text, this.options.language)
                    }
                }
            ).then(
                (response) => {
                    debug("Translater response follows.");
                    debug(response);
                    return response[0];
                }
            );
        }

        return translated.then(
            (message_text) => {
                // ### Identify Intent ###
                let apiai = new Apiai(this.options.apiai_client_access_token, this.options.language);
                debug("api.ai instantiated.");
                let session_id = this.vp.extract_session_id();
                return apiai.identify_intent(session_id, message_text);
            }
        ).then(
            (response) => {
                // ### Instantiate Skill ###
                this.context.intent = response.result;
                this.skill = super.instantiate_skill(this.context.intent.action);
                this.vp.skill = this.skill;

                // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
                // After that, we depend on context.to_confirm to identify to_confirm parameters.
                if (this.context.to_confirm.length == 0){
                    this.context.to_confirm = super.identify_to_confirm_parameter(this.skill.required_parameter, this.context.confirmed);
                }
                debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);


                // ### Process Parameters ###
                // If we find some parameters from initial message, add them to the conversation.
                let parameters_processed = [];
                if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
                    for (let param_key of Object.keys(this.context.intent.parameters)){
                        // Parse and Add parameters using skill specific logic.
                        parameters_processed.push(
                            super.apply_parameter(param_key, this.context.intent.parameters[param_key]).then(
                                (applied_parameter) => {
                                    if (applied_parameter == null){
                                        debug("Parameter was not applicable. We skip reaction and go to finish.");
                                        return;
                                    }
                                    return super.react(null, applied_parameter.key, applied_parameter.value);
                                }
                            ).catch(
                                ParseError, (error) => {
                                    debug("Parser rejected the value.");
                                    return super.react(error, param_key, this.context.intent.parameters[param_key]);
                                }
                            )
                        );
                    }
                }
                return Promise.all(parameters_processed);
            }
        ).then(
            (response) => {
                // ### Run Final Action ###
                return super.finish();
            }
        );
    } // End of run()
};
