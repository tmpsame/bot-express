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
        debug("### ASSUME This is Change Parameter Flow. ###");

        // Check if the event is supported one in this flow.
        if (!this.vp.check_supported_event_type("change_parameter")){
            return Promise.resolve({
                result: false,
                reason: "unsupported event for change parameter flow"
            });
        }

        // Add Parameter from message text or postback data.
        let param_value = this.vp.extract_param_value();

        let is_fit = false;
        let all_parameters_processed = [];
        for (let previously_confirmed_param_key of this.context.previous.confirmed){
            debug(`Check if "${param_value}" is suitable for ${previously_confirmed_param_key}.`);
            all_parameters_processed.push(
                super.change_parameter(previously_confirmed_param_key, param_value).then(
                    (response) => {
                        debug(`Great fit!`);
                        is_fit = true;
                        return super.react(true, Object.keys(response)[0], response[Object.keys(response)[0]]);
                    },
                    (response) => {
                        debug(`Does not fit`);
                    }
                )
            );
        }

        return Promise.all(all_parameters_processed).then(
            (response) => {
                if (!is_fit){
                    debug(`We have not found any corresponding parameter.`);
                    // 10 should not be the perfect condition. This condition itself is not so good, either.
                    if (this.enable_ask_retry && typeof param_value == "string" && param_value.length <= 10){
                        return {
                            result: true,
                            response: super.ask_retry(this.message_to_ask_retry)
                        };
                    }
                    return {
                        result: false,
                        reason: "not fit"
                    };
                } else {
                    debug(`We identified corresponding parameter.`);
                    // Run final action.
                    return {
                        result: true,
                        response: super.finish()
                    };
                }
            }
        );
    } // End of run()
};
