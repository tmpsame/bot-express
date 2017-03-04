'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe("webhook test - from unsupported message platform", function(){
    it("should be skipped", function(){
        let options = Util.create_options();
        let webhook = new Webhook(options);
        return webhook.run(Util["create_req_from_unsupported_message_platform"]("webhook", "message", "ほげほげ")).then(
            function(response){
                response.should.equal("This event comes from unsupported message platform. Skip processing.");
            }
        );
    });
});

for (let message_platform of message_platform_list){
    describe("webhook test - from " + message_platform, function(){
        describe("required options are missing", function(){
            it("should be rejected", function(){
                let options = Util.create_options();
                if (message_platform == "line"){
                    options.line_channel_access_token = undefined;
                } else if (message_platform == "facebook"){
                    options.facebook_page_access_token = undefined;
                }
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_from_" + message_platform]("webhook", "message", "ほげほげ")).then(
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
                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_from_" + message_platform]("webhook", "unsupported")).then(
                    function(response){
                        response.should.equal("unsupported event for start conversation flow");
                    }
                );
            });
        });
        describe("unsupported event for reply flow", function(){
            it("should be skipped", function(){
                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_from_" + message_platform]("webhook", "message", "ライトの色を変えて")).then(
                    function(response){
                        return webhook.run(Util["create_req_from_" + message_platform]("webhook", "unsupported"));
                    }
                ).then(
                    function(response){
                        response.should.equal("unsupported event for reply flow");
                        webhook.run(Util["create_req_to_clear_memory"]("webhook")).should.eventually.deep.equal({
                            message: "memory cleared",
                            memory_id: "webhook"
                        });
                    }
                );
            });
        });
    });
}
