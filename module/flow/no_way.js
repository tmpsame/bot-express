'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let Flow = require("./flow");


module.exports = class NoWayFlow extends Flow {
    /*
    ** ### No Way Flow ###
    ** - Check if the event is supported one in this flow.
    ** - Run final action.
    */

    constructor(message_platform, bot_event, conversation, options) {
        conversation.intent = {action:"input.unknown"};
        conversation.to_confirm = {};
        conversation.confirming = null;
        super(message_platform, bot_event, conversation, options);
    }

    run(){
        console.log("\n### This is No Way Flow. ###\n");

        // Check if the event is supported one in this flow.
        switch(this.message_platform.type){
            case "line":
                if (this.bot_event.type != "message" || this.bot_event.message.type != "text"){
                    console.log("This is unsupported event type in this flow.");
                    return new Promise((resolve, reject) => {
                        resolve();
                    });
                }
            break;
            default:
                throw(`Unsupported message platform type: "${this.message_platform.type}"`);
            break;
        }
        console.log("This event is supported type.");

        // Run final action.
        return super.finish();
    } // End of run()
};
