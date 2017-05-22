"use strict";

const request = require("request");
const debug = require("debug")("bot-express:service");
const Promise = require("bluebird");

module.exports = class ServiceZipCode {
    static search(zip_code){
        return new Promise((resolve, reject) => {
            zip_code = zip_code.replace('-', '');
            let url = "http://zipcloud.ibsnet.co.jp/api/search?zipcode=" + encodeURIComponent(zip_code);
            request({
                method: "get",
                url: url,
                json: true
            }, (error, response, body) => {
                if (error){
                    debug("search() failed.");
                    return reject(error);
                }
                debug("search() succeeded. Resposne follows.");
                if (body.results === null){
                    return reject("Address not found.");
                }
                return resolve(body.results[0]);
            });
        });
    }
}
