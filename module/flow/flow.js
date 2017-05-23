'use strict';

let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let ParseError = require("../error/parse");
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
            skill_instance = new skill_class(this.vp, this.bot_event);
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
            skill_instance = new skill_class(this.vp, this.bot_event);
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
        return this.apply_parameter(key, value, true);
    }

    apply_parameter(key, value, is_change = false){
        debug(`Applying parameter.`);

        let parameter_type = this._check_parameter_type(key);
        if (parameter_type == "not_applicable"){
            debug("This is not the parameter we should care about. We just skip this.");
            return Promise.resolve();
        }
        debug(`The parameter is ${parameter_type}`);

        return this._parse_parameter(parameter_type, key, value).then(
            (parsed_value) => {
                debug(`Parsed value is ${parsed_value}`);
                this._add_parameter(key, parsed_value, is_change);
                debug(`apply_parameter succeeded. We have now ${this.context.to_confirm.length} parameters to confirm.`);
                return {
                    key: key,
                    value: parsed_value
                }
            }
        );
    }

    _check_parameter_type(key){
        if (!!this.skill.required_parameter && !!this.skill.required_parameter[key]){
            return "required_parameter";
        } else if (!!this.skill.optional_parameter && !!this.skill.optional_parameter[key]){
            return "optional_parameter";
        }
        return "not_applicable";
    }

    _parse_parameter(type, key, value){
        return new Promise((resolve, reject) => {
            debug(`Parsing parameter {${key}: "${value}"}`);

            // We define new reject just for parse.
            let parse_reject = (message) => {
                reject(new ParseError(message));
            }

            if (!!this.skill[type][key].parser){
                debug("Parse method found in parameter definition.");
                return this.skill[type][key].parser(value, resolve, parse_reject);
            } else if (!!this.skill["parse_" + key]){
                debug("Parse method found in default parser function name.");
                return this.skill["parse_" + key](value, resolve, parse_reject);
            } else {
                debug("Parse method NOT found. We use the value as it is as long as the value is set.");
                if (value === null || value.trim() === ""){
                    return parse_reject("Value not set");
                } else {
                    return resolve(value);
                }
            }
        });
    }

    _add_parameter(key, value, is_change = false){
        debug(`Adding parameter {${key}: "${value}"}`);

        // Add the parameter to "confirmed".
        let param = {};
        param[key] = value;
        Object.assign(this.context.confirmed, param); // TBD: Can't we change this to just assigning property?

        // At the same time, add the parameter key to previously confirmed list. The order of this list is newest first.
        if (!is_change){
            this.context.previous.confirmed.unshift(key);
        }

        // Remove item from to_confirm.
        let index_to_remove = this.context.to_confirm.findIndex(param => param.name === key);
        if (index_to_remove !== -1){
            debug(`Removing ${key} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        // Clear confirming.
        if (this.context.confirming == key){
            debug(`Clearing confirming.`);
            this.context.confirming = null;
        }
    }

    react(error, key, value){
        return new Promise((resolve, reject) => {
            if (this.skill.required_parameter && this.skill.required_parameter[key]){
                if (!!this.skill.required_parameter[key].reaction){
                    // This parameter has reaction. So do it and return its promise.
                    debug(`Perform reaction for required parameter ${key}`);
                    return this.skill.required_parameter[key].reaction(error, value, this.context, resolve, reject);
                } else if (!!this.skill["reaction_" + key]){
                    // This parameter has reaction. So do it and return its promise.
                    debug(`Perform reaction for required parameter ${key}`);
                    return this.skill["reaction_" + key](error, value, this.context, resolve, reject);
                } else {
                    // This parameter does not have reaction so do nothing.
                    debug(`Reaction is not set for required parameter ${key}.`);
                    return resolve();
                }
            } else if (this.skill.optional_parameter && this.skill.optional_parameter[key]){
                if (!!this.skill.optional_parameter[key].reaction){
                    // This parameter has reaction. So do it and return its promise.
                    debug(`Perform reaction for optional parameter ${key}`);
                    return this.skill.optional_parameter[key].reaction(error, value, this.context, resolve, reject);
                } else if (!!this.skill["reaction_" + key]){
                    // This parameter has reaction. So do it and return its promise.
                    debug(`Perform reaction for optional parameter ${key}`);
                    return this.skill["reaction_" + key](error, value, this.context, resolve, reject);
                } else {
                    // This parameter does not have reaction so do nothing.
                    debug(`Reaction is not set for optional parameter ${key}.`);
                    return resolve();
                }
            } else {
                return resolve(`There is no parameter we should care about. So skip reaction.`);
            }
        });
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
            }
        );
    }
};
