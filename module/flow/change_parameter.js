'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let ParseError = require("../error/parse");
let Flow = require("./flow");


module.exports = class ChangeParameterFlow extends Flow {
    /*
    ** ### Change Parameter Flow ###
    ** -> Check if the event is supported one in this flow.
    ** -> Tranlsate
    ** -> Add Parameter from message text or postback data.
    ** -> Run final action.
    */

    constructor(vp, bot_event, context, options) {
        context._flow = "change_parameter";
        super(vp, bot_event, context, options);
        this.enable_ask_retry = options.enable_ask_retry;
        this.message_to_ask_retry = options.message_to_ask_retry;
    }

    run(){
        debug("### ASSUME This is Change Parameter Flow. ###");

        // ### Check if the event is supported one in this flow. ###
        if (!this.vp.check_supported_event_type("change_parameter")){
            return Promise.resolve({
                result: false,
                reason: "unsupported event for change parameter flow"
            });
        }

        let param_value = this.vp.extract_param_value();

        // ### Translate ###
        let is_postback = false;
        if (this.vp.type == "line"){
            if (this.bot_event.type == "postback") is_postback = true;
        } else if (this.vp.type == "facebook"){
            if (this.bot_event.postback) is_postback = true;
        }

        let translated;
        if (!this.vp.translater || is_postback){
            translated = Promise.resolve(param_value);
        } else {
            // If sender language is different from bot language, we translate message into bot language.
            if (this.options.language === this.context.sender_language){
                translated = Promise.resolve(param_value);
            } else {
                debug("Translating param value...");
                translated = this.vp.translater.translate(param_value, this.options.language).then(
                    (response) => {
                        return response[0];
                    }
                );
            }
        }

        // ### Change Parameter ###
        let is_fit = false;
        let parameters_processed = [];
        for (let previously_confirmed_param_key of this.context.previous.confirmed){
            debug(`Check if "${param_value}" is suitable for ${previously_confirmed_param_key}.`);
            parameters_processed.push(
                translated.then(
                    (param_value) => {
                        return super.change_parameter(previously_confirmed_param_key, param_value);
                    }
                ).then(
                    (applied_parameter) => {
                        if (applied_parameter == null){
                            debug("Parameter was not applicable. We skip reaction.");
                            return;
                        }
                        debug(`Great fit!`);
                        is_fit = true;
                        return super.react(null, applied_parameter.key, applied_parameter.value);
                    }
                ).catch(
                    ParseError, (error) => {
                        debug(`Does not fit`);
                    }
                )
            );
        }

        return Promise.all(parameters_processed).then(
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
                    // ### Run final action. ###
                    return {
                        result: true,
                        response: super.finish()
                    };
                }
            }
        );
    } // End of run()
};
