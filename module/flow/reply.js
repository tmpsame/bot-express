'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let ParseError = require("../error/parse");
let Flow = require("./flow");


module.exports = class ReplyFlow extends Flow {
    /*
    ** ### Reply Flow ###
    ** - Check if the event is supported one in this flow.
    ** - Identify Intent.
    ** - Add Parameter from message text or postback data.
    ** - Run final action.
    */

    constructor(vp, bot_event, context, options) {
        super(vp, bot_event, context, options);
        this.context._flow = "reply";
    }

    run(){
        debug("### This is Reply Flow. ###");

        // Add Parameter from message text or postback data.
        let param_value = this.vp.extract_param_value();

        return super.apply_parameter(this.context.confirming, param_value).then(
            (applied_parameter) => {
                if (applied_parameter == null){
                    debug("Parameter was not applicable. We skip reaction and go to finish.");
                    return;
                }
                debug(applied_parameter);
                return super.react(null, applied_parameter.key, applied_parameter.value);
            }
        ).catch(
            ParseError, (error) => {
                debug("Parser rejected the value.");
                return super.react(error, this.context.confirming, param_value);
            }
        ).then(
            (response) => {
                debug("Reaction succeeded.");
                // Run final action.
                return super.finish();
            }
        ).catch(
            (error) => {
                debug("Exception thrown in apply_paramter.");
                return Promise.reject(error);
            }
        );
    }
}
