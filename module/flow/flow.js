'use strict';

let Promise = require('bluebird');
let apiai = require('apiai');

module.exports = class Flow {
    constructor(message_platform_type, message_platform, bot_event, conversation, skill_path, default_skill){
        this.message_platform_type = message_platform_type;
        this.message_platform = message_platform;
        this.bot_event = bot_event;
        this.conversation = conversation;
        this.skill_path = skill_path;
        this.default_skill = default_skill;
        this.skill = this._instantiate_skill(this.conversation.intent.action);

        if (!!this.skill.required_parameter && typeof this.skill.required_parameter == "object"){
            console.log(`This skill requires ${Object.keys(this.skill.required_parameter).length} parameters.`);
        } else {
            console.log(`This skill requires 0 parameters.`);
        }
        this.conversation.to_confirm = this._identify_to_confirm_parameter(this.skill.required_parameter, this.conversation.confirmed);

        console.log(`We have ${Object.keys(this.conversation.to_confirm).length} parameters to confirm.`);
    }

    _instantiate_skill(intent){
        if (!intent){
            console.log("Intent should have been set but not.");
            return;
        }

        // If the intent is not identified, we use default_skill.
        if (intent == "input.unknown"){
            intent = this.default_skill;
        }

        let Skill;
        try {
            Skill = require(`${this.skill_path}${intent}`);
        } catch (err){
            console.log(`Cannnot import ${this.skill_path}${intent}`);
            console.log(err);
            throw(err);
        }
        return new Skill();
    }

    _identify_to_confirm_parameter(required_parameter, confirmed){
        let to_confirm = {};

        // If there is no required_parameter, we just return empty object as confirmed.
        if (!required_parameter){
            return to_confirm;
        }

        // Scan confirmed parameters and if missing required parameters found, we add them to to_confirm.
        for (let req_param_key of Object.keys(required_parameter)){
            if (!confirmed[req_param_key]){
                to_confirm[req_param_key] = required_parameter[req_param_key];
            }
        }
        return to_confirm;
    }

    _collect(){
        if (Object.keys(this.conversation.to_confirm).length == 0){
            console.log("While collect() is called, there is no parameter to confirm.");
            return Promise.reject();
        }
        let messages = [this.conversation.to_confirm[Object.keys(this.conversation.to_confirm)[0]].message_to_confirm];

        // Set confirming.
        this.conversation.confirming = Object.keys(this.conversation.to_confirm)[0];

        // Send question to the user.
        switch(this.message_platform_type){
            case "line":
                return this.message_platform.reply(this.bot_event.replyToken, messages);
            break;
            default:
                throw(`Unsupported message platform type: "${options.message_platform_type}"`);
            break;
        }
    }

    change_parameter(key, value){
        this.add_parameter(key, value, true);
    }

    add_parameter(key, value, is_change = false){
        console.log(`Parsing parameter {${key}: "${value}"}`);

        let parsed_value;

        // Parse the value. If the value is not suitable for this key, exception will be thrown.
        if (this.skill.required_parameter[key]){
            if (!!this.skill.required_parameter[key].parse){
                parsed_value = this.skill.required_parameter[key].parse(value);
            } else if (!!this.skill["parse_" + key]){
                parsed_value = this.skill["parse_" + key](value);
            } else {
                throw("Parse method not found.");
            }
        } else if (this.skill.optional_parameter[key]){
            if (!!this.skill.optional_parameter[key].parse){
                parsed_value = this.skill.optional_parameter[key].parse(value);
            } else if (!!this.skill["parse_" + key]){
                parsed_value = this.skill["parse_" + key](value);
            } else {
                throw("Parse method not found.");
            }
        } else {
            // This is not the parameter we care about. So skip it.
            console.log("This is not the parameter we care about.");
            throw("This is not the parameter we care about.");
        }

        console.log(`Adding parameter {${key}: "${parsed_value}"}`);

        // Add the parameter to "confirmed".
        let param = {};
        param[key] = parsed_value;
        Object.assign(this.conversation.confirmed, param);

        // At the same time, add the parameter key to previously confirmed list. The order of this list is newest first.
        if (!is_change){
            this.conversation.previous.confirmed.unshift(key);
        }

        // Remove item from to_confirm.
        if (this.conversation.to_confirm[key]){
            delete this.conversation.to_confirm[key];
        }

        // Clear confirming.
        if (this.conversation.confirming == key){
            this.conversation.confirming = null;
        }

        console.log(`We have ${Object.keys(this.conversation.to_confirm).length} parameters to confirm.`);
    }

    finish(){
        // If we still have parameters to confirm, we collect them.
        if (Object.keys(this.conversation.to_confirm).length > 0){
            return this._collect();
        }
        // If we have no parameters to confirm, we finish this conversationw with final reply.
        return this.skill.finish(this.message_platform, this.bot_event, this.conversation);
    }
};
