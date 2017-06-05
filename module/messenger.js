'use strict';

let Line = require("./messenger/line");
let Facebook = require("./messenger/facebook");
let debug = require("debug")("bot-express:messenger");
let google_translate = require('@google-cloud/translate');
let fs = require("fs");

module.exports = class Messenger {
    constructor(options, bot_event){
        this.type = options.message_platform_type;
        this.options = options;
        this.Messenger_classes = {};
        this.context = null; // Will be set later in webhook
        this.bot_event = bot_event;
        this.skill = null; // Will be set in flow constructor

        let messenger_scripts = fs.readdirSync(__dirname + "/messenger");
        for (let messenger_script of messenger_scripts){
            debug("Loading " + messenger_script + "...");
            messenger_script = messenger_script.replace(".js", "");
            this.Messenger_classes[messenger_script] = require("./messenger/" + messenger_script);
        }
        this.service = new this.Messenger_classes[this.type](options);

        // Instantiates a translater
        if (this.options.google_project_id && this.options.google_application_credentials && this.options.auto_translation == "enable"){
            this.translater = google_translate({
                projectId: this.options.google_project_id
            });
        }
    }

    validate_signature(req){
        return this.service.validate_signature(req);
    }

    extract_events(body){
        return this.Messenger_classes[this.type].extract_events(body);
    }

    extract_event_type(){
        return this.Messenger_classes[this.type].extract_event_type(this.bot_event);
    }

    extract_beacon_event_type(){
        return this.Messenger_classes[this.type].extract_beacon_event_type(this.bot_event);
    }

    extract_sender_id(){
        return this.Messenger_classes[this.type].extract_sender_id(this.bot_event);
    }

    extract_param_value(){
        return this.Messenger_classes[this.type].extract_param_value(this.bot_event);
    }

    extract_message(){
        return this.Messenger_classes[this.type].extract_message(this.bot_event);
    }

    extract_message_text(){
        return this.Messenger_classes[this.type].extract_message_text(this.bot_event);
    }

    check_supported_event_type(flow){
        return this.Messenger_classes[this.type].check_supported_event_type(flow, this.bot_event);
    }

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
                return this.service.reply(this.bot_event, compiled_messages);
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

    send(recipient_id, messages){
        let messages_compiled = [];
        for (let message of messages){
            messages_compiled.push(this.compile_message(message));
        }
        let compiled_messages;
        return Promise.all(messages_compiled).then(
            (response) => {
                compiled_messages = response;
                return this.service.send(this.bot_event, recipient_id, compiled_messages);
            }
        ).then(
            (response) => {
                for (let compiled_message of compiled_messages){
                    this.context.previous.message.unshift({
                        from: "bot",
                        message: compiled_message
                    });
                }
                return response;
            }
        );
    }

    // While collect method exists in flow, this method is for developers to explicitly collect a parameter.
    collect(arg){
        if (typeof arg == "string"){
            return this._collect_by_param_name(arg);
        } else if (typeof arg == "object"){
            return this._collect_by_param(arg);
        } else {
            throw("Invalid argument for messenger.collect()");
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

            // Identify message type.
            let message_type = this.Messenger_classes[message_format].identify_message_type(message);
            debug(`message type is ${message_type}`);

            // Compile message
            compiled_message = this.Messenger_classes[this.type].compile_message(message_format, message_type, message);
            debug(`Compiled message is following.`);
            debug(compiled_message);
        } else {
            compiled_message = JSON.parse(JSON.stringify(message));
        }

        if (this.translater){
            let sender_language = this.context.sender_language;
            let bot_language = this.options.nlp_options.language;
            if (sender_language && (sender_language != bot_language)){
                debug(`Translating following message...`);
                debug(compiled_message);

                let message_type = this.Messenger_classes[this.type].identify_message_type(compiled_message);
                return this.Messenger_classes[this.type].translate_message(this.translater, message_type, compiled_message, sender_language);
            }
        }
        return Promise.resolve(compiled_message);
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

}
