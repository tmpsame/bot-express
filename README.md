![Build Status](https://travis-ci.org/nkjm/bot-express.svg?branch=master)

# 概要

Node.jsで稼働するChat Botを開発するためのフレームワーク。文脈の理解、必要なパラメータの収集などの機能が搭載されており、開発者はSkillを追加するだけでBotの能力を拡張できます。現在対応しているメッセージアプリはLINEのみですが、近々にFacebook MessengerやSlack等への対応を見込んでいます。

# 必要なサービス

- LINE
- api.ai

# インストール

```
$ npm install bot-express --save
```

# 利用方法

## ミドルウェア設定

まずbot-expressをインポートします。

```
let bot_express = require('bot-express');
```

次にミドルウェア設定でWebhookとなるURLを指定し、オプションを指定します。
下記の例では http[s]://YOUR_HOSTNAME/webhook がWebhookのURLとなります。

```
app.use('/webhook', bot_dock({
    apiai_client_access_token: 'あなたのAPIAI Client Access Token', // 必須
    default_skill: 'あなたのskill', // 必須。Intentが特定されなかった場合に使うSkill
    line_channel_id: 'あなたのLINE Channel ID', // LINE対応の場合必須
    line_channel_secret: 'あなたのLINE Channel Secret', // LINE対応の場合必須
    line_channel_access_token: 'あなたのLINE Channel Access Token', // LINE対応の場合必須
    facebook_app_secret: 'あなたのFacebook App Secret', // Facebook対応の場合必須
    facebook_page_access_token: 'あなたのFacebook Page Access Token', // Facebook対応の場合必須
    facebook_verify_token: 'あなたのFacebook Verify Token', // オプション。FacebookのWebhook認証用トークン。デフォルトはfacebook_page_access_tokenに指定した値
    default_intent: 'あなたのintent', // オプション。api.aiが意図を特定できなかった場合に返すresult.actionの値。デフォルトはinput.unknown
    skill_path: 'Skillのファイルが保存されるPATH', // オプション。Skillファイルが保存されるディレクトリをこのアプリのルートディレクトリからの相対PATHで指定。デフォルトは'./skill'
    message_platform_type: 'プラットフォーム識別子', // オプション。現在サポートされているのはlineのみ。デフォルトはline
    memory_retention: ミリ秒 // オプション。Botが会話を記憶する期間をミリ秒で指定。デフォルトは60000 (60秒)
}));
```

[sample_app.js](./sample_app.js)でこのファイルの全体像を確認することができます。

## api.aiによる意図判定のセットアップ

bot-expressは現在のところユーザーが発したメッセージから意図を判定するための自然言語処理にapi.aiを利用します。従ってまずapi.aiのアカウントを開設し、このアプリに対応するエージェントを作成する必要があります。

api.aiでエージェントを作成したら次にIntentを作成します。ユーザーが「何をしたいのか」をあらわすもので、ここでIntentを作成するということはその意図をBotが理解できるようにするということであり、同時にその意図に対応するBotのスキルを作成することになります。このapi.ai上でおこなう設定としては、Intentごとにユーザーが発する可能性のある例文を複数登録し、Intentの判定精度を高めていきます。同時に、各Intentには必ずactionを設定してください。actionに設定された文字列は、ユーザーの求めるIntentをBotが判断する拠り所になります。

## スキルの追加

Intentに対応するスキルを作成するため、skillディレクトリ直下にskillファイルを追加します。このskillファイル名はapi.aiのIntentで設定したactionの値と同一である必要があります。例えば、api.aiで「ライトの色を変更する」というIntentを登録し、そのactionに **change-light-color** という値を設定したとすると、このIntentに対応するskillファイル名は **change-light-color.js** となります。

## skillファイルの構成

skillファイルはbot-expressフレームワークを使う中で開発者が唯一必ずBot独自の処理を記述する必要のあるファイルです。
skillファイルは大きく3つのパートで構成されます。下記にパート毎のサンプルコードと説明がありますが、skillファイルの全体像を確認するには、[sample_skill/change-light-color.js](./sample_skill/change-light-color.js)を参照してみてください。

**constructor()**

このスキルが完結するのに必要なパラメータ、およびそのパラメータを確認するためのメッセージを設定します。
例えば「ライトの色を変更する」というスキルの場合、「色」の指定が不可欠となるので、これをrequired_parameterプロパティに登録します。

```
constructor() {
    this.required_parameter = {
        color: {
            message_to_confirm: {
                line: {
                    type: "text",
                    text: "何色にしますか？"
                }
            },
            parse: this.parse_color
        }
    };
}
```

上記のサンプルコードではrequired_parameterプロパティにcolorが登録されているのがわかります。また、このパラメータを収集する際、ユーザーに確認するメッセージをmessage_to_confirmに設定します。message_to_confirmに設定するメッセージは利用するメッセージプラットフォーム毎に設定します。これはメッセージのフォーマットがメッセージプラットフォームのAPIに依存するためです。上記サンプルではLINE用のメッセージを設定しています。

また、parseでこのパラメータを判定・変換するためのparse処理を指定できます。上記の例では明示的にthis.parse_colorと指定していますが、指定がない場合はデフォルトでthis.parse_パラメータ名のメソッドが実行されます。

パラメータにはスキルの完結に不可欠なrequired_parameterと、補足的なoptional_parameterが指定できます。optional_parameterのフォーマットはrequired_parameterと全く同じです。両者の違いは、required_parameterは全て埋まらない限りユーザーに確認が送信されるのに対し、optional_parameterはBot側から能動的に確認することはないという点です。

いずれのパラメータも特定されればconversation.confirmedに登録され、後述のfinish()の中で参照することができます。

**parse_パラメータ(value)**

ユーザーが発したメッセージからパラメータを特定、変換する処理をパラメータごとに記述します。

例えば、ユーザーが「ライトの色を変えてください」というメッセージを送信すると、Botはcolorパラメータが埋まっていないことに気付き、「何色にしますか？」と質問します。それに対しユーザーが「赤色」と返信したとします。Botはこの時、このメッセージにサポートする色が指定されているかどうか、また、最終的にライトの色を変更するために色をカラーコードに変換する必要があります。この判定処理、および変換処理を必要に応じてparse_パラメータ()に記述します。

```
parse_color(value){
    if (value === null || value == ""){
        return false;
    }

    let parsed_value = {};

    let found_color = false;
    for (let color_mapping of COLOR_MAPPINGS){
        if (value.replace("色", "") == color_mapping.label){
            parsed_value = color_mapping.code;
            found_color = true;
        }
    }
    if (!found_color){
        return false;
    }
    return parsed_value;
}
```

適切な値が判定できた場合には、その値をそのまま返すか、変換が必要であれば変換した値を返します。上記の例ではCOLOR_MAPPINGSという定数にサポートする色一覧が設定されている前提で、その値に一致するかどうかを判定しています。また、一致した場合には同じくCOLOR_MAPPINGSに設定されている対応カラーコードに値を置き換え、それを返すという処理になっています。

適切な値が判定できなかった場合にはfalseを返してください。

**finish(bot, bot_event, conversation)**

パラメータが全て揃ったら実行する処理を記述します。

```
finish(bot, bot_event, conversation){
    return Hue.change_color(conversation.confirmed.color).then(
        (response) => {
            let messages = [bot.create_message("了解しましたー。", "text")];
            return bot.reply(bot_event, messages);
        },
        (response) => {
            return Promise.reject("Failed to change light color.");
        }
    );
}
```

上記の例では別途定義されているライトの色を変更するサービスであるHue.change_color(color)を実行し、成功したら「了解しましたー。」というメッセージをユーザーに返信しています。

finish()には3つの引数が与えられます。第一引数（上記例ではbot）はメッセージ送信処理などが実装されたインスタンスです。利用しているメッセージプラットフォームを意識せずに処理を記述することができます。上記例ではreply()メソッドを利用しています。このインスタンスの機能は下記です。

- create_message(message_type, message_object)
- reply(bot_event, messages)

第二引数（上記例ではbot_event）はこの処理のトリガーとなったイベントです。例えばメッセージプラットフォームがLINEの場合、Webhookに送信されたeventオブジェクトが収められています。

第三引数（上記例ではconversation）はこれまでの会話の記録です。このconversationは下記のような構造になっています。

```
{
    intent: api.aiから返されたresult,
    to_confirm: 確認しなければならないパラメータのリスト,
    confirmed: 確認済みのパラメータのリスト,
    confirming: 現在確認中のパラメータ
    previous: {
        confirmed: 前回の会話で確認したパラメータのリスト
    }
}
```

おそらく必ず必要になるのがconfirmedです。ここにはconstructor()でこのスキルで必須とされたパラメータとその値が収められています。前述の例ではconversation.confirmed.colorとして特定した色を取得しています。

このfinish()によって、開発者は自由に最終的なアクションを作成することができます。単に決まったフレーズを返信することもできますし、上記例のように他のクラウドサービスと連携して、IoTとドッキングさせることもできます。返信することだけが最終的なアクションではなく、アイデア次第で様々なモノ、サービスと連携できます。

Enjoy.
