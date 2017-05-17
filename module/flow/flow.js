'use strict';

let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let apiai = require('apiai');

module.exports = class Flow {
    constructor(vp, bot_event, context, options){
        this.vp = vp;
        this.bot_event = bot_event;
        this.context = context;
        this.default_intent = options.default_intent;
        this.default_skill = options.default_skill;
        this.skill_path = options.skill_path;
        this.skill = this._instantiate_skill(this.context.intent.action);
        this.vp.skill = this.skill;

        if (!!this.skill.required_parameter && typeof this.skill.required_parameter == "object"){
            debug(`This skill requires ${Object.keys(this.skill.required_parameter).length} parameters.`);
        } else {
            debug(`This skill requires 0 parameters.`);
        }

        // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
        // After that, we depend on context.to_confirm to identify to_confirm parameters.
        if (this.context.to_confirm.length == 0){
            this.context.to_confirm = this._identify_to_confirm_parameter(this.skill.required_parameter, this.context.confirmed);
        }
        debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);

        this.context.previous.message.unshift({
            from: "user",
            message: vp.extract_message()
        });
    }

    _instantiate_skill(intent){
        if (!intent){
            debug("Intent should have been set but not.");
            return;
        }

        let skill;
        // If the intent is not identified, we use default_skill.
        if (intent == this.default_intent){
            skill = this.default_skill;
        } else {
            skill = intent;
        }

        let skill_instance;

        if (skill == "builtin_default"){
            debug("Use built-in default skill.");
            let skill_class = require("../skill/default");
            skill_instance = new skill_class();
        } else {
            debug(`Look for ${skill} skill.`);
            let skill_class;
            try {
                skill_class = require(`${this.skill_path}${skill}`);
                debug("Skill found.")
            } catch(exception){
                debug("Skill not found.");
                throw(exception);
            }
            skill_instance = new skill_class();
        }

        return skill_instance;
    }

    _identify_to_confirm_parameter(required_parameter, confirmed){
        let to_confirm = [];

        // If there is no required_parameter, we just return empty object as confirmed.
        if (!required_parameter){
            return to_confirm;
        }

        // Scan confirmed parameters and if missing required parameters found, we add them to to_confirm.
        for (let req_param_key of Object.keys(required_parameter)){
            if (typeof confirmed[req_param_key] == "undefined"){
                to_confirm.push({
                    name: req_param_key,
                    label: required_parameter[req_param_key].label,
                    message_to_confirm: required_parameter[req_param_key].message_to_confirm,
                    parser: required_parameter[req_param_key].parser,
                    reaction: required_parameter[req_param_key].reaction
                });
            }
        }
        return to_confirm;
    }

    _collect(){
        if (this.context.to_confirm.length == 0){
            debug("While collect() is called, there is no parameter to confirm.");
            return Promise.reject();
        }
        let message;

        if (!!this.context.to_confirm[0].message_to_confirm[this.vp.type]){
            // Found message platform specific message object.
            debug("Found message platform specific message object.");
            message = this.context.to_confirm[0].message_to_confirm[this.vp.type];
        } else if (!!this.context.to_confirm[0].message_to_confirm){
            // Found common message object. We compile this message object to get message platform specific message object.
            debug("Found common message object.");
            message = this.context.to_confirm[0].message_to_confirm;
        } else {
            debug("While we need to send a message to confirm parameter, the message not found.");
            return Promise.reject();
        }
        debug(message);

        // Set confirming.
        this.context.confirming = this.context.to_confirm[0].name;

        // Send question to the user.
        return this.vp.reply([message]);
    }

    change_parameter(key, value){
        return this.add_parameter(key, value, true);
    }

    add_parameter(key, value, is_change = false){
        return new Promise((resolve, reject) => {
            debug(`Parsing parameter {${key}: "${value}"}`);

            let value_parsed;

            // Parse the value. If the value is not suitable for this key, exception will be thrown.
            if (!!this.skill.required_parameter && !!this.skill.required_parameter[key]){
                debug("This value is for required parameter.");

                if (!!this.skill.required_parameter[key].parser){
                    debug("parse method found.");
                    value_parsed = new Promise((resolve, reject) => {
                        this.skill.required_parameter[key].parser(value, resolve, reject);
                    });
                } else if (!!this.skill["parse_" + key]){
                    debug("parse method found.");
                    value_parsed = new Promise((resolve, reject) => {
                        this.skill["parse_" + key](value, resolve, reject);
                    });
                } else {
                    debug("parse method not found. We use the value as is as long as the value is set.");
                    // If parse method is not implemented, we use the value as-is.
                    if (value === null || value == ""){
                        value_parsed = Promise.reject();
                    } else {
                        value_parsed = Promise.resolve(value);
                    }
                }
            } else if (!!this.skill.optional_parameter && !!this.skill.optional_parameter[key]){
                debug("This value is for optional parameter.");
                if (!!this.skill.optional_parameter[key].parser){
                    debug("parse method found.");
                    value_parsed = new Promise((resolve, reject) => {
                        this.skill.optional_parameter[key].parser(value, resolve, reject);
                    });
                } else if (!!this.skill["parse_" + key]){
                    value_parsed = new Promise((resolve, reject) => {
                        this.skill["parse_" + key](value, resolve, reject);
                    });
                } else {
                    debug("parse method not found. We use the value as is as long as the value is set.");
                    // If parse method is not implemented, we use the value as-is.
                    if (value === null || value == ""){
                        value_parsed = Promise.reject();
                    } else {
                        value_parsed = Promise.resolve(value);
                    }
                }
            } else {
                // This is not the parameter we care about. So skip it.
                debug("This is not the parameter we care about.");
                return reject("This is not the parameter we care about.");
            }

            return value_parsed.then(
                (response) => {
                    debug(`Parse succeeded. Going to add parameter {${key}: "${response}"}`);

                    let parsed_value = response;

                    // Add the parameter to "confirmed".
                    let param = {};
                    param[key] = parsed_value;
                    Object.assign(this.context.confirmed, param);

                    // At the same time, add the parameter key to previously confirmed list. The order of this list is newest first.
                    if (!is_change){
                        this.context.previous.confirmed.unshift(key);
                    }

                    // Remove item from to_confirm.
                    let index_to_remove = this.context.to_confirm.findIndex(param => param.name === key);
                    if (index_to_remove !== -1){
                        debug(`Removing ${param.name} from to_confirm.`);
                        this.context.to_confirm.splice(index_to_remove, 1);
                    }

                    // Clear confirming.
                    if (this.context.confirming == key){
                        this.context.confirming = null;
                    }

                    debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);
                    return resolve(param);
                },
                (response) => {
                    // This means user defined skill says this value does not fit to this parameter.
                    debug("Rejected: The value does not fit to this parameter.");
                    return reject("The value does not fit to this parameter.");
                }
            ).catch(
                (exception) => {
                    throw(exception);
                }
            );
        });
    }

    react(parse_result, key, value){
        if (this.skill.required_parameter && this.skill.required_parameter[key]){
            if (!!this.skill.required_parameter[key].reaction){
                // This parameter has reaction. So do it and return its promise.
                debug(`Perform reaction. Param value is ${value}`);
                return this.skill.required_parameter[key].reaction(parse_result, value, this.vp);
            } else if (!!this.skill["reaction_" + key]){
                // This parameter has reaction. So do it and return its promise.
                debug(`Perform reaction. Param value is ${value}`);
                return this.skill["reaction_" + key](parse_result, value, this.vp);
            } else {
                // This parameter does not have reaction so do nothing.
                debug(`We have no reaction to perform.`);
                return Promise.resolve();
            }
        } else if (this.skill.optional_parameter && this.skill.optional_parameter[key]){
            if (!!this.skill.optional_parameter[key].reaction){
                // This parameter has reaction. So do it and return its promise.
                debug(`Perform reaction. Param value is ${value}`);
                return this.skill.optional_parameter[key].reaction(parse_result, value, this.vp);
            } else if (!!this.skill["reaction_" + key]){
                // This parameter has reaction. So do it and return its promise.
                debug(`Perform reaction. Param value is ${value}`);
                return this.skill["reaction_" + key](parse_result, value, this.vp);
            } else {
                // This parameter does not have reaction so do nothing.
                debug(`We have no reaction to perform.`);
                return Promise.resolve();
            }
        }
    }

    ask_retry(message_text){
        let messages = [this.vp.create_text_message(message_text)];
        return this.vp.reply(messages);
    }

    finish(){
        // If we still have parameters to confirm, we collect them.
        if (this.context.to_confirm.length > 0){
            debug("Going to collect parameter.");
            return this._collect();
        }

        // If we have no parameters to confirm, we finish this conversation using finish method of skill.
        debug("Going to perform final action.");
        let finished = new Promise((resolve, reject) => {
            this.skill.finish(this.vp, this.bot_event, this.context, resolve, reject);
        });

        return finished.then(
            (response) => {
                debug("Final action succeeded.");
                // Double check if we have no parameters to confirm since developers can execute collect() method inside finsh().
                if (this.context.to_confirm.length > 0){
                    debug("Going to collect parameter.");
                    return this._collect();
                }

                debug("Final action done. Wrapping up.");
                if (this.skill.clear_context_on_finish && this.context.to_confirm.length == 0){
                    debug(`Clearing context.`);
                    this.context = null;
                }
                return response;
            },
            (response) => {
                debug("Final action failed.");
                return Promise.reject(response);
            }
        ).catch(
            (exception) => {
                throw(exception);
            }
        );
    }
};
