"use strict";

/**
* Toolkit to be used by skill.
* @class
*/
module.exports = class Bot {
    /**
    * @constructs
    */
    constructor(messenger){
        this.type = messenger.type;
        this._messenger = messenger;
    }

    /**
    * Reply message to sender. This function can be called just once in a flow. To send multiple messages, give multiple messages to this function or use queue(MESSAGES) function instead.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to reply.
    * @returns {Promise.<Response>} - Returns promise returning response from Messenger API.
    */
    reply(messages){
        return this._messenger.reply(messages);
    }

    /**
    * Send(Push) message to specified user.
    * @param {String} recipient_id - Recipient user id.
    * @param {MessageObject|Array.<MessageObject>} messages - Messages object[s] to send.
    * @returns {Promise.<Response>} - Returns promise returning response from Messenger API.
    */
    send(recipient_id, messages){
        return this._messenger.send(recipient_id, messages);
    }

    /**
    * Send(Push) messages to multiple users.
    * @param {Array.<String>} recipient_ids - Array of recipent user id.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to send.
    * @returns {Promise.<Response>} - Returns promise returning response from Messenger API.
    */
    muticast(recipient_ids, messages){
        return this._messenger.multicast(recipient_ids, messages);
    }

    /**
    * Queue messages. The messages will be sent out when reply(MESSAGES) function is called.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to queue.
    * @returns {Null}
    */
    queue(messages){
        return this._messenger.queue(messages);
    }

    /**
    * Make the specified skill paramter being collected next.
    * @param {String|SkillParameterObject} arg - Name of the skill parameter or complete skill parameter object to collect.
    * @returns {Null}
    */
    collect(arg){
        return this._messenger.collect(arg);
    }

    /**
    * Change the message to collect specified parameter.
    * @param {String} parameter_name - Name of the parameter to collect.
    * @param {MessageObject} message - Message object to send.
    * @returns {Null}
    */
    change_message_to_confirm(parameter_name, message){
        return this._messenger.collect(parameter_name, message);
    }

    /**
    * Extract message of the event.
    * @param {EventObject} event - Event to extract message.
    * @returns {MessageObject} - Extracted message.
    */
    extract_message(event){
        return this._messenger.extract_message(event);
    }

    /**
    * Extract message text.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted message text.
    */
    extract_message_text(event){
        return this._messenger.extract_message_text(event);
    }

    /**
    * Extract sender's user id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted sender's user id.
    */
    extract_sender_id(event){
        return this._messenger.extract_sender_id(event);
    }

    /**
    * Identify the event type.
    * @param {EventObject} event - Event to identify event type.
    * @returns {String} - Event type.
    */
    identify_event_type(event){
        return this._messenger.identify_event_type(event);
    }

    /**
    * Identify the message type.
    * @param {MessageObject} message - Message Object to identify message type.
    * @returns {String} - Message type. In case of LINE, it can be "text", "image", "audio", "video", "file", "location", "sticker", "imagemap", "buttons_template, "confirm_template" or "carousel_template". In case of Facebook, it can be "image", "audio", "video", "file", "button_template", "generic_template", "list_template", "open_graph_template", "receipt_template", "airline_boardingpass_template", "airline_checkin_template", "airline_itinerary_template", "airline_update_template".
    */
    identify_message_type(message){
        return this._messenger.identify_message_type(message);
    }
}
