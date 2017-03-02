'use strict';

/*
** Import Packages
*/
let express = require("express");
let logger = require('morgan');
let Bot_express = require("./module/index2");

/*
** Middleware Configuration
*/
let app = express();
app.use(logger('dev'));
app.listen(process.env.PORT || 5000, () => {
    console.log(`server is running...`);
});

// For LINE
let bot_express = new Bot_express({
    message_platform_type: "line",
    line_channel_id: process.env.LINE_CHANNEL_ID,
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    apiai_client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
    default_skill: 'apologize'
});
app.use('/webhook/line', bot_express.webhook);

// For Facebook
/*
app.use('/webhook/facebook', bot_express({
    message_platform_type: "facebook",
    facebook_page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    apiai_client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
    default_skill: 'apologize'
}));
*/

module.exports = app;
