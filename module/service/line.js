'use strict';

let crypto = require('crypto');
let request = require('request');
let Promise = require('bluebird');
let debug = require("debug")("service");

module.exports = class ServiceLine {

    constructor(channel_id, channel_secret, channel_access_token){
        this._channel_id = channel_id;
        this._channel_secret = channel_secret;
        this._channel_access_token = channel_access_token;
    }

    send(to, messages){
        return new Promise((resolve, reject) => {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this._channel_access_token
            };
            let body = {
                to: to,
                messages: messages
            }
            let url = 'https://api.line.me/v2/bot/message/push';
            request({
                url: url,
                method: 'POST',
                headers: headers,
                body: body,
                json: true
            }, (error, response, body) => {
                (error) ? reject(error) : resolve();
            });
        });
    }

    reply(reply_token, messages){
        return new Promise((resolve, reject) => {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this._channel_access_token
            };
            let body = {
                replyToken: reply_token,
                messages: messages
            }
            let url = 'https://api.line.me/v2/bot/message/reply';
            debug(`headers is follwing`);
            debug(headers);
            debug(`body is following`);
            debug(body);
            debug(`url is following`);
            debug(url);
            request({
                url: url,
                method: 'POST',
                headers: headers,
                body: body,
                json: true
            }, (error, response, body) => {
                debug(error);
                debug(response);
                debug(body);
                if (error){
                    return reject(error);
                }
                if (response.statusCode != 200){
                    return reject(body.message || "Failed to reply.");
                }
                resolve();
            });
        });
    }

    validate_signature(signature, raw_body){
        // Signature Validation
        let hash = crypto.createHmac('sha256', this._channel_secret).update(raw_body).digest('base64');
        if (hash != signature) {
            return false;
        }
        return true;
    }

};
