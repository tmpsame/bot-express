'use strict';

const message_platform_list = ["line","facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

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
                should.not.exist(response);
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
                ).catch(
                    function(response){
                        console.log(response);
                        response.reason.should.equal("required option missing");
                        response.should.have.property("missing_option");
                    }
                );
            });
        });
    });
}
