# 概要

Node.jsで稼働するChat Botを開発するためのフレームワーク。文脈の理解、必要なパラメータの収集などの機能が搭載されており、開発者はSkillを追加するだけでBotの能力を拡張できることが特徴です。現在対応しているメッセージアプリはLINEですが、近々にFacebook MessengerやSlack等への対応を見込んでいます。

# 必要なサービス

- LINE
- api.ai

# インストール

```
$ npm install bot-express --save
```

# 利用方法

まずbot-expressをインポートします。

```
let bot_express = require('bot-express');
```

次にミドルウェア設定でWebhookとなるURLを指定し、オプションを指定します。
下記の例では http[s]://YOUR_HOSTNAME/webhook がWebhookのURLとなります。

```
app.use('/webhook', bot_dock({
    line_channel_id: 'あなたのLINE Channel ID', // 必須
    line_channel_secret: 'あなたのLINE Channel Secret', // 必須
    line_channel_access_token: 'あなたのLINE Channel Access Token', // 必須
    apiai_client_access_token: 'あなたのAPIAI Client Access Token', // 必須
    default_skill: 'あなたのskill', // 必須
    skill_path: 'Skillのファイルが保存される相対PATH', オプション。デフォルトは'./skill'
    message_platform_type: 'line', // オプション。現在サポートされているのはlineのみ。デフォルトはline
    memory_retention: Botが会話を記憶する期間をミリ秒で指定 // オプション。デフォルトは60000 (60秒)
}));
```

最後にskillディレクトリ直下にskillファイルを追加します。このskillファイル名はapi.aiが返すresponse.result.actionの値と同一である必要があります。例えば、api.aiでchange-light-colorというactionを返すintentを設定したとすると、このintentに対応するskillファイル名はchange-light-color.jsとなります。
```
