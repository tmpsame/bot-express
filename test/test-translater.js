'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

describe("Traslater Test", function(){
    let message_platform = "line";
    let user_id = "translater";
    let event_type = "message";
    describe("Can I order pizza?", function(){
        it("will be recognized and bot asks pizza type.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "Can I order pizza?"));
                }
            ).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({});
                    response.should.have.property("confirming", "pizza");
                    response.should.have.property("to_confirm").have.lengthOf(4);
                    response.previous.message.should.have.lengthOf(2);
                    response.to_confirm[0].should.have.property("name").and.equal("pizza");
                    response.to_confirm[1].should.have.property("name").and.equal("size");
                    response.to_confirm[2].should.have.property("name").and.equal("address");
                    response.to_confirm[3].should.have.property("name").and.equal("name");
                    response.previous.confirmed.should.deep.equal([]);
                }
            );
        });
    });
    describe("#Answer incorrect pizza", function(){
        it("will be rejected by parser and bot asks same question once again.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util.create_req(message_platform, event_type, user_id, "Orange")).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({});
                    response.should.have.property("confirming", "pizza");
                    response.should.have.property("to_confirm").have.lengthOf(4);
                    response.previous.message.should.have.lengthOf(4);
                    response.previous.confirmed.should.deep.equal([]);
                }
            );
        });
    });
    describe("#Answer correct pizza", function(){
        it("will be accepted and bot asks pizza size.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util.create_req(message_platform, event_type, user_id, "Margherita")).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({pizza:"マルゲリータ"});
                    response.should.have.property("confirming", "size");
                    response.should.have.property("to_confirm").have.lengthOf(3);
                    response.previous.message.should.have.lengthOf(6);
                    response.previous.confirmed.should.deep.equal(["pizza"]);
                }
            );
        });
    });
    describe("#Can I order S size of Genovese?", function(){
        it("will be recognized but bot rejects Genovese and ask pizza type.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "Can I order S size of Genovese?"));
                }
            ).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({size: "S"});
                    response.should.have.property("confirming", "pizza");
                    response.should.have.property("to_confirm").have.lengthOf(3);
                    response.previous.message.should.have.lengthOf(2);
                    response.to_confirm[0].should.have.property("name").and.equal("pizza");
                    response.to_confirm[1].should.have.property("name").and.equal("address");
                    response.to_confirm[2].should.have.property("name").and.equal("name");
                    response.previous.confirmed.should.deep.equal(["size"]);
                }
            );
        });
    });
    describe("#Can I order S size of Margherita?", function(){
        it("will be recognized and set pizza and size and then Bot asks address.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "Can I order S size of Margherita?"));
                }
            ).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ", size: "S"});
                    response.should.have.property("confirming", "address");
                    response.should.have.property("to_confirm").have.lengthOf(2);
                    response.previous.message.should.have.lengthOf(2);
                    response.to_confirm[0].should.have.property("name").and.equal("address");
                    response.to_confirm[1].should.have.property("name").and.equal("name");
                    response.previous.confirmed.should.deep.equal(["size","pizza"]);
                }
            );
        });
    });
    describe("#Can I change color of light?", function(){
        it("will be recognized and Bot asks color.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "Can I change color of light?"));
                }
            ).then(
                // Bot is asking color.
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({});
                    response.should.have.property("confirming", "color");
                    response.should.have.property("to_confirm").have.lengthOf(1);
                    response.previous.message.should.have.lengthOf(2);
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "Red"));
                }
            ).then(
                // Roger.
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});
                    response.should.have.property("confirming", null);
                    response.should.have.property("to_confirm").have.lengthOf(0);
                    response.previous.message.should.have.lengthOf(4);
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "Orange"));
                }
            ).then(
                // Bot reject the color.
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});
                    response.should.have.property("confirming", null);
                    response.should.have.property("to_confirm").have.lengthOf(0);
                    console.log(response.previous.message);
                    response.previous.message.should.have.lengthOf(6);
                }
            );
        });
    });
});
