# 概要

Node.jsで稼働するChat Botを開発するためのフレームワーク。Skillを追加するだけでBotの能力を拡張できます。
現在対応しているメッセージアプリはLINEです。

# 必要なサービス

- LINE
- api.ai

# インストール

```
$ npm install bot-dock --save
```

# 利用方法

まずbot-dockをインポートします。

```
let bot_dock = require('bot-dock');
```

次に、WebhookとなるURLを指定します。下記の例では http[s]://YOUR_HOSTNAME/webhook がWebhookのURLとなります。

```
app.use('/webhook', bot_dock({
    line_channel_id: 'あなたのLINE Channel ID', // 必須
    line_channel_secret: 'あなたのLINE Channel Secret', // 必須
    line_channel_access_token: 'あなたのLINE Channel Access Token', // 必須
    apiai_client_access_token: 'あなたのAPIAI Client Access Token', // 必須
    default_skill: 'あなたのskill', // 必須
    message_platform_type: 'line', // オプション。現在サポートされているのはlineのみ。デフォルトはline
    memory_retention: Botが会話を記憶する期間をミリ秒で指定, // オプション。デフォルトは60000 (60秒)
    skill_path: 'Skillのファイルが保存されるPATH', オプション。デフォルトは'/skill'
}));
```
