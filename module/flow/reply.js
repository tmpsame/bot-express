'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let Flow = require("./flow");


module.exports = class ReplyFlow extends Flow {
    /*
    ** ### Reply Flow ###
    ** - Check if the event is supported one in this flow.
    ** - Identify Intent.
    ** - Add Parameter from message text or postback data.
    ** - Run final action.
    */

    constructor(message_platform, bot_event, conversation, options) {
        super(message_platform, bot_event, conversation, options);
    }

    run(){
        console.log("\n### This is Reply Flow. ###\n");

        // Add Parameter from message text or postback data.
        let param_value;
        switch(this.message_platform.type){
            case "line":
                if (this.bot_event.type == "message"){
                    param_value = this.bot_event.message.text;
                } else if (this.bot_event.type == "postback"){
                    param_value = this.bot_event.postback.data;
                }
            break;
            default:
                throw(`Unsupported message platform type: "${this.message_platform.type}"`);
            break;
        }

        try {
            super.add_parameter(this.conversation.confirming, param_value);
        } catch(err){
        }

        // Run final action.
        return super.finish();
    }
}
