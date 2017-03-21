'use strict';

module.exports = class HandlePizzaOrder {

	// コンストラクター。このスキルで必要とする、または指定することができるパラメータを設定します。
    constructor() {
        this.required_parameter = {
            pizza: {
                message_to_confirm: {
                    line: {
                        type: "template",
                        altText: "ご注文のピザはお決まりでしょうか？ マルゲリータ、マリナーラからお選びください。"
                        template: {
                            type: "buttons",
                            text: "ご注文のピザはお決まりでしょうか？"
                            actions: [
                                {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                                {type:"postback",label:"マリナーラ",data:"マリナーラ"}
                            ]
                        }
                    },
                    facebook: {
                        text: "ご注文のピザはお決まりでしょうか？",
                        quick_replies: [
                            {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                            {content_type:"text",title:"マリナーラ",payload:"マリナーラ"}
                        ]
                    }
                }
            },
            size: {
                message_to_confirm: {
                    line: {
                        type: "template",
                        altText: "サイズはいかがいたしましょうか？ S、M、Lからお選びください。",
                        template: {
                            type: "buttons",
                            text: "サイズはいかがいたしましょうか？",
                            actions: [
                                {type:"postback",label:"S",data:"S"},
                                {type:"postback",label:"M",data:"M"},
                                {type:"postback",label:"L",data:"L"}
                            ]
                        }
                    },
                    facebook: {
                        text: "サイズはいかがいたしましょうか？",
                        quick_replies: [
                            {content_type:"text",title:"S",payload:"S"},
                            {content_type:"text",title:"M",payload:"M"},
                            {content_type:"text",title:"M",payload:"L"}
                        ]
                    }
                }
            },
            address: {
                message_to_confirm: {
                    line: {
                        type: "text",
                        text: "お届け先の住所を教えていただけますか？"
                    },
                    facebook: {
                        text: "お届け先の住所を教えていただけますか？"
                    }
                }
            },
            name: {
                message_to_confirm: {
                    line: {
                        type: "text",
                        text: "最後に、お客様のお名前を教えていただけますか？"
                    },
                    facebook: {
                        text: "最後に、お客様のお名前を教えていただけますか？"
                    }
                }
            }
        };
    }

    // パラメーターが全部揃ったら実行する処理を記述します。
    finish(bot, bot_event, context){
        let messages = [bot.create_message(`${context.confirmed.name}様、ご注文ありがとうございました！${context.confirmed.pizza}の${context.confirmed.size}サイズを30分以内にご指定の${context.confirmed.address}までにお届けに上がります。`)];
        return bot.reply(bot_event, messages);
    }
};
