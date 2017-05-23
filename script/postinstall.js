#!/usr/bin/env node

const fs = require("fs");
const readline = require("readline");
const os = require("os");
const skill_dir = "../../skill";
const index_script = "../../index.js";

if (!process.env.TRAVIS && process.env.NODE_ENV != "test" && process.env.NODE_ENV != "production"){

    fs.stat(skill_dir, function(err, stats){
        if (err && err.code == "ENOENT"){
            fs.stat(index_script, function(err, stats){
                if (err && err.code == "ENOENT"){
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    rl.question('May I create skill directory and index.js for you? (y/n): ', function(answer){
                        if (answer == "y"){
                            create_skill_dir();
                            create_indexjs();
                        }
                        rl.close();
                    });
                }
            });
        }
    });
}

function create_skill_dir(){
    console.log("Creating skill directory for you...");
    fs.mkdir(skill_dir);
}

function create_indexjs(){
    console.log("Creating index.js for you...");
    fs.writeFile(index_script, `
"use strict";

/*
** Import Packages
*/
let app = require("express")();
let bot_express = require("bot-express");

/*
** Middleware Configuration
*/
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
