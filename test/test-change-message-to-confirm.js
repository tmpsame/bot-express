'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();


describe("change_message_to_confirm Test", function(){
    let message_platform = "facebook";
    let user_id = "change_message_to_confirm";
    let event_type = "message";
    describe("# 6 for satisfaction which triggers bot.change_message_to_confirm()", function(){
        it("will change the message to confirm and send question for same parameter.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "アンケートテスト"));
                }
            ).then(
                function(response){
                    // Bot is now asking satisfaction.
                    response.should.have.property("confirming", "satisfaction");
                    response.previous.message.should.have.lengthOf(2);
                    response.confirmed.should.deep.equal({});
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "6"));
                }
            ).then(
                function(response){
                    // Bot re-confirm the parameter for satisfaction.
                    response.should.have.property("confirming", "satisfaction");
                    response.previous.message.should.have.lengthOf(4);
                    response.confirmed.should.deep.equal({});
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ん？1が最低、5が最高の5段階評価ですよ。数字で1から5のどれかで教えてくださいね。",
                        quick_replies: [
                            {content_type:"text", title:"5 高", payload:5},
                            {content_type:"text", title:"4", payload:4},
                            {content_type:"text", title:"3", payload:3},
                            {content_type:"text", title:"2", payload:2},
                            {content_type:"text", title:"1 低", payload:1},
                        ]
                    });
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "3"));
                }
            ).then(
                function(response){
                    // Bot accepted the value and now asking difficulty.
                    response.should.have.property("confirming", "difficulty");
                    response.previous.message.should.have.lengthOf(6);
                    response.confirmed.should.deep.equal({
                        satisfaction: 3
                    });
                }
            );
        });
    });
});
