'use strict';

let Promise = require('bluebird');
let request = require('request');
let crypto = require('crypto');
let debug = require("debug")("bot-express:messenger");

Promise.promisifyAll(request);

module.exports = class ServiceFacebook {

    constructor(app_secret, page_access_token){
        this._app_secret = app_secret;
        this._page_access_token = page_access_token;
    }

    send(event, to, messages){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        let page_id = event.recipient.id
        let recipient = {id: to};

        let page_access_token = this._page_access_token.find(token => token.page_id === page_id).page_access_token;
        if (!page_access_token){
            return Promise.reject(new Error("page access token not found."));
        }
        debug(`page_id is ${page_id}. Corresponding page_access_token is ${page_access_token}`);

        let all_sent = [];
        let interval = 0;
        let offset = 0;

        let url = "https://graph.facebook.com/v2.8/me/messages?access_token=" + page_access_token;

        // If we have more then 1 message, we set 2000 msec interval to assure the message order.
        for (let message of messages){

            let body = {
                recipient: recipient,
                message: message
            }

            if (offset > 0 && interval == 0){
                interval = 2000;
            }
            offset += 1;

            setTimeout(() => {
                all_sent.push(request.postAsync({
                    url: url,
                    body: body,
                    json: true
                }).then(
                    (response) => {
                        if (response.statusCode != 200){
                            debug("facebook.send() failed.");
                            if (response.body && response.body.error && response.body.error.message){
                                return Promise.reject(new Error(response.body.error.message));
                            } else if (response.statusMessage){
                                return Promise.reject(new Error(response.statusMessage));
                            }
                        }
                        return response;
                    }
                ));
            }, interval);
        }

        return Promise.all(all_sent).then(
            (response) => {
                return response;
            }
        )
    }

    reply(event, messages){
        return this.send(event, event.sender.id, messages);
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
