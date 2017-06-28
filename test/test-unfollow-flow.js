'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe("unfollow flow test from LINE", function(){
    let user_id = "unfollow-flow";
    let event_type = "unfollow";
    let message_platform = "line";

    describe("unfollow skill not found", function(){
        it("should just skip this event.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id));
                }
            ).then(
                function(response){
                    response.should.equal("This is Unfollow flow but unfollow_skill not found so skip.");
                }
            );
        });
    });
    describe("unfollow skill found", function(){
        it("should invoke unfollow skill.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            options.unfollow_skill = "test-unfollow";

            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id));
                }
            ).then(
                function(response){
                    response.previous.message.should.have.lengthOf(2);
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "text",
                        text: "Bye."
                    });
                }
            );
        });
    });
});
