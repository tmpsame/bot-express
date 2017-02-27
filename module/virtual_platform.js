'use strict';

let Line = require("./service/line");

module.exports = class VirtualPlatform {
    constructor(options){
        this.type = options.message_platform_type;
        this.options = options;
        this.service = this.instantiate_service();
    }

    instantiate_service(){
        return this[`_${this.type}_instantiate_service`]();
    }

    _line_instantiate_service(){
        return new Line(this.options.line_channel_id, this.options.line_channel_secret, this.options.line_channel_access_token);
    }

    validate_signature(signature, raw_body){
        return this[`_${this.type}_validate_signature`](signature, raw_body);
    }

    _line_validate_signature(signature, raw_body){
        console.log(signature, raw_body);
        if (!this.service.validate_signature(signature, raw_body)){
            throw(`Signature Validation failed.`);
        }
    }

    extract_event(body){
        return this[`_${this.type}_extract_event`](body);
    }

    _line_extract_event(body){
        return body.events;
    }

    extract_memory_id(bot_event){
        return this[`_${this.type}_extract_memory_id`](bot_event);
    }

    _line_extract_memory_id(bot_event){
        return bot_event.source.userId;
    }

    check_supported_event_type(flow, bot_event){
        return this[`_${this.type}_check_supported_event_type`](flow, bot_event);
    }

    _line_check_supported_event_type(flow, bot_event){
        switch(flow){
            case "start_conversation":
                if (bot_event.type == "message" && bot_event.message.type == "text"){
                    return true;
                }
                return false;
            break;
            case "reply":
                if ((bot_event.type == "message" && bot_event.message.type == "text") || bot_event.type == "postback"){
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
                if ((bot_event.type == "message" && bot_event.message.type == "text") || bot_event.type == "postback"){
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

    extract_session_id(bot_event){
        return this[`_${this.type}_extract_session_id`](bot_event);
    }

    _line_extract_session_id(bot_event){
        return bot_event.source.userId;
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

    reply(bot_event, messages){
        return this[`_${this.type}_reply`](bot_event, messages);
    }

    _line_reply(bot_event, messages){
        return this.service.reply(bot_event.replyToken, messages);
    }
}
