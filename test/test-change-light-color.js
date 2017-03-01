'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe("change-light-color", function(){
    describe("#ライトの色変えて", function(){
        it("goes start conversation flow and confirm the color of light.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            let req_data = {
                type:"text",
                text:"ライトの色変えて"
            };
            return webhook.run(Util.create_req("change-light-color", "message", req_data)).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({});
                    response.should.have.property("confirming", "color");
                    response.should.have.property("to_confirm").have.property("color");
                    response.should.have.property("previous").and.deep.equal({confirmed:[]});
                }
            );
        });
    });
    describe("#赤", function(){
        it("goes reply flow and the color of light is changed to 赤.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            let req_data = {
                type:"text",
                text:"赤"
            };
            return webhook.run(Util.create_req("change-light-color", "message", req_data)).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({color:"FF7B7B"});
                    response.should.have.property("confirming", null);
                    response.should.have.property("to_confirm").and.deep.equal({});
                    response.should.have.property("previous").and.deep.equal({confirmed:["color"]});
                }
            );
        });
    });
    describe("#黄", function(){
        it("goes change parameter flow and the color of light is changed to 黄.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            let req_data = {
                type:"text",
                text:"黄"
            };
            return webhook.run(Util.create_req("change-light-color", "message", req_data)).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({color:"FFFA6A"});
                    response.should.have.property("confirming", null);
                    response.should.have.property("to_confirm").and.deep.equal({});
                    response.should.have.property("previous").and.deep.equal({confirmed:["color"]});
                }
            );
        });
    });
    describe("#ライトの色を青に変えて", function(){
        it("goes change intent flow and changes the color of light to 青 immediately.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            let req_data = {
                type:"text",
                text:"ライトの色を青に変えて"
            };
            return webhook.run(Util.create_req("change-light-color", "message", req_data)).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({color:"5068FF"});
                    response.should.have.property("confirming", null);
                    response.should.have.property("to_confirm").and.deep.equal({});
                    response.should.have.property("previous").and.deep.equal({confirmed:["color", "color"]});
                }
            );
        });
    });
    describe("#赤", function(){
        it("goes change parameter flow and changes the color of light to 赤.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            let req_data = {
                type:"text",
                text:"赤"
            };
            return webhook.run(Util.create_req("change-light-color", "message", req_data)).then(
                function(response){
                    response.should.have.property("confirmed").and.deep.equal({color:"FF7B7B"});
                    response.should.have.property("confirming", null);
                    response.should.have.property("to_confirm").and.deep.equal({});
                    response.should.have.property("previous").and.deep.equal({confirmed:["color", "color"]});
                }
            );
        });
    });
});
