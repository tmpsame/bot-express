"use strict";

let Promise = require("bluebird");
let request = require("request");
let debug = require("debug")("bot-express:service");

Promise.promisifyAll(request);

module.exports = class ServiceZipCode {
    static search(zip_code){
        zip_code = zip_code.replace('-', '');
        let url = "http://zipcloud.ibsnet.co.jp/api/search?zipcode=" + encodeURIComponent(zip_code);
        return request.getAsync({
            url: url,
            json: true
        }).then(
            (response) => {
                if (response.body.results === null){
                    return Promise.reject(new Error("Address not found."));
                }
                return response.body.results[0];
            }
        );
    }
}
