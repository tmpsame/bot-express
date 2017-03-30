'use strict';

module.exports = class TestUtility {
    static create_options(){
        let options = {
            memory_retention: 60000, // This is optional but required for this testing since test does not go through index.js which sets default parameter.
            skill_path: "../../sample_skill/",
            enable_ask_retry: false,
            message_to_ask_retry: "ごめんなさい、もうちょっと正確にお願いできますか？",
            line_channel_id: process.env.LINE_CHANNEL_ID,
            line_channel_secret: process.env.LINE_CHANNEL_SECRET,
            line_channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
            facebook_app_secret: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
            facebook_page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
            apiai_client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
            default_intent: "input.unknown" // This is optional but required for this testing since test does not go through index.js which sets default parameter.
        }
        return options;
    }

    static create_req_from_line(user_id, event_type, message = null){
        let req = {
            body: {
                events: [{
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "type": (event_type == "unsupported") ? "follow" : event_type,
                    "timestamp": 1462629479859,
                    "source": {
                      "type": "user",
                      "userId": user_id
                    }
                }]
            },
            get: function(param){
                let header = {
                    "X-Line-Signature": "dummy_signature"
                };
                return header[param];
            }
        }
        switch(event_type){
            case "message":
                if (typeof message == "string"){
                    req.body.events[0].message = {
                        type: "text",
                        text: message
                    }
                } else if (typeof message == "object"){
                    req.body.events[0].message = message;
                }
            break;
            case "postback":
                req.body.events[0].postback = {
                    data: message
                }
            break;
            case "unsupported":
                // no data.
            break;
        }
        return req;
    }

    static create_req_from_facebook(user_id, event_type, message = null){
        let req = {
            body: {
                object: "page",
                entry: [{
                    messaging: [{
                        sender: {
                            id: user_id
                        },
                        recipient: {
                            id: "dummy_recipient_id"
                        }
                    }]
                }]
            },
            get: function(param){
                let header = {
                    "X-Hub-Signature": "dummy_signature"
                };
                return header[param];
            }
        }
        switch(event_type){
            case "message":
                if (typeof message == "string"){
                    req.body.entry[0].messaging[0].message = {
                        text: message
                    };
                } else if (typeof message == "object"){
                    req.body.entry[0].messaging[0].message = message;
                }
            break;
            case "postback":
                req.body.entry[0].messaging[0].postback = {
                    payload: message
                };
            break;
            case "unsupported":
                // no data.
            break;
        }
        return req;
    }

    static create_req_from_unsupported_message_platform(user_id, event_type, message_text = null){
        let req = {
            body: {},
            get: function(param){
                let header = {};
                return header[param];
            }
        }
        return req;
    }

    static create_req_to_clear_memory(user_id){
        let req = {
            clear_memory: user_id
        }
        return req;
    }
}
