'use strict';

let Line = require("./service/line");
let Facebook = require("./service/facebook");

module.exports = class VirtualPlatform {
    constructor(options){
        this.type = options.message_platform_type;
        this.options = options;
        this.service = this.instantiate_service();
        this.context = null; // Will be set later in webhook;
    }

    instantiate_service(){
        return this[`_${this.type}_instantiate_service`]();
    }

    _line_instantiate_service(){
        return new Line(this.options.line_channel_id, this.options.line_channel_secret, this.options.line_channel_access_token);
    }

    _facebook_instantiate_service(){
        return new Facebook(this.options.facebook_app_secret, this.options.facebook_page_access_token);
    }

    validate_signature(req){
        return this[`_${this.type}_validate_signature`](req);
    }

    _line_validate_signature(req){
        return this.service.validate_signature(req.get('X-Line-Signature'), req.raw_body);
    }

    _facebook_validate_signature(req){
        return this.service.validate_signature(req.get('X-Hub-Signature'), req.raw_body);
    }

    extract_events(body){
        return this[`_${this.type}_extract_events`](body);
    }

    _line_extract_events(body){
        return body.events;
    }

    _facebook_extract_events(body){
        let events = [];
        for (let entry of body.entry){
            events = events.concat(entry.messaging);
        }
        return events;
    }

    extract_event_type(bot_event){
        return this[`_${this.type}_extract_event_type`](bot_event);
    }

    _line_extract_event_type(bot_event){
        return bot_event.type;
    }

    _facebook_extract_event_type(bot_event){
        let event_type;
        if (bot_event.message){
            if (bot_event.message.quick_reply){
                // This is Quick Reply
                event_type = "quick_reply";
            } else if (bot_event.message.text){
                // This is Text Message
                event_type = "text_message";
            }
        } else if (bot_event.postback){
            // This is Postback
            event_type = "postback;"
        }
        return event_type;
    }

    extract_beacon_event_type(bot_event){
        return this[`_${this.type}_extract_beacon_event_type`](bot_event);
    }

    _line_extract_beacon_event_type(bot_event){
        let beacon_event_type = false;
        if (bot_event.beacon.type == "enter"){
            beacon_event_type = "enter";
        } else if (bot_event.beacon.type == "leave"){
            beacon_event_type = "leave";
        }
        return beacon_event_type;
    }

    _facebook_extract_beacon_event_type(bot_event){
        let beacon_event_type = false;
        return beacon_event_type;
    }

    extract_memory_id(bot_event){
        return this[`_${this.type}_extract_memory_id`](bot_event);
    }

    _line_extract_memory_id(bot_event){
        return bot_event.source.userId;
    }

    _facebook_extract_memory_id(bot_event){
        return bot_event.sender.id;
    }

    check_supported_event_type(flow, bot_event){
        return this[`_${this.type}_check_supported_event_type`](flow, bot_event);
    }

    _line_check_supported_event_type(flow, bot_event){
        switch(flow){
            case "beacon":
                if (bot_event.type == "beacon"){
                    return true;
                }
                return false;
            break;
            case "start_conversation":
                if (bot_event.type == "message" && bot_event.message.type == "text"){
                    return true;
                }
                return false;
            break;
            case "reply":
                if (bot_event.type == "message" || bot_event.type == "postback") {
                    return true;
                }
                return false;
            break;
            case "change_intent":
                if (bot_event.type == "message" && bot_event.message.type == "text"){
                    return true;
                }
                return false;
            break;
            case "change_parameter":
                if (bot_event.type == "message" || bot_event.type == "postback"){
                    return true;
                }
                return false;
            break;
            case "no_way":
                if (bot_event.type == "message" && bot_event.message.type == "text"){
                    return true;
                }
                return false;
            break;
            default:
                return false;
            break;
        }
    }

    _facebook_check_supported_event_type(flow, bot_event){
        switch(flow){
            case "beacon":
                return false;
            break;
            case "start_conversation":
                if (bot_event.message && bot_event.message.text){
                    return true;
                }
                return false;
            break;
            case "reply":
                if (bot_event.message || bot_event.postback){
                    return true;
                }
                return false;
            break;
            case "change_intent":
                if (bot_event.message && bot_event.message.text){
                    return true;
                }
                return false;
            break;
            case "change_parameter":
                if (bot_event.message || bot_event.postback){
                    return true;
                }
                return false;
            break;
            case "no_way":
                if (bot_event.message && bot_event.message.text){
                    return true;
                }
                return false;
            break;
            default:
                return false;
            break;
        }
    }

    extract_session_id(bot_event){
        return this[`_${this.type}_extract_session_id`](bot_event);
    }

    _line_extract_session_id(bot_event){
        return bot_event.source.userId;
    }

    _facebook_extract_session_id(bot_event){
        return bot_event.sender.id;
    }

    extract_param_value(bot_event){
        return this[`_${this.type}_extract_param_value`](bot_event);
    }

    _line_extract_param_value(bot_event){
        let param_value;
        switch(bot_event.type){
            case "message":
                if (bot_event.message.type == "text"){
                    param_value = bot_event.message.text;
                } else {
                    param_value = bot_event.message;
                }
            break;
            case "postback":
                param_value = bot_event.postback.data;
            break;
        }
        return param_value;
    }

    _facebook_extract_param_value(bot_event){
        let param_value;
        if (bot_event.message){
            if (bot_event.message.quick_reply){
                // This is Quick Reply
                param_value = bot_event.message.quick_reply.payload;
            } else if (bot_event.message.attachments){
                // This is Attachment
                param_value = bot_event.message;
            } else if (bot_event.message.text){
                // This is Text Message
                param_value = bot_event.message.text;
            }
        } else if (bot_event.postback){
            // This is Postback
            param_value = bot_event.postback.payload;
        }
        return param_value;
    }

    extract_message_text(bot_event){
        return this[`_${this.type}_extract_message_text`](bot_event);
    }

    _line_extract_message_text(bot_event){
        let message_text;
        switch(bot_event.type){
            case "message":
                message_text = bot_event.message.text;
            break;
            case "postback":
                message_text = bot_event.postback.data;
            break;
        }
        return message_text;
    }

    _facebook_extract_message_text(bot_event){
        let message_text;
        if (bot_event.message){
            if (bot_event.message.quick_reply){
                // This is Quick Reply
                message_text = bot_event.message.quick_reply.payload;
            } else if (bot_event.message.text){
                // This is Text Message
                message_text = bot_event.message.text;
            }
        } else if (bot_event.postback){
            // This is Postback
            message_text = bot_event.postback.payload;
        }
        return message_text;
    }

    create_message(message_object, message_type){
        return this[`_${this.type}_create_message`](message_object, message_type);
    }

    _line_create_message(message_object, message_type = "text"){
        let message;
        switch(message_type){
            case "text":
                message = {
                    type: "text",
                    text: message_object
                }
            break;
        }
        return message;
    }

    _facebook_create_message(message_object, message_type = "text"){
        let message;
        switch(message_type){
            case "text":
                message = {
                    text: message_object
                }
            break;
        }
        return message;
    }

    reply(bot_event, messages){
        if (process.env.BOT_EXPRESS_ENV == "test"){
            return new Promise((resolve, reject) => {
                return resolve();
            });
        }
        return this[`_${this.type}_reply`](bot_event, messages);
    }

    _line_reply(bot_event, messages){
        return this.service.reply(bot_event.replyToken, messages);
    }

    _facebook_reply(bot_event, messages){
        return this.service.send({id: bot_event.sender.id}, messages);
    }

    send(recipient_id, messages){
        if (process.env.BOT_EXPRESS_ENV == "test"){
            return new Promise((resolve, reject) => {
                return resolve();
            });
        }
        return this[`_${this.type}_send`](recipient_id, messages);
    }

    _line_send(recipient_id, messages){
        return this.service.send(recipient_id, messages);
    }

    _facebook_send(recipient_id, messages){
        return this.service.send({id: recipient_id}, messages);
    }

    // While collect method exists in flow, this method is for developers to explicitly collect a parameter.
    collect(bot_event, parameter){
        if (Object.keys(parameter).length != 1){
            return Promise.reject("Malformed parameter.");
        }
        let param_key = Object.keys(parameter)[0];
        this.context.confirming = param_key;
        Object.assign(this.context.to_confirm, parameter);

        if (!parameter[param_key].message_to_confirm[this.type]){
            return Promise.reject("While we need to send a message to confirm parameter, the message not found.");
        }

        // Send question to the user.
        let messages = [parameter[param_key].message_to_confirm[this.type]];
        return this.reply(bot_event, messages);
    }
}
