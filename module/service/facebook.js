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

    send(page_id, recipient, messages){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        let page_access_token = this._page_access_token.find(token => token.page_id === page_id).page_access_token;
        if (!page_access_token){
            return Promise.reject("page access token not found.");
        }
        debug(`page_id is ${page_id}. Corresponding page_access_token is ${page_access_token}`);

        let all_sent = [];
        for (let message of messages){
            setTimeout(() => {
                all_sent.push(new Promise((resolve, reject) => {
                    let headers = {
                        'Content-Type': 'application/json'
                    };
                    let body = {
                        recipient: recipient,
                        message: message
                    }
                    let url = "https://graph.facebook.com/v2.8/me/messages?access_token=" + page_access_token;
                    debug(message);
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
                            return reject(body.error.message);
                        }
                        resolve();
                    });
                }));
            }, 3000);
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
        // If this is test, we will not actually validate the signature.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip validating signature.");
            return true;
        }

        // Signature Validation
        let hash = "sha1=" + crypto.createHmac("sha1", this._app_secret).update(raw_body).digest("hex");
        if (hash != signature) {
            return false;
        }
        return true;
    }
};
