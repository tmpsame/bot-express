'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("flow");
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

        return super.add_parameter(this.context.confirming, param_value).then(
            (response) => {
                debug("add_parameter succeeded.");
                debug(response);
                return super.react(true, Object.keys(response)[0], response[Object.keys(response)[0]]);
            },
            (response) => {
                debug("add_parameter failed.");
                debug(response);
                return super.react(false, this.context.confirming, param_value);
            }
        ).then(
            (response) => {
                // Run final action.
                return super.finish();
            },
            (response) => {
                return Promise.reject(response);
            }
        );
    }
}
