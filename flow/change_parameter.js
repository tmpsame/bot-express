'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let Flow = require("./flow");


module.exports = class ChangeParameterFlow extends Flow {
    /*
    ** ### Change Parameter Flow ###
    ** - Check if the event is supported one in this flow.
    ** - Add Parameter from message text or postback data.
    ** - Run final action.
    */

    constructor(message_platform_type, message_platform, bot_event, conversation, skill_path, default_skill) {
        super(message_platform_type, message_platform, bot_event, conversation, skill_path, default_skill);
    }

    run(){
        console.log("\n### ASSUME This is Change Parameter Flow. ###\n");

        // Check if the event is supported one in this flow.
        switch(this.message_platform_type){
            case "line":
                if ((this.bot_event.type != "message" || this.bot_event.message.type != "text") && this.bot_event.type != "postback" ){
                    console.log("This is unsupported event type in this flow.");
                    return new Promise((resolve, reject) => {
                        resolve();
                    });
                }
            break;
            default:
                throw(`Unsupported message platform type: "${options.message_platform_type}"`);
            break;
        }

        // Add Parameter from message text or postback data.
        let param_value;
        switch(this.message_platform_type){
            case "line":
                if (this.bot_event.type == "message"){
                    param_value = this.bot_event.message.text;
                } else if (this.bot_event.type == "postback"){
                    param_value = this.bot_event.postback.data;
                }
            break;
            default:
                throw(`Unsupported message platform type: "${options.message_platform_type}"`);
            break;
        }

        try {
            super.add_parameter(this.conversation.previous.confirmed, param_value);
            console.log("\n### This is for sure Change Parameter Flow. ###\n");
        } catch(err){
            // It turned out this is not Change Parameter Flow.
            console.log("\n### It turned out this is not Change Parameter Flow. ###\n");
            return Promise.reject("failed_to_parse_parameter");
        }

        // Run final action.
        return super.finish();
    } // End of run()
};
