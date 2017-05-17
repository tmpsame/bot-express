'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");

module.exports = class BeaconFlow extends Flow {

    constructor(vp, bot_event, context, options) {
        super(vp, bot_event, context, options);
        this.context._flow = "beacon";
    }

    run(){
        debug("### This is Beacon Flow. ###");

        // Will collect missing parameter or run the final action.
        return super.finish();
    } // End of run()
};
