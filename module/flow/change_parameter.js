'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("flow");
let Flow = require("./flow");


module.exports = class ChangeParameterFlow extends Flow {
    /*
    ** ### Change Parameter Flow ###
    ** - Check if the event is supported one in this flow.
    ** - Add Parameter from message text or postback data.
    ** - Run final action.
    */

    constructor(vp, bot_event, context, options) {
        super(vp, bot_event, context, options);
        this.context._flow = "change_parameter";
        this.enable_ask_retry = options.enable_ask_retry;
        this.message_to_ask_retry = options.message_to_ask_retry;
    }

    run(){
        debug("\n### ASSUME This is Change Parameter Flow. ###\n");

        // Check if the event is supported one in this flow.
        if (!this.vp.check_supported_event_type("change_parameter", this.bot_event)){
            return Promise.resolve({
                result: false,
                reason: "unsupported event for change parameter flow"
            });
        }

        // Add Parameter from message text or postback data.
        let param_value = this.vp.extract_param_value(this.bot_event);

        let is_fit = false;
        for (let previously_confirmed_param_key of this.context.previous.confirmed){
            try {
                debug(`Check if "${param_value}" is suitable for ${previously_confirmed_param_key}.`);
                super.change_parameter(previously_confirmed_param_key, param_value);
                debug(`Great fit!`);
                is_fit = true;
                break;
            } catch(err){
                debug(`It does not fit.`);
            }
        }
        if (!is_fit){
            if (this.enable_ask_retry && param_value.length <= 10){
                return Promise.resolve({
                    result: true,
                    response: super.ask_retry(this.message_to_ask_retry)
                });
            }
            return Promise.resolve({
                result: false,
                reason: "not fit"
            });
        }

        // Run final action.
        return Promise.resolve({
            result: true,
            response: super.finish()
        });
    } // End of run()
};
