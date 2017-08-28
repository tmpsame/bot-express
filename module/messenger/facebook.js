'use strict';

let Promise = require('bluebird');
let request = require('request');
let crypto = require('crypto');
let debug = require("debug")("bot-express:messenger");

Promise.promisifyAll(request);

module.exports = class MessengerFacebook {

    constructor(options){
        this._app_secret = options.facebook_app_secret;
        this._page_access_token = options.facebook_page_access_token;
    }

    send(event, to, messages){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        let page_id = event.recipient.id
        let recipient = {id: to};

        debug(`page_id is ${page_id}. page_access_token is ${this._page_access_token}`);
        
        let page_access_token = this._page_access_token.find(token => token.page_id === page_id).page_access_token;
        if (!page_access_token){
            return Promise.reject(new Error("page access token not found."));
        }
        debug(`page_id is ${page_id}. Corresponding page_access_token is ${page_access_token}`);

        let all_sent = [];
        let interval = 0;
        let offset = 0;

        let url = "https://graph.facebook.com/v2.8/me/messages?access_token=" + page_access_token;

        // If we have more then 1 message, we set 2000 msec interval to assure the message order.
        for (let message of messages){

            let body = {
                recipient: recipient,
                message: message
            }

            if (offset > 0 && interval == 0){
                interval = 2000;
            }
            offset += 1;

            setTimeout(() => {
                all_sent.push(request.postAsync({
                    url: url,
                    body: body,
                    json: true
                }).then(
                    (response) => {
                        if (response.statusCode != 200){
                            debug("facebook.send() failed.");
                            if (response.body && response.body.error && response.body.error.message){
                                return Promise.reject(new Error(response.body.error.message));
                            } else if (response.statusMessage){
                                return Promise.reject(new Error(response.statusMessage));
                            }
                        }
                        return response;
                    }
                ));
            }, interval);
        }

        return Promise.all(all_sent).then(
            (response) => {
                return response;
            }
        )
    }

    reply(event, messages){
        return this.send(event, event.sender.id, messages);
    }

    validate_signature(req){
        // If this is test, we will not actually validate the signature.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip validating signature.");
            return true;
        }

        let signature = req.get('X-Hub-Signature');
        let raw_body = req.raw_body;

        // Signature Validation
        let hash = "sha1=" + crypto.createHmac("sha1", this._app_secret).update(raw_body).digest("hex");
        if (hash != signature) {
            return false;
        }
        return true;
    }

    static extract_events(body){
        let events = [];
        for (let entry of body.entry){
            events = events.concat(entry.messaging);
        }
        return events;
    }

    static identify_event_type(event){
        let event_type;
        if (event.message){
            if (event.message.is_echo){
                event_type = "echo";
            } else {
                event_type = "message";
            }
        } else if (event.delivery){
            event_type = "delivery";
        } else if (event.read){
            event_type = "read";
        } else if (event.postback){
            event_type = "postback;"
        } else if (event.optin){
            event_type = "optin";
        } else if (event.referral){
            event_type = "referral";
        } else if (event.account_linking){
            event_type = "account_linking";
        }
        return event_type;
    }

    static extract_beacon_event_type(event){
        let beacon_event_type = false;
        return beacon_event_type;
    }

    static extract_sender_id(event){
        return event.sender.id;
    }


    static extract_param_value(event){
        let param_value;
        if (event.message){
            if (event.message.quick_reply){
                // This is Quick Reply
                param_value = event.message.quick_reply.payload;
            } else if (event.message.text){
                // This is Text Message
                param_value = event.message.text;
            } else if (event.message.attachments){
                // This is Attachemnt
                param_value = event.message;
            }
        } else if (event.postback){
            // This is Postback
            param_value = event.postback.payload;
        }
        return param_value;
    }

    static extract_message(event){
        let message;
        if (event.message){
            message = event.message;
        } else if (event.postback){
            message = event.postback;
        }
        return message;
    }

    static extract_message_text(event){
        let message_text;
        if (event.message){
            if (event.message.quick_reply){
                // This is Quick Reply
                message_text = event.message.quick_reply.payload;
            } else if (event.message.text){
                // This is Text Message
                message_text = event.message.text;
            }
        } else if (event.postback){
            // This is Postback
            message_text = event.postback.payload;
        }
        return message_text;
    }

    static check_supported_event_type(flow, event){
        switch(flow){
            case "beacon":
                return false;
            break;
            case "start_conversation":
                if ((event.message && event.message.text) || event.postback){
                    return true;
                }
                return false;
            break;
            case "reply":
                if (event.message || event.postback){
                    return true;
                }
                return false;
            break;
            case "btw":
                if (event.message || event.postback){
                    return true;
                }
                return false;
            break;
            default:
                return false;
            break;
        }
    }

    static identify_message_type(message){
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

    static compile_message(message_format, message_type, message){
        debug("This is debug log before call compile_msg_from." + message_format);
        return MessengerFacebook[`_compile_message_from_${message_format}_format`](message_type, message);
    }

    static _compile_message_from_line_format(message_type, message){
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
                        } else if (action.type == "postback"){
                            compiled_message.attachment.payload.buttons.push({
                                type: "postback",
                                title: action.label,
                                payload: action.data
                            });
                        } else if (action.type == "message"){
                            compiled_message.attachment.payload.buttons.push({
                                type: "postback",
                                title: action.label,
                                payload: action.text
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
                        } else if (action.type == "location"){
                            compiled_message.quick_replies.push({
                                content_type: "location"
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

    static translate_message(translater, message_type, message, sender_language){
        switch(message_type){
            case "text": {
                let source_texts = [message.text];
                if (message.quick_replies){
                    for (let quick_reply of message.quick_replies){
                        if (quick_reply.content_type == "text"){
                            source_texts.push(quick_reply.title);
                            source_texts.push(quick_reply.payload);
                        }
                    }
                }
                return translater.translate(source_texts, sender_language).then(
                    (response) => {
                        if (source_texts.length == 1){
                            message.text = response[0];
                        } else {
                            message.text = response[0][0];

                            let offset = 1;
                            if (message.quick_replies){
                                for (let quick_reply of message.quick_replies){
                                    if (quick_reply.content_type == "text"){
                                        quick_reply.title = response[0][offset];
                                        offset++;
                                        quick_reply.payload = response[0][offset];
                                        offset++;
                                    }
                                }
                            }
                        }
                        debug("Translated message follows.");
                        debug(message);
                        return message;
                    }
                );
                break;
            }
            case "button_template":{
                let source_texts = [message.attachment.payload.text];
                for (let button of message.attachment.payload.buttons){
                    if (button.type == "web_url" || button.type == "postback" || button.type == "phone_number" || button.type == "payment"){
                        source_texts.push(button.title);
                    }
                }
                return translater.translate(source_texts, sender_language).then(
                    (response) => {
                        message.attachment.payload.text = response[0][0];
                        let offset = 1;
                        for (let button of message.attachment.payload.buttons){
                            if (button.type == "web_url" || button.type == "postback" || button.type == "phone_number" || button.type == "payment"){
                                button.title = response[0][offset];
                                offset++;
                            }
                        }
                        debug("Translated message follows.");
                        debug(message);
                        return message;
                    }
                );
                break;
            }
            case "generic_template":
            case "list_template": {
                let source_texts = [];
                for (let element of message.attachment.payload.elements){
                    source_texts.push(element.title);
                    if (element.subtitle) source_texts.push(element.subtitle);
                    for (let button of element.buttons){
                        if (button.type == "web_url" || button.type == "postback" || button.type == "phone_number" || button.type == "payment"){
                            source_texts.push(button.title);
                        }
                    }
                }
                return translater.translate(source_texts, sender_language).then(
                    (response) => {
                        let offset = 0;
                        for (let element of message.attachment.payload.elements){
                            element.title = response[0][offset];
                            offset++;
                            if (element.subtitle){
                                element.subtitle = response[0][offset];
                                offset++;
                            }
                            for (let button of element.buttons){
                                if (button.type == "web_url" || button.type == "postback" || button.type == "phone_number" || button.type == "payment"){
                                    button.title = response[0][offset];
                                    offset++;
                                }
                            }
                        }
                        debug("Translated message follows.");
                        debug(message);
                        return message;
                    }
                );
                break;
            }
            default: {
                return Promise.resolve(message);
                break;
            }
        }
    }
};
