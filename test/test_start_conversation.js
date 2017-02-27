'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe('start-conversation-flow', () => {
    describe('skip-event', () => {
        let options = Util.create_options();
        let webhook = new Webhook(options);
        it('should skip processing event when the event is not supported.', () => {
            return webhook.run(Util.create_req("follow")).should.eventually.equal("skipped-unsupported-event-in-start-conversation-flow");
        });
        it('should complete processing event when the event is supported.', () => {
            return webhook.run(Util.create_req("message", {
                type:"text",
                text:"ライトの色を変えてください。"
            })).then(
                (response) => {
                    response.should.eventually.be.an("object");
                    /*
                    response.should.eventually.have.property("confirmed", {});
                    response.should.eventually.have.property("to_confirm");
                    response.should.eventually.have.property("confirming", "colored");
                    response.should.eventually.have.property("previous", { confirmed: []});
                    */
                }
            );
        });
        /*
        it('should complete processing event when the event is supported.', () => {
            let promise = webhook.run(Util.create_req("message", {
                type:"text",
                text:"赤"
            }));
            promise.should.eventually.be.an("object");
            promise.should.eventually.have.property("confirmed", { color: "FF7B7B"});
            promise.should.eventually.have.property("to_confirm", {});
            promise.should.eventually.have.property("confirming", null);
            promise.should.eventually.have.property("previous", { confirmed: ["colored"]});
            return promise;
        });
        */
    });
});
