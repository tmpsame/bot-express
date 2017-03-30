'use strict';

let Promise = require('bluebird');
let debug = require("debug")("flow");
let apiai = require('apiai');

module.exports = class Flow {
    constructor(vp, bot_event, context, options){
        this.vp = vp;
        this.bot_event = bot_event;
        this.context = context;
        this.skill_path = options.skill_path;
        this.default_skill = options.default_skill;
        this.default_intent = options.default_intent;
        this.skill = this._instantiate_skill(this.context.intent.action);

        if (!!this.skill.required_parameter && typeof this.skill.required_parameter == "object"){
            debug(`This skill requires ${Object.keys(this.skill.required_parameter).length} parameters.`);
        } else {
            debug(`This skill requires 0 parameters.`);
        }
        this.context.to_confirm = this._identify_to_confirm_parameter(this.skill.required_parameter, this.context.confirmed);

        debug(`We have ${Object.keys(this.context.to_confirm).length} parameters to confirm.`);
    }

    _instantiate_skill(intent){
        if (!intent){
            debug("Intent should have been set but not.");
            return;
        }

        let skill;
        // If the intent is not identified, we use default_skill.
        if (intent == this.default_intent){
            skill = this.default_skill || "builtin_default";
        } else {
            skill = intent;
        }

        let skill_instance;
        try {
            if (skill == "builtin_default"){
                debug("Use built-in default skill.");
                let skill_class = require("../skill/default");
                skill_instance = new skill_class();
            } else {
                debug(`Use ${skill} skill.`);
                let skill_class = require(`${this.skill_path}${skill}`);
                skill_instance = new skill_class();
            }
        } catch (err){
            debug(`Cannnot import ${this.skill_path}${skill}`);
            debug(err);
            throw(err);
        }
        return skill_instance;
    }

    _identify_to_confirm_parameter(required_parameter, confirmed){
        let to_confirm = {};

        // If there is no required_parameter, we just return empty object as confirmed.
        if (!required_parameter){
            return to_confirm;
        }

        // Scan confirmed parameters and if missing required parameters found, we add them to to_confirm.
        for (let req_param_key of Object.keys(required_parameter)){
            if (typeof confirmed[req_param_key] == "undefined"){
                to_confirm[req_param_key] = required_parameter[req_param_key];
            }
        }
        return to_confirm;
    }

    _collect(){
        if (Object.keys(this.context.to_confirm).length == 0){
            debug("While collect() is called, there is no parameter to confirm.");
            return Promise.reject();
        }
        if (!this.context.to_confirm[Object.keys(this.context.to_confirm)[0]].message_to_confirm[this.vp.type]){
            debug("While we need to send a message to confirm parameter, the message not found.");
            return Promise.reject();
        }
        let messages = [this.context.to_confirm[Object.keys(this.context.to_confirm)[0]].message_to_confirm[this.vp.type]];

        // Set confirming.
        this.context.confirming = Object.keys(this.context.to_confirm)[0];

        // Send question to the user.
        return this.vp.reply(this.bot_event, messages);
    }

    change_parameter(key, value){
        this.add_parameter(key, value, true);
    }

    add_parameter(key, value, is_change = false){
        debug(`Parsing parameter {${key}: "${value}"}`);

        let parsed_value;

        // Parse the value. If the value is not suitable for this key, exception will be thrown.
        if (this.skill.required_parameter[key]){
            if (!!this.skill.required_parameter[key].parse){
                parsed_value = this.skill.required_parameter[key].parse(value);
            } else if (!!this.skill["parse_" + key]){
                parsed_value = this.skill["parse_" + key](value);
            } else {
                // If parse method is not implemented, we use the value as-is.
                if (value === null || value == ""){
                    parsed_value = false;
                } else {
                    parsed_value = value;
                }
            }
        } else if (this.skill.optional_parameter[key]){
            if (!!this.skill.optional_parameter[key].parse){
                parsed_value = this.skill.optional_parameter[key].parse(value);
            } else if (!!this.skill["parse_" + key]){
                parsed_value = this.skill["parse_" + key](value);
            } else {
                // If parse method is not implemented, we use the value as-is.
                if (value === null || value == ""){
                    parsed_value = false;
                } else {
                    parsed_value = value;
                }
            }
        } else {
            // This is not the parameter we care about. So skip it.
            debug("This is not the parameter we care about.");
            throw("This is not the parameter we care about.");
        }

        if (parsed_value === false){
            // This means user defined skill says this value does not fit to this parameter.
            throw(`The value does not fit to this parameter.`);
        }

        debug(`Adding parameter {${key}: "${parsed_value}"}`);

        // Add the parameter to "confirmed".
        let param = {};
        param[key] = parsed_value;
        Object.assign(this.context.confirmed, param);

        // At the same time, add the parameter key to previously confirmed list. The order of this list is newest first.
        if (!is_change){
            this.context.previous.confirmed.unshift(key);
        }

        // Remove item from to_confirm.
        if (this.context.to_confirm[key]){
            delete this.context.to_confirm[key];
        }

        // Clear confirming.
        if (this.context.confirming == key){
            this.context.confirming = null;
        }

        debug(`We have ${Object.keys(this.context.to_confirm).length} parameters to confirm.`);
    }

    ask_retry(message_text){
        let messages = [this.vp.create_message(message_text)];
        return this.vp.reply(this.bot_event, messages);
    }

    finish(){
        // If we still have parameters to confirm, we collect them.
        if (Object.keys(this.context.to_confirm).length > 0){
            debug("Going to collect parameter.");
            return this._collect();
        }

        if (this.skill["before_finish"]){
            debug("Going to process before finish.");
            return this.skill["before_finish"](this.vp, this.bot_event, this.context);
        }

        // If we have no parameters to confirm, we finish this conversation using finish method of skill.
        debug("Going to perform final action.");
        return this.skill.finish(this.vp, this.bot_event, this.context).then(
            (response) => {
                if (this.skill.clear_context_on_finish){
                    debug(`Clearing context.`);
                    this.context = null;
                }
                return response;
            },
            (response) => {
                return Promise.reject(response);
            }
        );
    }
};
