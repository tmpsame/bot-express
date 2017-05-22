'use strict';

const Apiai = require("apiai");
const Promise = require("bluebird");
const debug = require("debug")("bot-express:service");

module.exports = class Apiai_promised {
    constructor(client_access_token, language = "ja"){
        this._client_access_token = client_access_token;
        this._language = language;
    }

    identify_intent(session_id, text){
        let ai_instance = Apiai(this._client_access_token, {language: this._language});
        let ai_request = ai_instance.textRequest(text, {sessionId: session_id});
        let promise_got_intent = new Promise((resolve, reject) => {
            ai_request.on('response', (response) => {
                resolve(response);
            });
            ai_request.end();
        });
        return promise_got_intent;
    }
}
