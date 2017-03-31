'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

for (let message_platform of message_platform_list){
    describe("simple response skill test - from " + message_platform, function(){
        let user_id = "simple-response";
        let event_type = "message";
        describe("#こんにちは", function(){
            it("responds fulfillment speech and left 0 to_confirm.", function(){
                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "text", "こんにちは。"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal({});
                        response.should.have.property("previous").and.deep.equal({confirmed:[]});
                        response.should.have.property("intent").and.have.property("fulfillment").and.have.property("speech").and.equal("どうも。");
                    }
                );
            });
        });
    });
}
