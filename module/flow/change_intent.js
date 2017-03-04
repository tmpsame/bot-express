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
    }

    run(){
        debug("\n### This is Change Intent Flow. ###\n");

        // If we find some parameters from message, add them to the conversation.
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
