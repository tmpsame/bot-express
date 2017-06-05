'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");


module.exports = class NoWayFlow extends Flow {
    /*
    ** ### No Way Flow ###
    ** This flow is selected when context exists, cannot identify intent and cannot extract parameter.
    */

    constructor(messenger, bot_event, context, options) {
        super(messenger, bot_event, context, options);
        this.context.intent.action = options.default_intent;
        this.context._flow = "no_way";
    }

    run(){
        debug("### This is No Way Flow. ###");

        // Check if the event is supported one in this flow.
        if (!this.messenger.check_supported_event_type("no_way")){
            debug(`This is unsupported event type in this flow so skip processing.`)
            return Promise.resolve(`This is unsupported event type in this flow so skip processing.`);
        }

        // Run final action.
        return super.finish();
    } // End of run()
};
