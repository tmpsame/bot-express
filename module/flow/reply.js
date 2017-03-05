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
        debug("\n### This is Reply Flow. ###\n");

        // Add Parameter from message text or postback data.
        let param_value = this.vp.extract_message_text(this.bot_event);

        try {
            super.add_parameter(this.context.confirming, param_value);
        } catch(err){
        }

        // Run final action.
        return super.finish();
    }
}
