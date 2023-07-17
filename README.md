# みんな俺 匿名チャット

- [SkyWay](https://skyway.ntt.com/ja/)を利用したアバターを利用したチャットサービス
  - `2023年1月31日(火)以降のver`
- 詳細は[こちらの記事](https://)

## Getting Started (for local)

1. SkyWayでアカウント登録を実施して APP_ID と シークレットキーを取得しておく
1. `mv env.template env.local`
  - APP_ID: SkyWay アプリケーションID
  - SKYWAY_SECRET_KEY: SkyWay シークレットキー
1. VRMモデルをダウンロードしてpublic以下に設置
  - 当該リポジトリでは [バーチャルジョイマン高木](https://campaign.showroom-live.com/takagi/#:~:text=%E7%94%BB%E5%83%8F%E3%82%92%E3%83%97%E3%83%AC%E3%82%BC%E3%83%B3%E3%83%88%20%E2%99%AA-,%E3%83%90%E3%83%BC%E3%83%81%E3%83%A3%E3%83%AB%E3%82%B8%E3%83%A7%E3%82%A4%E3%83%9E%E3%83%B3%E9%AB%98%E6%9C%A8%20%E3%82%A2%E3%83%90%E3%82%BF%E3%83%BC%E5%88%A9%E7%94%A8%E8%A6%8F%E7%B4%84,-VJ%2DTAKAGI%20%E3%82%A2%E3%83%90%E3%82%BF%E3%83%BC)を利用してるので、規約を確認して各自ダウンロード後、`public/vj_takagi.vrm`として設置する
  - (変数名やファイル名諸々を変更すれば他のVRMも利用可能だと思われるが未検証)
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
