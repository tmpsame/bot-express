'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe("greet", function(){
    describe("#こんにちは", function(){
        it("responds fulfillment speech and left 0 to_confirm.", function(){
            let options = Util.create_options();
            let webhook = new Webhook(options);
            let req_data = {
                type:"text",
                text:"こんにちは。"
            };
            return webhook.run(Util.create_req("greet", "message", req_data)).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({});
                    response.should.have.property("confirming", null);
                    response.should.have.property("to_confirm").and.deep.equal({});
                    response.should.have.property("previous").and.deep.equal({confirmed:[]});
                }
            );
        });
    });
});
