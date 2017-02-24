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

    constructor(message_platform_type, message_platform, bot_event, conversation, skill_path, default_skill, enable_ask_retry, message_to_ask_retry) {
        super(message_platform_type, message_platform, bot_event, conversation, skill_path, default_skill);
        this.enable_ask_retry = enable_ask_retry;
        this.message_to_ask_retry = message_to_ask_retry;
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
                throw(`Unsupported message platform type: "${this.message_platform_type}"`);
            break;
        }

        let is_fit = false;
        for (let previously_confirmed_param_key of this.conversation.previous.confirmed){
            try {
                console.log(`Check if "${param_value}" is suitable for ${previously_confirmed_param_key}.`);
                super.change_parameter(previously_confirmed_param_key, param_value);
                console.log(`Great fit!`);
                is_fit = true;
                break;
            } catch(err){
                console.log(`It does not fit.`);
            }
        }
        if (!is_fit){
            if (this.enable_ask_retry && param_value.length <= 10){
                return super.ask_retry(this.message_to_ask_retry);
            }
            return Promise.reject("no_fit");
        }

        // Run final action.
        return super.finish();
    } // End of run()
};
