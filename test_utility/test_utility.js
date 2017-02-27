'use strict';

module.exports = class TestUtility {
    static create_options(){
        let options = {
            message_platform_type: "line",
            memory_retention: 60000,
            default_intent: "input.unknown",
            skill_path: "../../sample_skill/",
            enable_ask_retry: false,
            message_to_ask_retry: "ごめんなさい、もうちょっと正確にお願いできますか？",
            line_channel_id: "1503655738",
            line_channel_secret: "e831a0c6970c729656bb5e6636641c63",
            line_channel_access_token: "aHXG8rqZwa2PJGasxe2Yrf97+GlN04fV2rJkzpg6stcHsNrsy3+18UPbSU3v+1ja2rSJ+uk2PvQRigQnMvWmO21TVjhHrKB5KVQa+5N4V9nNv9y5Ht5a3jjgQwYPx/6lRqWRm47NJKFOuYu1dSNjxQdB04t89/1O/w1cDnyilFU=",
            apiai_client_access_token: "3702f45f873447ecbf2116608f1b031a",
            default_skill: "apologize"
        }
        return options;
    }

    static create_req(type, data = null){
        let req = {
            body: {
                events: [{
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "type": type,
                    "timestamp": 1462629479859,
                    "source": {
                      "type": "user",
                      "userId": "U206d25c2ea6bd87c17655609a1c37cb8"
                    }
                }]
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
