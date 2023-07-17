# みんな俺 匿名会議

- [SkyWay](https://skyway.ntt.com/ja/)を利用したアバターを利用した匿名会議サービス
  - `2023年1月31日(火)以降のver`
- 詳細は[こちらの記事](https://)

## Getting Started (for local)

1. SkyWayでアカウント登録を実施して APP_ID と シークレットキーを取得しておく
1. `mv env.template env.local`
  - APP_ID: SkyWay アプリケーションID
  - SKYWAY_SECRET_KEY: SkyWay シークレットキー
1. npm install
  - npm run dev

## Other

- [バーチャルジョイマン高木](https://campaign.showroom-live.com/takagi/)
- [SkyWay Document](https://skyway.ntt.com/ja/docs/)
- [tailblocks](https://tailblocks.cc/)
- [ファンタジー用語メーカー](https://namaemaker.net/archives/fantasy-term.html)
  - 出力文字列データを利用
- [mediapipe](https://developers.google.com/mediapipe)
  - FaceLandmark取得とメッシュ作成に利用
- [kalidokit](https://github.com/yeemachine/kalidokit)
  - mediapipeのFaceLandmarkから[rotationなどを計算する処理に利用](https://github.com/yeemachine/kalidokit/blob/main/src/FaceSolver/calcHead.ts)
