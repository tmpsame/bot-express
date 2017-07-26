'use strict';

const message_platform_list = ["line","facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

for (let message_platform of message_platform_list){
    describe("REPLY FLOW TEST - from " + message_platform, function(){
        let user_id = "reply-flow";
        let event_type = "message";
        describe("User replied correct answer.", function(){
            it("will be accepted and fires reaction.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what pizza you like to order.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "マルゲリータで"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value for pizza.
                        response.should.have.property("_flow").and.equal("reply");
                        response.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                        response.should.have.property("confirming").and.deep.equal("size");
                        response.should.have.property("to_confirm").have.lengthOf(3);

                        // Also fires reaction.
                        response.previous.message.should.have.lengthOf(5);
                        response.previous.message[1].message.text.should.equal("マルゲリータですね。ありがとうございます。");
                    }
                );
            });
        });

        describe("User replied incorrect answer.", function(){
            it("will be rejected and bot asks same parameter.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what pizza you like to order.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ジェノベーゼで"));
                    }
                ).then(
                    function(response){
                        // Bot should have rejected the value for pizza.
                        response.should.have.property("_flow").and.equal("reply");
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming").and.deep.equal("pizza");
                        response.should.have.property("to_confirm").have.lengthOf(4);

                        // Bot asking for same parameter.
                        response.previous.message.should.have.lengthOf(4);
                        response.previous.message[0].message.text.should.equal("恐れ入りますが当店ではマルゲリータかマリナーラしかございません。どちらになさいますか？");
                    }
                );
            });
        });

        describe("User restarts conversation in the middle of the conversation.", function(){
            it("will trigger restart_conversation.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what pizza you like to order.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "マルゲリータ"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value for pizza.
                        response.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                        // Restart conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        // Bot restarted the conversation
                        response.should.have.property("_flow").and.equal("reply");
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming").and.equal("pizza");
                    }
                );;
            });
        });

        describe("User changes intent in the middle of the conversation.", function(){
            it("will trigger change_intent.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what pizza you like to order.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "マルゲリータ"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value for pizza.
                        response.should.have.property("_flow").and.equal("reply");
                        response.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                        // Change intent.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "やっぱりまた今度にします。"));
                    }
                ).then(
                    function(response){
                        // Bot reset the conversation and start with new intent.
                        should.not.exist(response);
                    }
                );
            });
        });

        describe("User tries to change parameter in the middle of the conversation.", function(){
            it("will rejected and bot asks for same parameter. *Will be accepted in the futer.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what pizza you like to order.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "マルゲリータ"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value for pizza.
                        response.should.have.property("_flow").and.equal("reply");
                        response.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                        // And now asking for size.
                        response.should.have.property("confirming").and.equal("size");
                        // Change intent.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "やっぱマリナーラ"));
                    }
                ).then(
                    function(response){
                        // Bot rejected and asks for same parameter. *This will be accepted in the future.
                        response.should.have.property("_flow").and.equal("reply");
                        response.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                        response.should.have.property("confirming").and.equal("size");
                    }
                );
            });
        });
    });
}
