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
app.use(logger('dev'));
app.listen(process.env.PORT || 5000, () => {
    console.log(`server is running...`);
});

app.use('/webhook', bot_express({
    apiai_client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
    line_channel_id: process.env.LINE_CHANNEL_ID,
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    facebook_app_secret: process.env.FACEBOOK_APP_SECRET,
    facebook_page_access_token: [
        {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
    ],
    default_skill: "faq",
    beacon_skill: {
        enter: "survey",
        leave: "bye"
    }
}));

module.exports = app;
