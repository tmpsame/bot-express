'use strict';

let crypto = require('crypto');
let request = require('request');
let Promise = require('bluebird');
let debug = require("debug")("service");

module.exports = class ServiceFacebook {

    constructor(app_secret, page_access_token){
        this._app_secret = app_secret;
        this._page_access_token = page_access_token;
    }

    send(recipient, messages){
        let all_sent = [];
        for (let message of messages){
            all_sent.push(new Promise((resolve, reject) => {
                let headers = {
                    'Content-Type': 'application/json'
                };
                let body = {
                    recipient: recipient,
                    message: message
                }
                let url = "https://graph.facebook.com/v2.8/me/messages?access_token=" + this._page_access_token;
                request({
                    url: url,
                    method: 'POST',
                    headers: headers,
                    body: body,
                    json: true
                }, (error, response, body) => {
                    if (error){
                        return reject(error);
                    }
                    if (response.statusCode != 200){
                        debug(body.error.message);
                        return reject(body);
                    }
                    resolve();
                });
            }));
        }
        return Promise.all(all_sent).then(
            (response) => {
                debug("send succeeded");
                return;
            },
            (response) => {
                debug("send failed");
                return Promise.reject(response);
            }
        )
    }

    validate_signature(signature, raw_body){
        // Signature Validation
        let hash = "sha1=" + crypto.createHmac("sha1", this._app_secret).update(raw_body).digest("hex");
        if (hash != signature) {
            return false;
        }
        return true;
    }
};
