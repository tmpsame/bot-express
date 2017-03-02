'use strict';

let request = require('request');
let Promise = require('bluebird');

module.exports = class ServiceFacebook {

    constructor(page_access_token){
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
                    (error) ? reject(error) : resolve();
                });
            }));
        }
        return Promise.all(all_sent).then(
            (response) => {
                return;
            },
            (response) => {
                Promise.reject();
            }
        )
    }

    validate_signature(signature, raw_body){
        // Signature Validation
        /*
        let hash = crypto.createHmac('sha256', this._channel_secret).update(raw_body).digest('base64');
        if (hash != signature) {
            return false;
        }
        return true;
        */
        return true;
    }
};
