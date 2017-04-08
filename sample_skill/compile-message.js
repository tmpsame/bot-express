'use strict';

let debug = require("debug")("skill");

module.exports = class SkillCompileMessage {

    constructor() {
        this.required_parameter = {
            line_text: {
                message_to_confirm: {
                    type: "text",
                    text: "ご注文のピザは？"
                }
            },
            line_template_postback: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザをお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザをお選びください。",
                        actions: [
                            {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                            {type:"postback",label:"マリナーラ",data:"マリナーラ"}
                        ]
                    }
                }
            },
            line_template_message: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザをお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザをお選びください。",
                        actions: [
                            {type:"message",label:"マルゲリータ",text:"マルゲリータ"},
                            {type:"message",label:"マリナーラ",text:"マリナーラ"}
                        ]
                    }
                }
            },
            line_template_uri: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザをお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザをお選びください。",
                        actions: [
                            {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                            {type:"postback",label:"マリナーラ",data:"マリナーラ"},
                            {type:"uri", label: "すべてのメニュー", uri:"http://www.dominos.jp/order/pizza/search/99999/10002"}
                        ]
                    }
                }
            },
            line_template_uri_more_than_3: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザをお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザをお選びください。",
                        actions: [
                            {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                            {type:"postback",label:"マリナーラ",data:"マリナーラ"},
                            {type:"postback",label:"カプリチョーザ",data:"カプリチョーザ"},
                            {type:"uri", label: "すべてのメニュー", uri:"http://www.dominos.jp/order/pizza/search/99999/10002"}
                        ]
                    }
                }
            }/*,
            line_image: {
                message_to_confirm: {
                    type: "image",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            },
            line_video: {
                message_to_confirm: {
                    type: "video",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            },
            line_audio: {
                message_to_confirm: {
                    type: "sticker",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            },
            line_sticker: {
                message_to_confirm: {
                    type: "sticker",

                }
            },
            line_location: {
                message_to_confirm: {
                    type: "location",

                }
            },
            line_imagemap: {
                message_to_confirm: {
                    type: "imagemap",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            }
            /*

            size: { // common, facebook format, quick reply type
                message_to_confirm: {
                    text: "サイズはいかがいたしましょうか？ S、M、Lからお選びください。",
                    quick_replies: [
                        {content_type:"text",title:"S",payload:"S"},
                        {content_type:"text",title:"M",payload:"M"},
                        {content_type:"text",title:"L",payload:"L"}
                    ]
                }
            },
            address: { // common, line format, text type
                message_to_confirm: {
                    type: "text",
                    text: "お届け先の住所を教えていただけますか？"
                }
            },
            name: { // common, facebook format, text type
                message_to_confirm: {
                    text: "最後に、お客様のお名前を教えていただけますか？"
                }
            }
            */
        };

        this.clear_context_on_finish = true;
    }

    // パラメーターが全部揃ったら実行する処理を記述します。
    finish(bot, bot_event, context){
        let messages = [bot.create_text_message("完了")];
        return bot.reply(bot_event, messages);
    }
};
