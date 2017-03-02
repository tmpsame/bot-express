'use strict';

/*
** Import Packages
*/
let express = require("express");
let logger = require('morgan');
let bot_express = require("./index.js");

/*
** Middleware Configuration
*/
let app = express();
let router = express.Router();
app.use(logger('dev'));
app.listen(process.env.PORT || 5000, () => {
    console.log(`server is running...`);
});

app.use('/webhook', bot_express({
    line_channel_id: process.env.LINE_CHANNEL_ID,
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    facebook_page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    apiai_client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
    default_skill: 'apologize'
}));

module.exports = app;
