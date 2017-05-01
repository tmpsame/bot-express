'use strict';

let request = require('request');
let Promise = require('bluebird');
let debug = require("debug")("service");
const MAKER_URL_PREFIX = 'https://maker.ifttt.com/trigger/';
const MAKER_KEY = process.env.MAKER_KEY;

module.exports = class Hue {
    static change_color(color){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        debug("Going to change the color.");
        return new Promise((resolve, reject) => {
            let url = MAKER_URL_PREFIX + 'wfc_change_light_color/with/key/' + MAKER_KEY;
            let body = {value1: color};
            request({
                method: "POST",
                url: url,
                body: body,
                json: true
            }, (error, response, body) => {
                (error) ? reject(error) : resolve(body);
            });
        });
    }

    static turn_on(){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        debug("Going to turn on the light.");
        return new Promise((resolve, reject) => {
            let url = MAKER_URL_PREFIX + 'wfc_turn_on_light/with/key/' + MAKER_KEY;
            request({
                method: "POST",
                url: url,
                json: true
            }, (error, response, body) => {
                (error) ? reject(error) : resolve(body);
            });
        });
    }

    static turn_off(){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        debug("Going to turn off the light.");
        return new Promise((resolve, reject) => {
            let url = MAKER_URL_PREFIX + 'wfc_turn_off_light/with/key/' + MAKER_KEY;
            request({
                method: "POST",
                url: url,
                json: true
            }, (error, response, body) => {
                (error) ? reject(error) : resolve(body);
            });
        });
    }
}
