#!/usr/bin/env node

const fs = require("fs");
const skill_dir = "../../../skill";
const index_script = "../../../index.js";

fs.stat(skill_dir, function(err, stats){
    console.log(err);
    if (err && err.code == "ENOENT"){
        fs.mkdir(skill_dir);
    }
});

fs.stat(index_script, function(err, stats){
    console.log(err);
    if (err && err.code == "ENOENT"){
        fs.writeFile(index_script, `
"use strict";

/*
** Import Packages
*/
let express = require("express");
let logger = require("morgan");
let bot_express = require("./index.js");

/*
** Middleware Configuration
*/
let app = express();
app.use(logger("dev"));
app.listen(process.env.PORT || 5000, () => {
    console.log("server is running...");
});

/*
** Mount bot-express
*/
app.use("/webhook", bot_express({
    apiai_client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
    line_channel_id: process.env.LINE_CHANNEL_ID,
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    facebook_app_secret: process.env.FACEBOOK_APP_SECRET,
    facebook_page_access_token: [
        {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
    ]
}));

module.exports = app;`);
    }
});
