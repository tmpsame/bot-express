'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe('start-conversation-flow', () => {
        let options = Util.create_options();
        let webhook = new Webhook(options);

        let promise = webhook.run(Util.create_req("message", {
            type:"text",
            text:"ライトの色を変えてください。"
        }));

        it('should complete processing event using start_conversation flow.', (done) => {
            promise.then(
                (response) => {
                    response.should.eventually.have.property("confirming");
                    response.should.eventually.have.property("to_confirm");
                    done();
                }
            );
        });
            /*
            return webhook.run(Util.create_req("message", {
                type:"text",
                text:"ライトの色を変えてください。"
            })).should.eventually.equal("color");
            */
            /*
            p.should.eventually.be.an("object");
            p.should.eventually.have.property("confirmin");
            p.should.eventually.have.property("confirmed");
            p.should.eventually.have.property("to_confirm");
            */
            /*
            .and.have.property("to_confirm")
            .and.have.property("confirming", "color")
            .and.have.property("previous", { confirmed: [] });
            */
        /*
        it('should complete processing using reply flow.', () => {
            return webhook.run(Util.create_req("message", {
                type:"text",
                text:"赤"
            })).should.eventually
            .be.an("object")
            .and.have.property("confirmed")
            .and.have.property("to_confirm")
            .and.have.property("confirming", null)
            .and.have.property("previous", { confirmed: ["color"]});
        });
        */
});
