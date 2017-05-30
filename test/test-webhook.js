'use strict';

const message_platform_list = ["line","facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe("webhook test - from unsupported message platform", function(){
    let user_id = "webhook";
    let event_type = "message";

    it("should be skipped", function(){
        let options = Util.create_options();
        let webhook = new Webhook(options);
        return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
            function(response){
                return webhook.run(Util.create_req("unsupported", event_type, user_id, null));
            }
        ).then(
            function(response){
                response.should.equal("This event comes from unsupported message platform. Skip processing.");
            }
        );
    });
});

for (let message_platform of message_platform_list){
    describe("webhook test - from " + message_platform, function(){
        let user_id = "webhook";
        let event_type = "message";

        describe("required options are missing", function(){
            it("should be rejected", function(){
                this.timeout(8000);

                let options = Util.create_options();
                if (message_platform == "line"){
                    options.line_channel_access_token = undefined;
                } else if (message_platform == "facebook"){
                    options.facebook_page_access_token = undefined;
                }
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ほげほげ"));
                    }
                ).then(
                    function(response){
                    },
                    function(response){
                        response.should.have.property("reason").and.equal("required option missing");
                        response.should.have.property("missing_option");
                    }
                );
            });
        });
        describe("unsupported event for start conversation flow", function(){
            it("should be skipped", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, "unsupported", user_id, null));
                    }
                ).then(
                    function(response){
                        response._flow.should.equal("start_conversation");
                        response.should.have.property("intent").and.equal(null);
                    }
                );
            });
        });
        describe("unsupported event for reply flow", function(){
            it("should be skipped", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色を変えて"));
                    }
                ).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, "unsupported", user_id, null, null));
                    }
                ).then(
                    function(response){
                        response.should.equal("unsupported event for reply flow");
                    }
                );
            });
        });
        describe("change intent", function(){
            it("should go through change intent flow", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色を赤に変えて"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("start_conversation");
                        response.should.have.property("confirmed").and.deep.equal({ color: "FF7B7B"});
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "こんにちは"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("change_intent");
                        response.should.have.property("confirmed").and.deep.equal({ color: "FF7B7B"});
                        response.should.have.property("previous").and.have.property("confirmed").and.deep.equal(["color"]);
                    }
                );
            });
        });
        describe("change parameter", function(){
            it("should go through change parameter flow", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色を赤に変えて"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("start_conversation");
                        response.should.have.property("confirmed").and.deep.equal({ color: "FF7B7B"});
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "青色"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("change_parameter");
                        response.should.have.property("confirmed").and.deep.equal({ color: "5068FF"});
                        response.should.have.property("previous").and.have.property("confirmed").and.deep.equal(["color"]);
                    }
                );
            });
        });
        describe("unidentifiable supported event", function(){
            it("should go through no way flow", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色を赤に変えて"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("start_conversation");
                        response.should.have.property("confirmed").and.deep.equal({ color: "FF7B7B"});
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ほげほげ"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("no_way");
                    }
                );
            });
        });
    });
}
