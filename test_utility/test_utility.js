'use strict';

module.exports = class TestUtility {
    static create_options(){
        let options = {
            memory_retention: 60000,
            default_intent: "input.unknown",
            skill_path: "../../sample_skill/",
            enable_ask_retry: false,
            message_to_ask_retry: "ごめんなさい、もうちょっと正確にお願いできますか？",
            line_channel_id: process.env.LINE_CHANNEL_ID,
            line_channel_secret: process.env.LINE_CHANNEL_SECRET,
            line_channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
            facebook_page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
            apiai_client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
            default_skill: "apologize"
        }
        return options;
    }

    static create_req(user_id, type, data = null){
        let req = {
            body: {
                events: [{
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "type": type,
                    "timestamp": 1462629479859,
                    "source": {
                      "type": "user",
                      "userId": user_id
                    }
                }]
            },
            get: function(param){
                let header = {
                    "X-Line-Signature": "dummy"
                };
                return header[param];
            }
        }
        switch(type){
            case "message":
                req.body.events[0].message = data;
            break;
            case "postback":
                req.body.event[0].postback = data;
            break;
            case "follow":
                // no data.
            break;
        }
        return req;
    }
}
