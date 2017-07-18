![Build Status](https://travis-ci.org/nkjm/bot-express.svg?branch=master)

# 概要

bot-expressはNode.jsで稼働するChatbotを開発するためのフレームワークであり、最も効率的に本格的なChatbotが開発できることを目的としています。開発者はフォーマットにしたがって「スキル」を追加するだけでChatbotの能力を拡張していくことができます。

## bot-expressに含まれる主な機能

- NLP（Natural Language Processing）によるメッセージの意図解析
- 複数メッセンジャーへの対応（LINEとFacebook Messengerに対応）
- 文脈の記憶
- ユーザーからの情報収集・リアクション
- 多言語翻訳


# セットアップの流れ

## メッセンジャーを設定する

サポートされているメッセンジャー（現在はLINEまたはFacebook Messenger）にてChatbotを稼働させるためのアカウント作成・設定をおこないます。

- LINEの設定手順：https://developers.line.me/messaging-api/getting-started
- Facebook Messengerの設定手順：https://developers.facebook.com/docs/messenger-platform/guides/quick-start

## bot-expressをインストールする

```
$ npm intall --save bot-express
```

## スキルを作成する

スキルはChatbotが対応できる内容を意味しています。丁寧で品質の高いスキルを開発することでChatbotの精度が上がり、スキルの数を増やすことでChatbotは多くのリクエストに応えることができるようになります。このスキルは1スキル:1スキルスクリプトという形でskillディレクトリ直下に作成します。

スキルスクリプトは大きく分けて2つのパートで構成されます。一つ目がconstructorメソッドで、ここにはスキルの行使に必要となる情報の列挙、情報を集めるためのメッセージ、リアクションなどを記述します。

もう一つがfinish()メソッドで、必要な情報がすべて揃った時に実行するスキルのメイン処理を記述します。

下記はピザ注文を受け付けるためのスキルスクリプトです。ユーザーにピザのタイプ、サイズ、配送先、氏名を確認し、最後に注文受付完了のメッセージが送信されます。

```
module.exports = class SkillHandlePizzaOrder {

    // コンストラクター。このスキルで必要とする、または指定することができるパラメータを設定します。
    constructor(bot, event) {
        this.required_parameter = {
            pizza: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザはお決まりでしょうか？ マルゲリータ、マリナーラからお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザはお決まりでしょうか？",
                        actions: [
                            {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                            {type:"postback",label:"マリナーラ",data:"マリナーラ"}
                        ]
                    }
                }
            },
            size: {
                message_to_confirm: {
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
                }
            },
            address: {
                message_to_confirm: {
                    type: "text",
                    text: "お届け先の住所を教えていただけますか？"
                }
            },
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "最後に、お客様のお名前を教えていただけますか？"
                }
            }
        };
    }

    // パラメーターが全部揃ったら実行する処理を記述します。
    finish(bot, event, context, resolve, reject){
        let messages = [{
            text: `${context.confirmed.name} 様、ご注文ありがとうございました！${context.confirmed.pizza}の${context.confirmed.size}サイズを30分以内にご指定の${context.confirmed.address}までお届けに上がります。`
        }];
        return bot.reply(messages).then(
            (response) => {
                return resolve();
            }
        );
    }
};
```

上記は簡素化した例ですが、これにパラメーターの検証やリアクション、外部サービスへの連携などを組み込むことが可能です。

## メッセージの解析

bot-expressは現在のところユーザーが発したメッセージから意図を判定するための自然言語処理にapi.aiを利用します。この判定結果に基づいてどのスキルを利用するかが自動的に判断されます。

api.aiでAgentを作成しIntentを作成していくことで自然言語処理エンジンを学習させていきます。


# Getting Started

まずはチュートリアルをご覧ください。必要なすべての流れをステップ・バイ・ステップでカバーしています。

[bot-expressを使ってピザ注文受付Botを60分で作ってみる](http://qiita.com/nkjm/items/1ac1a73d018c13deae30)

また、bot-expressのsample_skillディレクトリにスキルのサンプルがいくつか収められていますのでスキル開発の参考にしてみてください。

[スキルのサンプル](/sample_skill/)

# 制約

Webhookでサポートしているイベントは下記の通りです。

**LINE**
- message
- postback
- beacon
- follow
- unfollow

**Facebook**
- messages
- messaging-postbacks

キャッシュにmemory-cacheを利用しているため、サポートされているBotの実行環境はシングルインスタンスとなります。

--

Enjoy.
