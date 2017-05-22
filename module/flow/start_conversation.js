'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let ParseError = require("../error/parse");
let Flow = require("./flow");

module.exports = class StartConversationFlow extends Flow {
    /*
    ** ### Start Conversation Flow ###
    ** - Check if the event is supported one in this flow.
    ** - If we find some parameter from initial message, add them to the conversation.
    ** - Run final action.
    */

    constructor(vp, bot_event, context, options) {
        super(vp, bot_event, context, options);
        this.context._flow = "start_conversation";
    }

    run(){
        debug("### This is Start Conversation Flow. ###");

        // If we find some parameters from initial message, add them to the conversation.
        let all_parameters_processed = [];
        if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
            for (let param_key of Object.keys(this.context.intent.parameters)){
                // Parse and Add parameters using skill specific logic.
                all_parameters_processed.push(
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
                    ).catch(
                        (error) => {
                            debug("Exception thrown in apply_paramter.");
                            return Promise.reject(error);
                        }
                    )
                );
            }
        }

        // Run final action.
        return Promise.all(all_parameters_processed).then(
            (response) => {
                return super.finish();
            },
            (response) => {
                return Promise.reject(response);
            }
        );
    } // End of run()
};
