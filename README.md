# みんな俺 匿名会議

- [SkyWay](https://skyway.ntt.com/ja/)を利用したアバターを利用した匿名会議サービス
- 詳細は[こちらの記事](https://qiita.com/water_resistant/items/dac22c0077e06c72819f)を見てください。
  - 実装解説から作成背景まで書いてます。

## Usage

1. SkyWayでアカウント登録を実施して `APP_ID` と `シークレットキー`を取得
1. `mv env.template env.local`
  - `APP_ID: SkyWay アプリケーションID`
  - `SKYWAY_SECRET_KEY: SkyWay シークレットキー`
1. npm install
1. - npm run dev

## Requirement

- [SkyWay](https://skyway.ntt.com/ja/docs/)
- [MediaPipe](https://developers.google.com/mediapipe)
- [kalidokit](https://github.com/yeemachine/kalidokit)
- [Tone.js](https://tonejs.github.io/)

## Note

- MacOS Chromeで動作確認
- [バーチャルジョイマン高木](https://campaign.showroom-live.com/takagi/)をVRMとして使用
  - 利用規約については上記リンクを確認後同意の上ご利用ください。
- [ファンタジー用語メーカー](https://namaemaker.net/archives/fantasy-term.html)で生成した文字列を利用
