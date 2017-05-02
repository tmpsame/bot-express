'use strict';

let Line = require("./service/line");
let Facebook = require("./service/facebook");
let debug = require("debug")("vp");

module.exports = class VirtualPlatform {
    constructor(options, bot_event){
        this.type = options.message_platform_type;
        this.options = options;
        this.service = this.instantiate_service();
        this.context = null; // Will be set later in webhook
        this.bot_event = bot_event;
        this.skill = null; // Will be set in flow constructor
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

    extract_event_type(){
        return this[`_${this.type}_extract_event_type`](this.bot_event);
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

    extract_beacon_event_type(){
        return this[`_${this.type}_extract_beacon_event_type`](this.bot_event);
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

    extract_memory_id(){
        return this[`_${this.type}_extract_memory_id`](this.bot_event);
    }

    _line_extract_memory_id(bot_event){
        return bot_event.source.userId;
    }

    _facebook_extract_memory_id(bot_event){
        return bot_event.sender.id;
    }

    check_supported_event_type(flow){
        return this[`_${this.type}_check_supported_event_type`](flow, this.bot_event);
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

    extract_session_id(){
        return this[`_${this.type}_extract_session_id`](this.bot_event);
    }

    _line_extract_session_id(bot_event){
        return bot_event.source.userId;
    }

    _facebook_extract_session_id(bot_event){
        return bot_event.sender.id;
    }

    extract_param_value(){
        return this[`_${this.type}_extract_param_value`](this.bot_event);
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

    extract_message_text(){
        return this[`_${this.type}_extract_message_text`](this.bot_event);
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

    // Deprecated. DO NOT USE this method anymore. Use compile_message() instead.
    create_text_message(text_message){
        let message_to_compile = {
            type: "text",
            text: text_message
        }
        let compiled_message = this.compile_message(message_to_compile);
        return compiled_message;
    }

    change_message_to_confirm(param_key, message){
        this.context.to_confirm[param_key].message_to_confirm = message;
    }

    queue(messages){
        if (typeof this.context.message_queue == "undefined"){
            this.context.message_queue = [];
        }
        this.context.message_queue = this.context.message_queue.concat(messages);
    }

    reply(messages = null){
        if (messages){
            this.queue(messages);
        }
        let compiled_messages = [];
        for (let message of this.context.message_queue){
            compiled_messages.push(this.compile_message(message));
        }
        return this[`_${this.type}_reply`](this.bot_event, compiled_messages).then(
            (response) => {
                this.context.message_queue = [];
                return response;
            },
            (response) => {
                return Promise.reject(response);
            }
        );
    }

    _line_reply(bot_event, messages){
        return this.service.reply(bot_event.replyToken, messages);
    }

    _facebook_reply(bot_event, messages){
        return this.service.send(bot_event.recipient.id, {id: bot_event.sender.id}, messages);
    }

    send(recipient_id, messages){
        let compiled_messages = [];
        for (let message of messages){
            compiled_messages.push(this.compile_message(message));
        }
        return this[`_${this.type}_send`](recipient_id, compiled_messages);
    }

    _line_send(recipient_id, messages){
        return this.service.send(recipient_id, messages);
    }

    _facebook_send(recipient_id, messages){
        return this.service.send(bot_event.recipient.id, {id: recipient_id}, messages);
    }

    // While collect method exists in flow, this method is for developers to explicitly collect a parameter.
    collect(arg){
        if (typeof arg == "string"){
            return this._collect_by_param_key(arg);
        } else if (typeof arg == "object"){
            return this._collect_by_param(arg);
        } else {
            return Promise.reject("Invalid argument for vp.collect()");
        }
    }

    _collect_by_param_key(param_key){
        debug("Going to collect parameter. Message should be defined in skill.");

        let param_value;
        let message_to_confirm;

        if (!!this.skill.required_parameter && !!this.skill.required_parameter[param_key]){
            debug(`We are going to collect required parameter "${param_key}".`);
            param_value = this.skill.required_parameter[param_key];
        } else if (!!this.skill.optional_parameter && !!this.skill.optional_parameter[param_key]){
            debug(`We are going to collect optional parameter "${param_key}".`);
            param_value = this.skill.optional_parameter[param_key];
        } else {
            debug(`Spedified parameter not found in skill.`);
            return Promise.reject(`Spedified parameter not found in skill.`);
        }

        if (!!param_value.message_to_confirm && !!param_value.message_to_confirm[this.type]){
            debug("Found message platform specific message object.");
            message_to_confirm = param_value.message_to_confirm[this.type];
        } else if (!!param_value.message_to_confirm){
            debug("Found common message object.");
            message_to_confirm = param_value.message_to_confirm;
        } else {
            debug("While we need to send a message to confirm parameter, the message not found.");
            return Promise.reject("While we need to send a message to confirm parameter, the message not found.");
        }

        this.context.confirming = param_key;
        this.context.to_confirm[param_key] = param_value;

        // Send question to the user.
        return this.reply([message_to_confirm]);
    }

    _collect_by_param(parameter){
        debug("Going to collect parameter. Message should be enveloped in the argument.");

        if (Object.keys(parameter).length != 1){
            return Promise.reject("Malformed parameter.");
        }
        let param_key = Object.keys(parameter)[0];

        let message_to_confirm;
        if (!!parameter[param_key].message_to_confirm[this.type]){
            // Found message platform specific message object.
            debug("Found message platform specific message object.");
            message_to_confirm = parameter[param_key].message_to_confirm[this.type];
        } else if (!!parameter[param_key].message_to_confirm){
            // Found common message object. We compile this message object to get message platform specific message object.
            debug("Found common message object.");
            message_to_confirm = parameter[param_key].message_to_confirm;
        } else {
            debug("While we need to send a message to confirm parameter, the message not found.");
            return Promise.reject("While we need to send a message to confirm parameter, the message not found.");
        }

        this.context.confirming = param_key;
        Object.assign(this.context.to_confirm, parameter);

        // Send question to the user.
        return this.reply([message_to_confirm]);
    }

    compile_message(message){
        // Identify the message format and type.
        let format = {
            provider: null, // line | facebook
            type: null // text | image | video | audio | location | sticker | imagemap | template | file | quick_reply
        }
        if (!!message.type){
            // Provider is line. Type is text or image or video or audio or location or sticker or imagemap or template.
            format.provider = "line";
            format.type = message.type; // text | image | video | audio | location | sticker | imagemap | template
        } else {
            let message_keys = Object.keys(message).sort();
            if (!!message.quick_replies && !!message.text){
                // Provider is facebook. Type is quick reply.
                format.provider = "facebook";
                format.type = "quick_reply";
            } else if (!!message.text){
                // Provider is facebook. Type is text.
                format.provider = "facebook";
                format.type = "text";
            } else if (!!message.attachment && !!message.attachment.type){
                // Provider is facebook.
                format.provider = "facebook";
                format.type = message.attachment.type; // image | audio | video | file | template
            }
        }
        if (!format.provider || !format.type){
            // We could not identify the format of this message object.
            throw(`We can not identify the format for this message object.`);
        }
        debug(`Identified message format is ${format.provider}, message type is ${format.type}.`);
        let compiled_message = this[`_${this.type}_compile_message`](format, message);
        debug(`Compiled message is following.`);
        debug(compiled_message);
        return compiled_message;
    }

    _line_compile_message(format, message){
        let compiled_message;
        if (format.provider == "line"){
            // This message is formatted in line format so we don't have to do anything.
            compiled_message = message;
        } else if (format.provider == "facebook"){
            switch(format.type){
                case "text":
                    compiled_message = {
                        type: "text",
                        text: message.text
                    }
                break;
                case "quick_reply":
                    // If the number of quick replies is less than or equal to 4, we try to compile to template message. Otherwise, we just compile it to text message.
                    if (message.quick_replies.length <= 4){
                        compiled_message = {
                            type: "template",
                            altText: message.text,
                            template: {
                                type: "buttons",
                                text: message.text,
                                actions: []
                            }
                        }
                        for (let quick_reply of message.quick_replies){
                            if (quick_reply.content_type == "text"){
                                compiled_message.template.actions.push({
                                    type: "message",
                                    label: quick_reply.title,
                                    text: quick_reply.payload
                                });
                            } else {
                                // quick reply of location type is included but line does not corresponding template type so we insert "unsupported".
                                compiled_message.template.actions.push({
                                    type: "message",
                                    label: "*Unsupported Location Type",
                                    text: "*Unsupported Location Type"
                                });
                            }
                        }
                    } else {
                        compiled_message = {
                            type: "text",
                            text: message.text
                        }
                    }
                break;
                case "image":
                    // Limited support since facebook does not have property corresponding to previewImageUrl.
                    compiled_message = {
                        type: "image",
                        originalContentUrl: message.attachment.payload.url,
                        previewImageUrl: message.attachment.payload.url
                    }
                break;
                case "audio":
                    // Not Supported since facebook does not have property corresponding to "duration".
                    /*
                    compiled_message = {
                        type: "audio",
                        originalContentUrl: message.attachment.payload.url,
                        duration: undefined
                    }
                    */
                    debug(`Compiling ${format.type} message from facebook format to line format is not supported since facebook does not have the property corresponding to "duration". Supported types are text(may includes quick replies), image and template.`);
                    compiled_message = {
                        type: text,
                        text: `*Message type is audio and it was made in facebook format. It lacks required "duration" property so we could not translate.`
                    }
                break;
                case "video":
                    // Not supported since facebook does not have property corresponding to "previewImageUrl".
                    /*
                    compiled_message = {
                        type: "image",
                        originalContentUrl: message.attachment.payload.url,
                        previewImageUrl: undefined
                    }
                    */
                    debug(`Compiling ${format.type} message from facebook format to line format is not supported since facebook does not have property corresponding to "previewImageUrl". Supported types are text(may includes quick replies), image and template.`);
                    compiled_message = {
                        type: text,
                        text: `*Message type is video and it was made in facebook format. It lacks required "previewImageUrl" property so we could not translate.`
                    }
                break;
                case "file":
                    // Not supported since line does not have corresponding message object.
                    debug(`Compiling ${format.type} message from facebook format to line format is not supported since line does not have corresponding message object. Supported types are text(may includes quick replies), image and template.`);
                    compiled_message = {
                        type: text,
                        text: `*Message type is file and it was made in facebook format. LINE does not have corresponding message so we could not translate.`
                    }
                break;
                case "template":
                    if (message.attachment.payload.template_type == "button"){
                        compiled_message = {
                            type: "template",
                            altText: message.attachment.payload.text,
                            template: {
                                type: "buttons",
                                text: message.attachment.payload.text,
                                actions: []
                            }
                        }
                        for (let button of message.attachment.payload.buttons){
                            // Upper threshold of buttons is 3 in facebook and 4 in line. So compiling facebook buttons to line button is safe.
                            if (button.type == "postback"){
                                compiled_message.template.actions.push({
                                    type: "postback",
                                    label: button.title,
                                    data: button.payload
                                });
                            } else if (button.type == "web_url"){
                                compiled_message.template.actions.push({
                                    type: "uri",
                                    label: button.title,
                                    uri: button.url
                                });
                            } else {
                                // Not supported since line does not have corresponding template.
                                debug(`Compiling template messege including ${button.type} button from facebook format to line format is not supported since line does not have corresponding template.`);
                                compiled_message = {
                                    type: "text",
                                    text: `*Message type is template and it was made in facebook format. LINE does not have corresponding message so we could not translate.`
                                }
                            }
                        }
                    } else if (message.attachment.payload.template_type == "generic"){
                        compiled_message = {
                            type: "template",
                            altText: "Carousel Template", // This is a dummy text since facebook does not have corresponiding property.
                            template: {
                                type: "carousel",
                                columns: []
                            }
                        }
                        for (let element of message.attachment.payload.elements){
                            let column = {
                                text: element.title,
                                thumbnailImageUrl: element.image_url,
                                actions: []
                            }
                            for (let button of element.buttons){
                                // Upper threshold of buttons is 3 in facebook and 3 in line. So compiling facebook buttons to line button is safe.
                                if (button.type == "postback"){
                                    column.actions.push({
                                        type: "postback",
                                        label: button.title,
                                        data: button.payload
                                    });
                                } else if (button.type == "web_url"){
                                    column.actions.push({
                                        type: "uri",
                                        label: button.title,
                                        uri: button.url
                                    });
                                } else {
                                    // Not supported since line does not have corresponding template.
                                    debug(`Compiling template messege including ${button.type} button from facebook format to line format is not supported since line does not have corresponding template.`);
                                    compiled_message = {
                                        type: "text",
                                        text: `*Message type is template and it was made in facebook format. LINE does not have corresponding message so we could not translate.`
                                    }
                                }
                            }
                            compiled_message.template.columns.push(column);
                        }
                    } else {
                        // Not supported since line does not have corresponiding template.
                        debug(`Compiling template messege of ${message.attachment.payload.template_type} from facebook format to line format is not supported. Supported type of template are button and generic.`);
                        compiled_message = {
                            type: "text",
                            text: `*Message type is template of ${message.attachment.payload.template_type} and it was made in facebook format. LINE does not have corresponding message so we could not translate.`
                        }
                    }
                break;
                default:
                    debug(`Compiling ${format.type} message from facebook format to line format is not supported. Supported types are text(may includes quick replies), image and template.`);
                    compiled_message = {
                        type: "text",
                        text: "*Original Message had unsupported information"
                    }
                break;
            } // End of switch(format.type)
        } // End of if (format.provider == "facebook")
        return compiled_message;
    }

    _facebook_compile_message(format, message){
        let compiled_message;
        if (format.provider == "facebook"){
            // This message is formatted in facebook format so we don't have to do anything.
            compiled_message = message;
        } else if (format.provider == "line"){
            switch(format.type){ // text | image | video | audio | location(unsupported) | sticker(unsupported) | imagemap(unsupported) | template
                case "text":
                    compiled_message = {
                        text: message.text
                    }
                break;
                case "image":
                    compiled_message = {
                        attachment: {
                            type: "image",
                            payload: {
                                url: message.originalContentUrl
                            }
                        }
                    }
                break;
                case "video":
                    compiled_message = {
                        attachment: {
                            type: "video",
                            payload: {
                                url: message.originalContentUrl
                            }
                        }
                    }
                break;
                case "audio":
                    compiled_message = {
                        attachment: {
                            type: "audio",
                            payload: {
                                url: message.originalContentUrl
                            }
                        }
                    }
                break;
                case "template":
                    if (message.template.type == "buttons" || message.template.type == "confirm"){
                        let uri_included = false;
                        for (let action of message.template.actions){
                            if (action.type == "uri"){
                                uri_included = true;
                            }
                        }
                        if (uri_included){
                            // This template message include uri button so we use template message in facebook as well.
                            if (message.template.actions.length > 3){
                                // Not supported since facebook does not allow template message including more than 3 buttons. The threshold of action of line template button is 4.
                                debug(`Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message.`);
                                compiled_message = {
                                    text: message.altText + "*Original Message had unsupported information"
                                }
                            } else {
                                compiled_message = {
                                    attachment: {
                                        type: "template",
                                        payload: {
                                            template_type: "button",
                                            text: message.template.text,
                                            buttons: []
                                        }
                                    }
                                }
                                for (let action of message.template.actions){
                                    if (action.type == "uri"){
                                        compiled_message.attachment.payload.buttons.push({
                                            type: "web_url",
                                            url: action.uri,
                                            title: action.label
                                        });
                                    } else {
                                        compiled_message.attachment.payload.buttons.push({
                                            type: "postback",
                                            title: action.label,
                                            payload: action.data
                                        });
                                    }

                                }
                            }
                        } else {
                            // This template message does not include uri. Can be postback or message so we use quick reply.
                            compiled_message = {
                                text: message.template.text,
                                quick_replies: []
                            }
                            for (let action of message.template.actions){
                                if (action.type == "postback"){
                                    compiled_message.quick_replies.push({
                                        content_type: "text",
                                        title: action.label,
                                        payload: action.data
                                    });
                                } else if (action.type == "message"){
                                    compiled_message.quick_replies.push({
                                        content_type: "text",
                                        title: action.label,
                                        payload: action.text
                                    });
                                }
                            }
                        }
                    } else if (message.template.type == "carousel"){
                        compiled_message = {
                            attachment: {
                                type: "template",
                                payload: {
                                    template_type: "generic",
                                    elements: []
                                }
                            }
                        }
                        for (let column of message.template.columns){
                            let element = {
                                title: column.text,
                                image_url: column.thumbnailImageUrl,
                                buttons: []
                            }
                            let uri_included = false;
                            for (let action of column.actions){
                                if (action.type == "uri"){
                                    uri_included = true;
                                }
                            }
                            if (uri_included){
                                if (column.actions.length > 3){
                                    // Not supported since facebook does not allow template message including more than 3 buttons. line's threshold is 3, too.
                                    debug(`Compiling template messege including more than 3 buttons including uri button from line format to facebook format is not supported.`);
                                    compiled_message = {
                                        text: message.altText + " *Original Message had unsupported information"
                                    }
                                }
                            }
                            for (let action of column.actions){
                                if (action.type == "postback"){
                                    element.buttons.push({
                                        type: "postback",
                                        title: action.label,
                                        payload: action.data
                                    });
                                } else if (action.type == "message"){
                                    element.buttons.push({
                                        type: "postback",
                                        title: action.label,
                                        payload: action.text
                                    });
                                } else if (action.type == "uri"){
                                    element.buttons.push({
                                        type: "web_url",
                                        url: action.uri,
                                        title: action.label
                                    });
                                }
                            }
                            compiled_message.attachment.payload.elements.push(element);
                        } // End of for (let column of message.template.columns)
                    }
                break;
                default:
                    debug(`Compiling ${format.type} message from line format to facebook format is not supported. Supported types are text, image, video, audio and template.`);
                    compiled_message = {
                        text: "*Original Message had unsupported information"
                    }
                break;
            } // End of switch(format.type)
        } // End of if (format.provider == "line")
        return compiled_message;
    }
}
