'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("flow");
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
        debug("\n### This is Start Conversation Flow. ###\n");

        // If we find some parameters from initial message, add them to the conversation.
        if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
            for (let param_key of Object.keys(this.context.intent.parameters)){
                // Parse and Add parameters using skill specific logic.
                try {
                    super.add_parameter(param_key, this.context.intent.parameters[param_key]);
                } catch(err){
                }
            }
        }

        // Run final action.
        return super.finish();
    } // End of run()
};
