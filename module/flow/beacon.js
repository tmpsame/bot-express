'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("flow");
let Flow = require("./flow");

module.exports = class BeaconFlow extends Flow {

    constructor(vp, bot_event, context, options) {
        super(vp, bot_event, context, options);
        this.context._flow = "beacon";
    }

    run(){
        debug("\n### This is Beacon Flow. ###\n");

        // Will collect missing parameter or run the final action.
        return super.finish();
    } // End of run()
};
