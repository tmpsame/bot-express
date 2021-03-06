![Build Status](https://travis-ci.org/nkjm/bot-express.svg?branch=master)

# 概要

bot-expressはオーダーメイドのChatbotを高速に開発するためのフレームワークでNode.jsで動作します。開発者はフォーマットにしたがって「スキル」を追加するだけでChatbotの能力を拡張していくことができます。

# bot-expressに含まれる主な機能

- NLP（Natural Language Processing）によるメッセージの意図解析
- 複数メッセンジャーへの対応（LINEとFacebook Messengerに対応）
- 文脈の記憶
- ユーザーからの情報収集・リアクション
- 多言語翻訳

# 構成

### コンポーネント

bot-expressをベースとしたChatbotは下記のコンポーネントで構成されます。

![アーキテクチャー](https://dl.dropboxusercontent.com/u/149862/bot-express_architecture.png)

- メッセンジャー（現在はLINEまたはFacebook Messenger）
- 自然言語処理のサービス（現在は[api.ai](https://api.ai)）
- Chatbot本体（bot-expressベースのNode.jsアプリ）

開発者はChatbot本体に「スキル」を追加することでChatbotの能力を拡張していくことができます。丁寧で品質の高いスキルを開発することでChatbotの精度が上がり、スキルの数を増やすことでChatbotは多くのリクエストに応えることができるようになります。このスキルは1スキル:1スキルスクリプトという形で作成します。

### 基本的な動作パターン

最も基本的な動作は下記のようになります。

1. ユーザーがChatbotにメッセージを送信。
2. bot-expressがメッセージを自然言語処理サービスに連携してメッセージの意図を解析。
3. 解析された意図に応じてbot-expressが利用するスキルを選択。
4. スキルが実行される。（例：メッセージ返信、データベース更新、IoTデバイスへの命令送信など）

bot-expressはスキルに定められたアクションを完了するために必要に応じて対話を続けていきます。対話は必要な情報を収集するためにおこなわれ、ユーザーからの返信メッセージはスキルに定められたパース処理とリアクションが自動的に適用されていきます。

# Getting Started

まずはチュートリアルをご覧ください。必要なすべての流れをステップ・バイ・ステップでカバーしています。

[bot-expressを使ってピザ注文受付Botを60分で作ってみる](http://qiita.com/nkjm/items/1ac1a73d018c13deae30)

また、bot-expressのsample_skillディレクトリにスキルのサンプルがいくつか収められていますのでスキル開発の参考にしてみてください。

[スキルのサンプル](/sample_skill/)

# リファレンス

bot-expressの設定オプション、スキルスクリプトの構成、提供されるライブラリについては下記のリファレンスに完全な情報が記載されています。

https://nkjm.github.io/bot-express

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
