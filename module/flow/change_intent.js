'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("flow");
let Flow = require("./flow");


module.exports = class ChangeIntentFlow extends Flow {
    /*
    ** ### Change Intent Flow ###
    ** - Check if the event is supported one in this flow.
    ** - If we find some parameters from message, add them to the conversation.
    ** - Run final action.
    */

    constructor(vp, bot_event, context, options) {
        context.to_confirm = {};
        context.confirming = null;
        super(vp, bot_event, context, options);
        this.context._flow = "change_intent";
    }

    run(){
        debug("\n### This is Change Intent Flow. ###\n");

        // If we find some parameters from initial message, add them to the conversation.
        let all_parameters_processed = [];
        if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
            for (let param_key of Object.keys(this.context.intent.parameters)){
                // Parse and Add parameters using skill specific logic.
                all_parameters_processed.push(
                    super.add_parameter(param_key, this.context.intent.parameters[param_key]).then(
                        (response) => {
                            return super.react(true, Object.keys(response)[0], response[Object.keys(response)[0]]);
                        },
                        (response) => {
                            return super.react(false, param_key, this.context.intent.parameters[param_key]);
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
