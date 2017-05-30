'use strict';

let Line = require("./service/line");
let Facebook = require("./service/facebook");
let debug = require("debug")("bot-express:vp");
let google_translate = require('@google-cloud/translate');

module.exports = class VirtualPlatform {
    constructor(options, bot_event){
        this.type = options.message_platform_type;
        this.options = options;
        this.service = this.instantiate_service();
        this.context = null; // Will be set later in webhook
        this.bot_event = bot_event;
        this.skill = null; // Will be set in flow constructor

        // Instantiates a translater
        if (this.options.google_project_id && this.options.google_application_credentials && this.options.auto_translation == "enable"){
            this.translater = google_translate({
                projectId: this.options.google_project_id
            });
        }
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
                if ((bot_event.type == "message" && bot_event.message.type == "text") || bot_event.type == "postback"){
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
                if ((bot_event.type == "message" && bot_event.message.type == "text") || bot_event.type == "postback"){
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
                if ((bot_event.message && bot_event.message.text) || bot_event.postback){
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
                if ((bot_event.message && bot_event.message.text) || bot_event.postback){
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
            } else if (bot_event.message.text){
                // This is Text Message
                param_value = bot_event.message.text;
            } else if (bot_event.message.attachments){
                // This is Attachemnt
                param_value = bot_event.message;
            }
        } else if (bot_event.postback){
            // This is Postback
            param_value = bot_event.postback.payload;
        }
        return param_value;
    }

    extract_message(){
        return this[`_${this.type}_extract_message`](this.bot_event);
    }

    _line_extract_message(bot_event){
        let message;
        switch(bot_event.type){
            case "message":
                message = bot_event.message;
            break;
            case "postback":
                message = bot_event.postback;
            break;
        }
        return message;
    }

    _facebook_extract_message(bot_event){
        let message;
        if (bot_event.message){
            message = bot_event.message;
        } else if (bot_event.postback){
            message = bot_event.postback;
        }
        return message;
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
    /*
    create_text_message(text_message){
        let message_to_compile = {
            type: "text",
            text: text_message
        }
        let compiled_message = this.compile_message(message_to_compile);
        return compiled_message;
    }
    */

    change_message_to_confirm(param_name, message){
        let param_index = this.context.to_confirm.findIndex(param => param.name === param_name);
        if (param_index === undefined){
            debug("The parameter to change message to confirm not found.");
            throw("The parameter to change message to confirm not found.");
        }
        this.context.to_confirm[param_index].message_to_confirm = message;
    }

    queue(messages){
        if (typeof this.context._message_queue == "undefined"){
            this.context._message_queue = [];
        }
        this.context._message_queue = this.context._message_queue.concat(messages);
    }

    reply(messages = null){
        if (messages){
            this.queue(messages);
        }
        let messages_compiled = [];
        for (let message of this.context._message_queue){
            messages_compiled.push(this.compile_message(message));
        }
        let compiled_messages;
        return Promise.all(messages_compiled).then(
            (response) => {
                compiled_messages = response;
                return this[`_${this.type}_reply`](this.bot_event, compiled_messages);
            }
        ).then(
            (response) => {
                for (let compiled_message of compiled_messages){
                    this.context.previous.message.unshift({
                        from: "bot",
                        message: compiled_message
                    });
                }
                this.context._message_queue = [];
                return response;
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
        if (messages){
            this.queue(messages);
        }
        let messages_compiled = [];
        for (let message of this.context._message_queue){
            messages_compiled.push(this.compile_message(message));
        }
        let compiled_messages;
        return Promise.all(messages_compiled).then(
            (response) => {
                compiled_messages = response;
                return this[`_${this.type}_send`](recipient_id, compiled_messages);
            }
        ).then(
            (response) => {
                for (let compiled_message of compiled_messages){
                    this.context.previous.message.unshift({
                        from: "bot",
                        message: compiled_message
                    });
                }
                this.context._message_queue = [];
                return response;
            }
        );
    }

    _line_send(recipient_id, messages){
        return this.service.send(recipient_id, messages);
    }

    _facebook_send(recipient_id, messages){
        return this.service.send(this.bot_event.recipient.id, {id: recipient_id}, messages);
    }

    // While collect method exists in flow, this method is for developers to explicitly collect a parameter.
    collect(arg){
        if (typeof arg == "string"){
            return this._collect_by_param_name(arg);
        } else if (typeof arg == "object"){
            return this._collect_by_param(arg);
        } else {
            throw("Invalid argument for vp.collect()");
        }
    }

    _collect_by_param_name(param_name){
        debug("Going to collect parameter. Message should be defined in skill.");

        let param_to_collect;
        if (!!this.skill.required_parameter && !!this.skill.required_parameter[param_name]){
            param_to_collect = {
                name: param_name,
                label: this.skill.required_parameter[param_name].label,
                message_to_confirm: this.skill.required_parameter[param_name].message_to_confirm,
                parser: this.skill.required_parameter[param_name].parser,
                reaction: this.skill.required_parameter[param_name].reaction
            }
        } else if (!!this.skill.optional_parameter && !!this.skill.optional_parameter[param_name]){
            param_to_collect = {
                name: param_name,
                label: this.skill.optional_parameter[param_name].label,
                message_to_confirm: this.skill.optional_parameter[param_name].message_to_confirm,
                parser: this.skill.optional_parameter[param_name].parser,
                reaction: this.skill.optional_parameter[param_name].reaction
            }
        } else {
            debug(`Spedified parameter not found in skill.`);
            throw(`Spedified parameter not found in skill.`);
        }

        if (this.context.confirmed[param_to_collect.name]){
            delete this.context.confirmed[param_to_collect.name];
        }

        let index_to_remove = this.context.to_confirm.findIndex(param => param.name === param_to_collect.name);
        if (index_to_remove !== -1){
            debug(`Removing ${param_to_collect.name} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We add optional parameter "${param_name}" to the top of to_confirm list.`);
        this.context.to_confirm.unshift(param_to_collect);
    }

    _collect_by_param(param){
        debug("Going to collect parameter. Message should be enveloped in the argument.");

        if (Object.keys(param).length != 1){
            throw("Malformed parameter.");
        }

        let param_to_collect = {
            name: Object.keys(param)[0],
            label: param[Object.keys(param)[0]].label,
            message_to_confirm: param[Object.keys(param)[0]].message_to_confirm,
            parser: param[Object.keys(param)[0]].parser,
            reaction: param[Object.keys(param)[0]].reaction
        }

        if (this.context.confirmed[param_to_collect.name]){
            delete this.context.confirmed[param_to_collect.name];
        }

        let index_to_remove = this.context.to_confirm.findIndex(param => param.name === param_to_collect.name);
        if (index_to_remove !== -1){
            debug(`Removing ${param_to_collect.name} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We add optional parameter "${param_to_collect.name}" to the top of to_confirm list.`);
        this.context.to_confirm.unshift(param_to_collect);
    }

    compile_message(message){
        let message_format = this._identify_message_format(message);
        debug(`Identified message format is ${message_format}.`);

        let compiled_message;
        if (this.type != message_format){
            debug(`Compiling message from ${message_format} to ${this.type}...`);
            compiled_message = this[`_${this.type}_compile_message_from_${message_format}_format`](message);
            debug(`Compiled message is following.`);
            debug(compiled_message);
        } else {
            compiled_message = message;
        }

        if (this.translater){
            let sender_language = this.context.sender_language;
            let bot_language = this.options.language;
            if (sender_language && (sender_language != bot_language)){
                debug(`Translating message...`);
                return this[`_${this.type}_translate_message`](compiled_message, sender_language);
            }
        }
        return Promise.resolve(compiled_message);
    }

    _line_translate_message(message, sender_language){
        let message_type = this._line_identify_message_type(message);
        switch(message_type){
            case "text": {
                return this.translater.translate(message.text, sender_language).then(
                    (response) => {
                        message.text = response[0];
                        debug("Translated message follows.");
                        debug(message);
                        return message;
                    }
                );
            }
            case "buttons_template": {
                return this.translater.translate([message.altText, message.template.text], sender_language).then(
                    (response) => {
                        debug(response);
                        message.altText = response[0];
                        message.template.text = response[1];
                        return message;
                    }
                );
            }
            case "confirm_template": {
                return this.translater.translate([message.altText, message.template.text], sender_language).then(
                    (response) => {
                        message.altText = response[0];
                        message.template.text = response[1];
                        return message;
                    }
                );
            }
            case "carousel_template": {
                return this.translater.translate(message.altText, sender_language).then(
                    (response) => {
                        message.altText = response[0];
                        return message;
                    }
                );
            }
            default: {
                return Promise.resolve(message);
            }
        }
    }

    _facebook_translate_message(message, sender_language){
        let message_type = this._facebook_identify_message_type(message);
        switch(message_type){
            case "text": {
                return this.translater.translate(message.text, sender_language).then(
                    (response) => {
                        message.text = response[0];
                        debug("Translated message follows.");
                        debug(message);
                        return message;
                    }
                );
            }
            default: {
                return Promise.resolve(message);
            }
        }
    }

    _identify_message_format(message){
        let message_format;
        if (!!message.type){
            message_format = "line";
        } else {
            let message_keys = Object.keys(message).sort();
            if (!!message.quick_replies || !!message.attachment || !!message.text){
                // Provider is facebook. Type is quick reply.
                message_format = "facebook";
            }
        }
        if (!message_format){
            // We could not identify the format of this message object.
            throw new Error(`We can not identify the format of this message object.`);
        }
        return message_format;
    }

    _line_identify_message_type(message){
        let message_type;
        if (["text", "image", "audio", "video", "file", "location", "sticker", "imagemap"].indexOf(message.type) !== -1){
            message_type = message.type;
        } else if (message.type == "template"){
            if (["buttons", "confirm", "carousel"].indexOf(message.template.type) !== -1){
                message_type = message.template.type + "_template";
            } else {
                // This is not LINE format.
                throw new Error("This is not correct LINE format.");
            }
        } else {
            // This is not LINE format.
            throw new Error("This is not correct LINE format.");
        }
        return message_type;
    }

    _facebook_identify_message_type(message){
        let message_type;
        if (message.text){
            // Type is text.
            message_type = "text";
        } else if (message.attachment){
            if (["image", "audio", "video", "file"].indexOf(message.attachment.type) !== -1){
                // Type is image, audio, video or file.
                message_type = message.attachment.type;
            } else if (message.attachment.type == "template"){
                if (["button", "generic", "list", "open_graph", "receipt", "airline_boardingpass", "airline_checkin", "airline_itinerary", "airline_update"].indexOf(message.attachment.payload.template_type) !== -1){
                    message_type = message.attachment.payload.template_type + "_template";
                }
            } else {
                // This is not Facebook format.
                throw new Error("This is not correct Facebook format.");
            }
        } else {
            // This is not Facebook format.
            throw new Error("This is not correct Facebook format.");
        }
        return message_type;
    }

    _line_compile_message_from_facebook_format(message){
        // LINE format has Text, Audio, File, Image, Video, Button Template, Confirm Template, Carousel Template, Location, Sticker and Imagemap.

        // ### Threshold for Text ###
        // -> text has to be up to 2000 chars.

        // ### Threshold for Button Template ###
        // -> altText has to be up to 400 chars.
        // -> title has to be up to 40 chars.
        // -> text has to be 160 chars. In case we have title or thumbnailImageUrl, it has to be up to 60 chars.
        // -> acitons has to be up to 4.
        // -> each button must follow button threshold.

        // ### Threshold for Confirm Template ###
        // -> altText has to be up to 400 chars.
        // -> text has to be 240 chars.
        // -> acitons has to be 2.
        // -> each button must follow button threshold.

        // ### Threshold for Carousel Template ###
        // -> altText has to be up to 400 chars.
        // -> columns has to be up to 5.
        // -> column title has to be up to 40 chars.
        // -> column text has to be up to 120 chars. In case we have title or thumbnailImageUrl, it has to be up to 60 chars.
        // -> acitons has to be 3.
        // -> each button must follow button threshold.

        // ### Compile Rule Overview ###
        // => text: to text
        // => audio: to audio
        // => image: to image
        // => video: to video
        // => file: to unsupported text
        // => button template: to button template
        // => generic tempalte: to carousel template
        // => list Template: to carousel template
        // => open graph template: to unsupported text
        // => receipt template: to unsupported text
        // => airline boarding ticket template: to unsupported text
        // => airline checkin template: to unsupported text
        // => airline itinerary tempalte: to unsupported text
        // => airline fight update template: to unsupported text

        let compiled_message;
        let message_type = this._facebook_identify_message_type(message);
        debug(`message type is ${message_type}`);

        switch(message_type){
            case "text":
                if (!message.quick_replies){
                    // This is the most pure text message.
                    compiled_message = {
                        type: "text",
                        text: message.text
                    }
                } else {
                    // If the number of quick replies is less than or equal to 4, we try to compile to button template. Otherwise, we just compile it to text message.
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
                        // Elements of quick reply is more the 4. It's not supported in LINE so we send just text.
                        debug("Quick replies were omitted since it exceeds max elements threshold.");
                        compiled_message = {
                            type: "text",
                            text: message.text
                        }
                    }
                }
                break;
            case "audio":
                // Not Supported since facebook does not have property corresponding to "duration".
                debug(`Compiling ${message_type} message from facebook format to line format is not supported since facebook does not have the property corresponding to "duration". Supported types are text(may includes quick replies), image and template.`);
                compiled_message = {
                    type: text,
                    text: `*Message type is audio and it was made in facebook format. It lacks required "duration" property so we could not compile.`
                }
                break;
            case "image":
                // Limited support since facebook does not have property corresponding to previewImageUrl.
                compiled_message = {
                    type: "image",
                    originalContentUrl: message.attachment.payload.url,
                    previewImageUrl: message.attachment.payload.url
                }
                if (message.quick_replies){
                    debug("Quick replies were omitted since it is not supported in LINE's image message.");
                }
                break;
            case "video":
                // Not supported since facebook does not have property corresponding to "previewImageUrl".
                debug(`Compiling ${message_type} message from facebook format to line format is not supported since facebook does not have property corresponding to "previewImageUrl". Supported types are text(may includes quick replies), image and template.`);
                compiled_message = {
                    type: text,
                    text: `*Message type is video and it was made in facebook format. It lacks required "previewImageUrl" property so we could not compile.`
                }
                if (message.quick_replies){
                    debug("Quick replies were omitted since it is not supported in LINE's video message.");
                }
                break;
            case "file":
                // Not supported since LINE has its original content storage.
                debug(`Compiling ${message_type} message from facebook format to line format is not supported since LINE has its original content storage.`);
                compiled_message = {
                    type: text,
                    text: `*Compiling ${message_type} message from facebook format to line format is not supported since LINE has its original content storage.`
                }
                break;
            case "button_template":
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
                            text: `*Compiling template messege including ${button.type} button from facebook format to line format is not supported since line does not have corresponding template.`
                        }
                        break;
                    }
                }
                break;
            case "generic_template": // -> to carousel template
                // Upper threshold of generic template elements is 10 and 5 in line. So we have to care about it.
                compiled_message = {
                    type: "template",
                    altText: "Carousel Template", // This is a dummy text since facebook does not have corresponiding property.
                    template: {
                        type: "carousel",
                        columns: []
                    }
                }
                if (message.attachment.payload.elements.length > 5){
                     compiled_message = {
                        type: "text",
                        text: `*Message type is facebook's generic template. It exceeds the LINE's max elements threshold of 5.`
                    }
                    break;
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
                            debug(`Compiling template messege including ${button.type} button from facebook format to line format is not supported since line does not have corresponding button.`);
                            return compiled_message = {
                                type: "text",
                                text: `*Compiling template messege including ${button.type} button from facebook format to line format is not supported since line does not have corresponding button.`
                            }
                        }
                    }
                    compiled_message.template.columns.push(column);
                }
                break;
            case "list_template": // -> to carousel template
                // Upper threshold of list template elements is 4 and 5 in line. This is safe.
                compiled_message = {
                    type: "template",
                    altText: "Carousel Template", // This is a dummy text since facebook does not have corresponiding property.
                    template: {
                        type: "carousel",
                        columns: []
                    }
                }
                if (message.attachment.payload.buttons){
                    debug(`Message type is facebook's list template. It has List button but LINE's carousel message does not support it`);
                    compiled_message = {
                       type: "text",
                       text: `*Message type is facebook's ${message_type}. It has List button but LINE's carousel message does not support it.`
                    }
                    break;
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
                            return compiled_message = {
                                type: "text",
                                text: `*Compiling template messege including ${button.type} button from facebook format to line format is not supported since line does not have corresponding template.`
                            }
                        }
                    }
                    compiled_message.template.columns.push(column);
                }
                break;
            case "open_graph":
                debug(`*Message type is facebook's ${message_type} and it is not supported in LINE.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is facebook's ${message_type} and it is not supported in LINE.`
                }
                break;
            case "airline_boardingpass":
                debug(`*Message type is facebook's ${message_type} and it is not supported in LINE.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is facebook's ${message_type} and it is not supported in LINE.`
                }
                break;
            case "airline_itinerary":
                debug(`*Message type is facebook's ${message_type} and it is not supported in LINE.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is facebook's ${message_type} and it is not supported in LINE.`
                }
                break;
            case "airline_update":
                debug(`*Message type is facebook's ${message_type} and it is not supported in LINE.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is facebook's ${message_type} and it is not supported in LINE.`
                }
                break;
            default:
                debug(`*Message type is facebook's ${message_type} and it is not supported in LINE.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is facebook's ${message_type} and it is not supported in LINE.`
                }
                break;
        }
        return compiled_message;
    }

    _facebook_compile_message_from_line_format(message){
        // Facebook format has Text, Audio, Image, Video, File, Button Template, Generic Template, List Template, Open Graph Template, Receipt Template, Airline Boarding Ticket Template, Airline Checkin Template, Airline Itinerary Tempalte, Airline Fight Update Template.
        // quick_replies may be included in any Content-Type.
        // buttons may be included in Templates.

        // ### Threshold for quick_replies
        // -> elements of quick_replies has to be up to 11.
        // -> title in each element has to be up to 20 chars.
        // -> payload in each element has to be 1000 chars.

        // ### Threshold for Text ###
        // -> text has to be up to 640 chars.

        // ### Threshold for Button Template ###
        // -> text has to be up to 640 chars.
        // -> buttons has to be up to 3.
        // -> each button must follow button threshold.

        // ### Threshold for Generic Template ###
        // -> elements has to be up to 10.
        // -> title in each elements has to be up to 80 chars.
        // -> subtitle in each elements has to be up to 80 chars.
        // -> buttons in each elements has to be up to 3.
        // -> each button must follow button threshold.

        // ### Threshold for List Template ###
        // -> elements has to be from 2 to 4.
        // -> global button has to be up to 1.
        // -> title in each elements has to be up to 80 chars.
        // -> subtitle in each elements has to be up to 80 chars.
        // -> button in each elements has to be up to 1.
        // -> each button must follow button threshold.

        // ### Compile Rule Overview
        // -> text: to text
        // -> image: to image
        // -> video: to video
        // -> audio: to audio
        // -> file: to unsupported text
        // -> location: to location *NEED TEST
        // -> sticker: to unsupported text
        // -> imagemap: to unsupported text
        // -> buttons template: to text(w quick reply) or button tempalte
        // -> confirm template: to text(w quick reply) or button template
        // -> carousel template: to generic template

        let compiled_message;
        let message_type = this._line_identify_message_type(message);
        debug(`message type is ${message_type}`);

        switch(message_type){
            case "text": {// -> to text
                compiled_message = {
                    text: message.text
                }
                break;
            }
            case "image": {// -> to image
                compiled_message = {
                    attachment: {
                        type: "image",
                        payload: {
                            url: message.originalContentUrl
                        }
                    }
                }
                break;
            }
            case "video": {// -> to video
                compiled_message = {
                    attachment: {
                        type: "video",
                        payload: {
                            url: message.originalContentUrl
                        }
                    }
                }
                break;
            }
            case "audio": {// -> to audio
                compiled_message = {
                    attachment: {
                        type: "audio",
                        payload: {
                            url: message.originalContentUrl
                        }
                    }
                }
                break;
            }
            case "file": {// -> unsupported text
                debug(`*Message type is LINE's ${message_type} and it is not supported in Facebook.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is LINE's ${message_type} and it is not supported in Facebook.`
                }
                break;
            }
            case "location": {// to location *NEED TEST
                compiled_message = {
                    attachment: {
                        type: "location",
                        title: message.title,
                        payload: {
                            coordinates: {
                                lat: message.latitude,
                                long: message.longitude
                            }
                        }

                    }
                }
                break;
            }
            case "sticker": {// -> to unsupported text
                debug(`*Message type is LINE's ${message_type} and it is not supported in Facebook.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is LINE's ${message_type} and it is not supported in Facebook.`
                }
                break;
            }
            case "imagemap": {// -> to unsupported text
                debug(`*Message type is LINE's ${message_type} and it is not supported in Facebook.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is LINE's ${message_type} and it is not supported in Facebook.`
                }
                break;
            }
            case "buttons_template": {// -> to text(w quick reply) or button tempalte
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
                            text: message.altText + " *Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message."
                        }
                        break;
                    }
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
                break;
            }
            case "confirm_template": {// -> to text(w quick reply) or button tempalte
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
                            text: message.altText + " *Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message."
                        }
                        break;
                    }
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
                break;
            }
            case "carousel_template": {// -> generic template
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
                                text: message.altText + " *Compiling template messege including more than 3 buttons including uri button from line format to facebook format is not supported."
                            }
                            break;
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
                }
                break;
            }
            default: {
                debug(`Message type is LINE's ${message_type} and it is not supported in Facebook.`);
                compiled_message = {
                   type: "text",
                   text: `*Message type is LINE's ${message_type} and it is not supported in Facebook.`
                }
                break;
            }
        }
        return compiled_message
    }
}
