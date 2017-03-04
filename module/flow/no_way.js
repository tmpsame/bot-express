'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("flow");
let Flow = require("./flow");


module.exports = class NoWayFlow extends Flow {
    /*
    ** ### No Way Flow ###
    ** - Check if the event is supported one in this flow.
    ** - Run final action.
    */

    constructor(vp, bot_event, context, options) {
        context.intent = {action:"input.unknown"};
        context.to_confirm = {};
        context.confirming = null;
        super(vp, bot_event, context, options);
    }

    run(){
        debug("\n### This is No Way Flow. ###\n");

        // Check if the event is supported one in this flow.
        if (!this.vp.check_supported_event_type("no_way", this.bot_event)){
            debug(`This is unsupported event type in this flow so skip processing.`)
            return Promise.resolve(`This is unsupported event type in this flow so skip processing.`);
        }

        // Run final action.
        return super.finish();
    } // End of run()
};
