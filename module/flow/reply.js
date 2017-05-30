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
    ** -> Check if the event is supported one in this flow.
    ** -> Translate param value.
    ** -> Add Parameter from message text or postback data.
    ** -> Run final action.
    */

    constructor(vp, bot_event, context, options) {
        super(vp, bot_event, context, options);
        this.context._flow = "reply";
    }

    run(){
        debug("### This is Reply Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.vp.check_supported_event_type("reply")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return Promise.resolve(`This is unsupported event type in this flow so skip processing.`);
        }

        let param_value = this.vp.extract_param_value();

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
            translated = this.vp.translater.detect(param_value).then(
                (response) => {
                    this.context.sender_language = response[0].language;
                    debug("sender language is " + this.context.sender_language);

                    // If sender language is different from bot language, we translate message into bot language.
                    if (this.options.language === this.context.sender_language){
                        return [param_value];
                    } else {
                        debug("Translating param value...");
                        return this.vp.translater.translate(param_value, this.options.language)
                    }
                }
            ).then(
                (response) => {
                    return response[0];
                }
            );
        }

        return translated.then(
            (param_value) => {
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
        );
    }
}
