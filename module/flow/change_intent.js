'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");


module.exports = class ChangeIntentFlow extends Flow {
    /*
    ** ### Change Intent Flow ###
    ** -> If we find some parameters from message, add them to the conversation.
    ** -> Run final action.
    */

    constructor(messenger, bot_event, context, options) {
        context.to_confirm = [];
        context.confirming = null;
        super(messenger, bot_event, context, options);
        this.context._flow = "change_intent";
    }

    run(){
        debug("### This is Change Intent Flow. ###");

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
                        (error) => {
                            if (error.name == "BotExpressParseError"){
                                debug("Parser rejected the value.");
                                return super.react(error, param_key, this.context.intent.parameters[param_key]);
                            } else {
                                return Promise.reject(error);
                            }
                        }
                    )
                );
            }
        }

        // Run final action.
        return Promise.all(all_parameters_processed).then(
            (response) => {
                return super.finish();
            }
        );
    } // End of run()
};
