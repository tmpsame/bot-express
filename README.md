![Build Status](https://travis-ci.org/nkjm/bot-express.svg?branch=master)

# 概要

bot-expressはNode.jsで稼働するChat Botを開発するためのフレームワークです。コンシェルジュ型のBotに必要とされる自然言語処理、文脈の理解、必要なパラメータの収集、LINEやFacebookを通じたメッセージ送受信機能などが搭載されており、開発者はフォーマットに従って「skillファイル」を追加するだけでBotの能力を拡張できることができます。

bot-expressは複数のメッセージプラットフォームに対応しており、開発者が追加したスキルはサポートされるすべてのメッセージプラットフォームで動作します。現在対応しているメッセージプラットフォームはLINEとFacebookです。

# アーキテクチャー

![architecture of bot-express.png](https://qiita-image-store.s3.amazonaws.com/0/26079/6df2dc12-ad48-1f4c-86f4-10f6fda93465.png)

bot-expressはNodeベースのアプリケーションにnpmでインストールできるフレームワークです。LINEやFacebookといったメッセージプラットフォーム、自然言語処理を担うapi.aiといった外部サービスとの連携が組み込まれており、スキルを作成しプラグインする形でBotを拡張できます。

# bot-expressを使うとどう幸せになれるのか？

まず端的に言うと下記の4点のメリットが挙げられます。

- ユーザーの意図を判定するための自然言語解析を利用できます。
- Botに記憶と文脈を理解する能力を持たせることができます。
- 任務の遂行に必要なパラメータを定義してあげることで適宜その情報を集めてくれます。
- bot-expressを使って開発したBotはLINE, Facebook Messengerといったサポートしている全てのメッセージングプラットフォームで動作します。

具体例で考えてみます。例えばスマートホームのコンシェルジュとなるBotを開発するとします。家にはPhilips社のHue（IoT電球。On/Offや照明色の変更が可能）が設置されており、プログラマティックに照明の色が変更できるようになっています。Botにこの照明の色を変更させるには、例えばユーザーは次のようにBotにリクエストすると予想されます。

「ライトの色を変えて」

この時Botに必要とされる処理は次の3つです。

- この文章からユーザーが照明色の変更をリクエストしていると認識すること ( **意図の特定** )
- 何色にすればいいのか確認すること ( **パラメーターの収集** )
- 照明の色を変更すること ( **最終処理** )

それぞれもう少し詳しく見ていきます。

**意図の特定**

このBotが照明の色を変更するスキルしか持たないのであれば話しは単純ですが、実際には照明の他に施錠・開錠をおこなったり、空調をコントロールしたり、など複数のスキルを持たせることが考えられます。よってメッセージからユーザーが何を求めているのかをまず特定する必要があります。

ここで利用されるのが自然言語処理です。「ライトの色を変えて」や「照明変えてくれる？」など同じ目的でも様々な表現となる自然言語から意図を特定する役割を果たします。現在のところ、bot-expressではこの自然言語処理に[api.ai](http://api.ai)を利用しており、その連携がすでに組み込まれています。従って開発者はapi.aiで特定したい意図を設定し、連携に必要となるアクセストークンだけ取得してbot-expressに渡してあげればBotに自然言語処理が組み込めるようになっています。

**パラメーターの収集**

api.aiによってユーザーがライトの色を変更してほしいことは理解できたものの、何色にしてほしいのかという情報が欠けています。こういったリクエストに応えるために最低限必要な情報を集めるのがパラメーターの収集です。

この作業はやや複雑です。前述の例だと、ユーザーに何色にしたいのか確認（返信）し、その答えから色を抽出する、という流れになると思われます。一旦ユーザーに返信した上でいつくるかわからない答えを待ち、答えがきたらそれが照明の色について回答しているということを理解しなければなりません。

また、少し違うパターンで最初からユーザーが「ライトを赤色に変更して」とリクエストしてくるかもしれません。この場合、最初の意図の特定と同時に必要なパラメーターが指定されていることを理解し、ユーザーにわざわざ確認することなく即座に照明の色を変えるという最終処理に進む必要があります。

人間だと柔軟に対応できるこういった臨機応変さをプログラムに組み込むのはいささか骨の折れる作業ですが、bot-expressはこのパラメータ収集作業をかなり軽減してくれます。開発者はBotのスキル（前述の例だと照明の色を変える能力）を追加する際、そのスキルにおいて最低限必要なパラメーターを下記のようにJSONフォーマットで設定します。

```
this.required_parameter = {
    color: {
        message_to_confirm: {
            type: "text",
            text: "何色にしますか？"
        }
    }
};
```

この情報に基づき、bot-expressがこれまでの会話から必要なパラメーターがそろっているかどうか判断し、欠けているパラメーターがあればユーザーに確認し、なければ最終処理を実行するという制御をおこなってくれます。＊情報のフォーマットについては後述の利用方法にあります。

> 意図の特定フェーズでパラメーターの抽出をおこなう場合、api.ai側にもパラメーターを認識させる設定（Entityの設定）が必要です。

**最終処理**

いよいよユーザーのリクエストに応えるときがきました。照明の色を変えるのです。この処理は開発者がfinish()という関数を実装することで自由に作成できます。bot-expressはfinish関数にこれまでに収集した情報を構造化して提供し、さらにLINEやFacebook Messengerといったメッセージプラットフォームを通じたメッセージの送信処理を統一したインターフェースで記述することができるサービスを提供します。これらの情報と機能利用しながら、単純な返信処理から照明の色を変えるIoT的な処理、他のクラウドサービスとの連携を含む処理など無限大の能力を追加することができます。

```
finish(bot, bot_event, context, resolve, reject){
    return hue.change_color(context.confirmed.color).then(
        (response) => {
            let messages = [{
                text: "了解しましたー。"
            }];
            // 送信元のメッセージプラットフォームを通じてメッセージが送信される。
            return bot.reply(messages);
        },
        (response) => {
            return Promise.reject("Failed to change light color.");
        }
    ).then(
        (response) => {
            return resolve(response);
        }
    ).catch(
        (response) => {
            return reject(response);
        }
    );
}
```

--

これらの設定はすべて「skillファイル」を作成することで実装します。skillファイルにそのスキルで必要となるパラメータを定義し、最終処理を記述してあげれば、意図の特定、パラメーターの収集といった作業の多くをbot-expressが肩代わりしてくれる、という仕組みになっています。

# 利用方法

## インストール

```
$ npm install bot-express --save
```

## ミドルウェア設定

まずメインとなるファイル（app.jsやindex.js）でbot-expressをインポートします。

```
let bot_express = require('bot-express');
```

次に同ファイルのミドルウェア設定でWebhookとなるURLを指定し、オプションを指定します。
下記の例では http[s]://YOUR_HOSTNAME/webhook がWebhookのURLとなります。

```
app.use('/webhook', bot_express({
    apiai_client_access_token: 'あなたのAPIAI Client Access Token', // 必須
    line_channel_id: 'あなたのLINE Channel ID', // LINE対応の場合必須
    line_channel_secret: 'あなたのLINE Channel Secret', // LINE対応の場合必須
    line_channel_access_token: 'あなたのLINE Channel Access Token', // LINE対応の場合必須
    facebook_app_secret: 'あなたのFacebook App Secret', // Facebook対応の場合必須
    facebook_page_access_token: [
        page_id: 'あなたのFacebook Page ID',
        page_access_token: 'あなたのFacebook Page Access Token',
    ], // Facebook対応の場合必須
    facebook_verify_token: 'あなたのFacebook Verify Token', // オプション。FacebookのWebhook認証用トークン。デフォルトはfacebook_app_secretに指定した値
    default_intent: 'あなたのintent', // オプション。api.aiが意図を特定できなかった場合に返すresult.actionの値。デフォルトはinput.unknown
    default_skill: 'あなたのskill', // オプション。Intentが特定されなかった場合に使うスキル。デフォルトは組み込まれているdefaultスキル（api.aiからのText Reponseをそのまま返信するスキル）
    beacon_skill: {'beaconイベントタイプ':'利用されるスキル'}, // オプション。beaconイベントとそのイベントで利用されるスキル。現在サポートされるbecaonイベントタイプはenterとleave。
    skill_path: 'Skillのファイルが保存されるPATH', // オプション。Skillファイルが保存されるディレクトリをこのアプリのルートディレクトリからの相対PATHで指定。デフォルトは'./skill'
    memory_retention: ミリ秒, // オプション。Botが会話を記憶する期間をミリ秒で指定。デフォルトは60000 (60秒)
    language: '言語識別子' // オプション。会話の言語を指定。デフォルトは"ja"
}));
```

[sample_app.js](./sample_app.js)でこのファイルの全体像を確認することができます。

## api.aiによる意図判定のセットアップ

bot-expressは現在のところユーザーが発したメッセージから意図を判定するための自然言語処理にapi.aiを利用します。従ってまずapi.aiのアカウントを開設し、このアプリに対応するエージェントを作成する必要があります。

api.aiでエージェントを作成したら次にIntentを作成します。
![create_intent.png](https://qiita-image-store.s3.amazonaws.com/0/26079/f861735e-4476-72e3-3ecf-310818890508.png "create_intent.png")

ユーザーが「何をしたいのか」をあらわすもので、ここでIntentを作成するということはその意図をBotが理解できるようにするということであり、同時にその意図に対応するBotのスキルを作成することになります。このapi.ai上でおこなう設定としては、Intentごとにユーザーが発する可能性のある例文を複数登録し、Intentの判定精度を高めていきます。
![register_user_says.png](https://qiita-image-store.s3.amazonaws.com/0/26079/30ea1a40-67b5-e75f-1c96-88e30913231c.png "register_user_says.png")



同時に、各Intentには必ずactionを設定してください。actionに設定された文字列は、ユーザーの求めるIntentをBotが判断する際のキーになります。
![action.png](https://qiita-image-store.s3.amazonaws.com/0/26079/cba7ecce-a43d-861a-526a-325cf8d8fa8d.png "action.png")


また、BotがこのIntentに対応するためにいくつかのパラメーターが必要になる場合、そのパラメーターをapi.aiで抽出できるように設定することができます。Entityで認識したいパラメーターを設定しておくと、Intentで例文を追加する際に自動的にそのパラメーターを認識してくれるようになります。
![create_entity.png](https://qiita-image-store.s3.amazonaws.com/0/26079/3bbb1f56-b4e8-00ab-ca55-dec656c7281c.png "create_entity.png")
![annotated.png](https://qiita-image-store.s3.amazonaws.com/0/26079/88e961c7-6b06-60a6-2464-20ba15100e8b.png "annotated.png")


この際の留意点として、Entityの名前が認識したいパラメーター名と同じになるように設定してください。このパラメーター名は後述するskillファイルのconstructor()で指定したrequired_parameterのプロパティ名のことを指します。

## スキルの追加

Intentに対応するスキルを作成するため、skillディレクトリ直下にskillファイルを追加します。このskillファイル名はapi.aiのIntentで設定したactionの値と同一である必要があります。例えば、api.aiで「ライトの色を変更する」というIntentを登録し、そのactionに **change-light-color** という値を設定したとすると、このIntentに対応するskillファイル名は **change-light-color.js** となります。

## skillファイルの構成

skillファイルはbot-expressフレームワークを使う中で開発者が唯一必ずBot独自の処理を記述する必要のあるファイルです。
skillファイルは大きく3つのパートで構成されます。下記にパート毎のサンプルコードと説明がありますが、skillファイルの全体像を確認するには、[sample_skill/change-light-color.js](./sample_skill/change-light-color.js)を参照してみてください。

**constructor(bot, bot_event, context)**

このスキルが完結するのに必要なパラメータ、およびそのパラメータを確認するためのメッセージを設定します。
例えば「ライトの色を変更する」というスキルの場合、「色」の指定が不可欠となるので、これをrequired_parameterプロパティにcolorとして登録します。

```
constructor(bot, bot_event, context) {
    this.required_parameter = {
        color: {
            message_to_confirm: {
                type: "template",
                altText: "何色にしますか？（青か赤か黄）",
                template: {
                    type: "buttons",
                    text: "何色にしますか？",
                    actions: [
                        {type:"postback",label:"青",data:"青"},
                        {type:"postback",label:"赤",data:"赤"},
                        {type:"postback",label:"黄",data:"黄"}
                    ]
                }
            },
            parser: this.parse_color
        }
    };
}
```

パラメータを収集する際、ユーザーに確認するメッセージをそのプロパティ配下のmessage_to_confirmプロパティに設定します。message_to_confirmに設定するメッセージはサポートされているいずれかのメッセージプラットフォームのメッセージフォーマットに従ってください。上記はLINEのフォーマットに従った例です。Facebook Messengerのフォーマットで同様のメッセージを表現すると下記のようになります。

```
color: {
    message_to_confirm: {
        text: "何色にしますか？",
        quick_replies: [
            {content_type:"text",title:"青",payload:"青"},
            {content_type:"text",title:"赤",payload:"赤"},
            {content_type:"text",title:"黄",payload:"黄"}
        ]
    },
    parser: this.parse_color
}
```

それぞれのメッセージフォーマットについては下記の公式APIリファレンスを参照ください。

- LINE: https://devdocs.line.me/ja/#send-message-object
- Facebook Messenger: https://developers.facebook.com/docs/messenger-platform/send-api-reference

いずれのフォーマットで設定した場合でも、イベントの送信元がLINEであればLINEのフォーマットに、Facebook MessengerであればFacebook Messengerのフォーマットに **ベストエフォートで** 変換されます。ベストエフォートなのは、各メッセージプラットフォームによって当然差異があるため、すべて変換できるとは限らないためです。万全を期す場合は、下記のようにサポートされているメッセージプラットフォームごとにメッセージオブジェクトを設定することもできます。

```
color: {
    message_to_confirm: {
        line: {
            type: "template",
            altText: "何色にしますか？（青か赤か黄）",
            template: {
                type: "buttons",
                text: "何色にしますか？",
                actions: [
                    {type:"postback",label:"青",data:"青"},
                    {type:"postback",label:"赤",data:"赤"},
                    {type:"postback",label:"黄",data:"黄"}
                ]
            }
        },
        facebook: {
            text: "何色にしますか？",
            quick_replies: [
                {content_type:"text",title:"青",payload:"青"},
                {content_type:"text",title:"赤",payload:"赤"},
                {content_type:"text",title:"黄",payload:"黄"}
            ]
        }
    },
    parser: this.parse_color
}
```

また、parserプロパティでこのパラメータを判定・変換するためのparse処理を指定できます。上記の例では明示的にthis.parse_colorと指定していますが、指定がない場合はデフォルトでthis.parse_パラメータ名のメソッドが実行されます。

また、パラメーター収集後に何らかのリアクションを取りたい場合、下記のようにreactionプロパティで指定することができます。

```
color: {
    message_to_confirm: {
        type: "template",
        altText: "何色にしますか？（青か赤か黄）",
        template: {
            type: "buttons",
            text: "何色にしますか？",
            actions: [
                {type:"postback",label:"青",data:"青"},
                {type:"postback",label:"赤",data:"赤"},
                {type:"postback",label:"黄",data:"黄"}
            ]
        }
    },
    parser: this.parse_color,
    reaction: (parse_result, parsed_value, resolve, reject) => {
        if (parse_result === true){
            if (parsed_value == "赤"){
                bot.queue([{
                    text: "センスいいですね！"
                }]);
            }
        }
        return resolve();
    }
}
```

reactionはパラメータのparse処理が終った後に実行されます。上記の例ではユーザーが「赤」と回答した時に「センスいいですね！」という返信を行うように記述しています。 *bot.queue(MESSAGE_OBJECT_ARRAY)は返信するメッセージをキューに入れておくためのメソッドです。finish()でbot.reply()が呼ばれたらキューに入っている全てのメッセージが一括で送信されます。*

reactionは4つの引数を取ります。
第一引数にはparse処理が成功したかどうかの結果がtrueまたはfalseでセットされています。
第二引数にはparse処理された値がセットされています。
第三引数はreaction成功時のコールバック関数です。
第四引数はreaction失敗時のコールバック関数です。

パラメータにはスキルの完結に不可欠なrequired_parameterと、補足的なoptional_parameterが指定できます。どちらかだけ設定することもできますし、両方同時に設定することもできます。optional_parameterのフォーマットはrequired_parameterと全く同じです。両者の違いは、required_parameterは埋まらない限りユーザーに確認メッセージが送信されるのに対し、optional_parameterはBot側から能動的に確認することはないという点です。

いずれのパラメータも特定されればcontext.confirmedに登録され、後述のfinish()の中で参照することができます。

**parse_パラメータ(value, resolve, reject)**

ユーザーが発したメッセージからパラメータを特定、変換する処理をパラメータごとに記述します。

例えば、ユーザーが「ライトの色を変えてください」というメッセージを送信すると、Botはcolorパラメータが埋まっていないことに気付き、「何色にしますか？」と質問します。それに対しユーザーが「赤色」と返信したとします。Botはこの時、このメッセージにサポートする色が指定されているかどうか、また、最終的にライトの色を変更するために色をカラーコードに変換する必要があります。この判定処理、および変換処理を必要に応じてparse_パラメータ()に記述します。

```
parse_color(value, resolve, reject){
    if (value === null || value == ""){
        return reject();
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
        return reject();
    }
    return resolve(parsed_value);
}
```

適切な値が判定できた場合には、その値をそのままかまたは必要に応じて変換した値をresolve()に渡してreturnします。上記の例ではCOLOR_MAPPINGSという定数にサポートする色一覧が設定されている前提で、その値に一致するかどうかを判定しています。また、一致した場合には同じくCOLOR_MAPPINGSに設定されている対応カラーコードに値を置き換え、それを返すという処理になっています。

適切な値が判定できなかった場合にはreject()を実行してreturnしてください。

**finish(bot, bot_event, context, resolve, reject)**

パラメータが全て揃ったら実行する最終処理を記述します。

```
finish(bot, bot_event, context, resolve, reject){
    return Hue.change_color(context.confirmed.color).then(
        (response) => {
            let messages = [{
                text: "了解しましたー。"
            }];
            return bot.reply(messages);
        }
    ).then(
        (response) => {
            return resolve(response);
        }
    ).catch(
        (response) => {
            return reject(response);
        }
    );
}
```

上記の例では別途定義されているライトの色を変更するサービスであるHue.change_color(color)を実行し、成功したら「了解しましたー。」というメッセージをユーザーに返信しています。

finish()には3つの引数が与えられます。第一引数（上記例ではbot）はメッセージ送信処理などが実装されたインスタンスです。利用しているメッセージプラットフォームを意識せずに処理を記述することができます。このインスタンスの機能は下記になります。

- **reply(messages)** : メッセージの返信をおこなうメソッドです。messagesにはいずれかのメッセージプラットフォームで定義されているフォーマットにメッセージオブジェクトを配列でセットします。
- **queue(messages)** : 返信するメッセージをキュー（実行待ち）に入れるためのメソッドです。キューに入れておいたメッセージはreply()が実行された時に一括で送信されます。reply()は一度のイベントで一回しか実行できないため、複数のメッセージを返信する必要がある場合はこのメソッドを利用してください。
- **change_message_to_confirm(parameter_name, message)** : parameter_nameで指定したパラメーターのmessage_to_confirmを一時的に変更します。これは主にparse処理が失敗した時にユーザーに再入力を促がす際に有用です。
- **collect(parameter_name)** : 明示的にパラメーターを収集するメソッドです。parameter_nameにはconstructor()に記述したいずれかのoptional_parameterを指定します。指定できるパラメーターは一つだけです。条件に応じて動的にパラメーターを収集する場合に便利です。

第二引数（上記例ではbot_event）はこの処理のトリガーとなったイベントです。例えばメッセージプラットフォームがLINEの場合、Webhookに送信されたevents配列の中の一つのeventオブジェクトが収められています。Facebookの場合はEntry配列の中のmessaging配列の一つのmessageオブジェクトが収められています。

第三引数（上記例ではcontext）はこれまでの会話から構造化された情報です。このcontextは下記のような構造になっています。

第四引数（上記例ではresolve）は処理が成功した際のコールバックです。

第五引数（上記例ではreject）は処理が失敗した際のコールバックです。

```
{
    intent: api.aiから返されたresult,
    to_confirm: 確認しなければならないパラメータのリスト,
    confirmed: 確認済みのパラメータのリスト,
    confirming: 現在確認中のパラメータ
    previous: {
        confirmed: 前回の会話で確認したパラメータのリスト
        message: これまでに送受信したメッセージ
    }
}
```

おそらく必ず必要になるのがconfirmedです。ここにはconstructor()でこのスキルで必須とされたパラメータとその値が収められています。前述の例ではcontext.confirmed.colorとして特定した色を取得しています。

このfinish()によって、開発者は自由に最終的なアクションを作成することができます。単に決まったフレーズを返信することもできますし、上記例のように他のクラウドサービスと連携して、IoTとドッキングさせることもできます。返信することだけが最終的なアクションではなく、アイデア次第で様々なモノ、サービスと連携できます。

# 制約

Webhookで現在サポートしているイベントは下記の通りです。

**LINE**
- message
- postback
- beacon

**Facebook**
- messages
- messaging-postbacks

現在キャッシュにmemory-cacheを利用しているため、サポートされているBotの実行環境はシングルインスタンスとなります。

--

Enjoy.
