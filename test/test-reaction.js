'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();


describe("Reaction Test", function(){
    let message_platform = "facebook";
    let user_id = "reaction";
    let event_type = "message";
    describe("# 5 for satisfaction which triggers bot.queue()", function(){
        it("will add a comment and go to next question.", function(){
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
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "5"));
                }
            ).then(
                function(response){
                    // Bot added a comment and now asking difficulty.
                    response.should.have.property("confirming", "difficulty");
                    response.previous.message.should.have.lengthOf(5);
                    response.previous.message[1].from.should.equal("bot");
                    response.previous.message[1].message.should.deep.equal({
                        text: "うぉー！！よかった！"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "難易度はどうでした？",
                        quick_replies: [
                            {content_type:"text", title:"難しい", payload:"難しい"},
                            {content_type:"text", title:"適当", payload:"適当"},
                            {content_type:"text", title:"易しい", payload:"易しい"}
                        ]
                    });
                }
            );
        });
    });
    describe("# 1 for satisfaction which triggers bot.queue() and bot.collect()", function(){
        it("will add a comment and optional question. Finally ask one more optional question", function(){
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
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "1"));
                }
            ).then(
                function(response){
                    // Bot added a comment and now asking optional question of suggestion.
                    response.should.have.property("confirming", "suggestion");
                    response.previous.message.should.have.lengthOf(5);
                    response.previous.message[1].from.should.equal("bot");
                    response.previous.message[1].message.should.deep.equal({
                        text: "なんてこった。。"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "この勉強会はどのようにすれば改善できると思いますか？"
                    });
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "音楽があればBetterです。"));
                }
            ).then(
                function(response){
                    // Bot is now asking difficulty.
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "適当"));
                }
            ).then(
                function(response){
                    // Bot is now asking free_comment.
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "がんばってください。"));
                }
            ).then(
                function(response){
                    // Bot is now asking mail.
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "nakajima@hoge.com"));
                }
            ).then(
                function(response){
                    // Bot is now asking one more optional question of come_back.
                    response.should.have.property("confirming", "come_back");
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "いただいた意見を踏まえて改善していこうと思います。なので、また来てくれるかな？",
                        quick_replies: [
                            {content_type:"text", title:"いいとも", payload:"いいとも"},
                            {content_type:"text", title:"それはどうかな", payload:"それはどうかな"}
                        ]
                    });
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "いいとも"));
                }
            ).then(
                function(response){
                    // Bot replied final message.
                    response.should.have.property("confirming", null);
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: `完璧です！ありがとうございました！！`
                    });
                }
            );
        });
    });
});
