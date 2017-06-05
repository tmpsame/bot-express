"use strict";

let debug = require("debug")("bot-express:nlp");
let Promise = require("bluebird");

// If we add NLP service, we need to add required options below.
const required_options = {
    apiai: ["client_access_token", "language"]
};

module.exports = class Nlp {
    constructor(type, options){
        this.type = type; // The script having the filename identical to this type value has to exist under nlp dir.

        // Check Required Option.
        for (let required_option of required_options[this.type]){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" for ${this.type} not set`);
            }
        }

        let Nlp_service = require(`./nlp/${this.type}`);
        this.service = new Nlp_service(options);
    }

    /*
    ** indentify_intent - Need to return following object.
        {
            name: @string,
            parameters: @object,
            text_response: @string
        }
    */
    identify_intent(sentence, options){
        return this.service.identify_intent(sentence, options);
    }
}
