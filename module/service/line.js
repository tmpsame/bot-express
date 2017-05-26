'use strict';

let Promise = require('bluebird');
let request = require('request');
let crypto = require('crypto');
let debug = require("debug")("bot-express:service");

Promise.promisifyAll(request);

module.exports = class ServiceLine {

    constructor(channel_id, channel_secret, channel_access_token){
        this._channel_id = channel_id;
        this._channel_secret = channel_secret;
        this._channel_access_token = channel_access_token;
    }

    send(to, messages){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        let headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this._channel_access_token
        };
        let body = {
            to: to,
            messages: messages
        }
        let url = 'https://api.line.me/v2/bot/message/push';
        return request.postAsync({
            url: url,
            headers: headers,
            body: body,
            json: true
        });
    }

    reply(reply_token, messages){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        let headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this._channel_access_token
        };
        let body = {
            replyToken: reply_token,
            messages: messages
        }
        let url = 'https://api.line.me/v2/bot/message/reply';
        return request.postAsync({
            url: url,
            headers: headers,
            body: body,
            json: true
        }).then(
            (response) => {
                debug(response);
                return;
            },
            (response) => {
                return Promise.reject(response);
            }
        );
    }

    validate_signature(signature, raw_body){
        // If this is test, we will not actually validate the signature.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip validating signature.");
            return true;
        }

        // Signature Validation
        let hash = crypto.createHmac('sha256', this._channel_secret).update(raw_body).digest('base64');
        if (hash != signature) {
            return false;
        }
        return true;
    }

};
