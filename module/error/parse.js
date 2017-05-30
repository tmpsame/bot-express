"use strict";

module.exports = class ParseError extends Error {
    constructor(message){
        console.log("HOGEHOGEOHGOEHOGHEOHGOEHGOEHGOEHGOEHGEGH");
        super(message);
        this.name = "ParseError";
    }
}
