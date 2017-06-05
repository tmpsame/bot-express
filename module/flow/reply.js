'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");


module.exports = class ReplyFlow extends Flow {
    /*
    ** ### Reply Flow ###
    ** -> Check if the event is supported one in this flow.
    ** -> Translate param value.
    ** -> Add Parameter from message text or postback data.
    ** -> Run final action.
    */

    constructor(messenger, bot_event, context, options) {
        context._flow = "reply";
        super(messenger, bot_event, context, options);
    }

    run(){
        debug("### This is Reply Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type("reply")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return Promise.resolve(`This is unsupported event type in this flow so skip processing.`);
        }

        let param_value = this.messenger.extract_param_value();

        let is_postback = false;
        if (this.messenger.type == "line"){
            if (this.bot_event.type == "postback") is_postback = true;
        } else if (this.messenger.type == "facebook"){
            if (this.bot_event.postback) is_postback = true;
        }

        let translated;
        if (!this.messenger.translater || is_postback){
            translated = Promise.resolve(param_value);
        } else {
            // If sender language is different from bot language, we translate message into bot language.
            debug(`Bot language is ${this.options.nlp_options.language} and sender language is ${this.context.sender_language}`);
            if (this.options.nlp_options.language === this.context.sender_language){
                debug("We do not translate param value.");
                translated = Promise.resolve(param_value);
            } else {
                debug("Translating param value...");
                translated = this.messenger.translater.translate(param_value, this.options.nlp_options.language).then(
                    (response) => {
                        debug("Translater response follows.");
                        debug(response);
                        return response[0];
                    }
                );
            }
        }

        return translated.then(
            (param_value) => {
                debug(param_value);
                return super.apply_parameter(this.context.confirming, param_value);
            }
        ).then(
            (applied_parameter) => {
                if (applied_parameter == null){
                    debug("Parameter was not applicable. We skip reaction and go to finish.");
                    return;
                }
                debug(applied_parameter);
                return super.react(null, applied_parameter.key, applied_parameter.value);
            }
        ).catch(
            (error) => {
                if (error.name == "BotExpressParseError"){
                    debug("Parser rejected the value");
                    return super.react(error, this.context.confirming, param_value);
                } else {
                    return Promise.reject(error);
                }
            }
        ).then(
            (response) => {
                debug("Reaction succeeded.");
                // Run final action.
                return super.finish();
            }
        );
    }
}
