# IT English Trainee

IT エンジニア向け英会話トレーニングアプリ

## プロジェクト構成

```
src/
├── frontend/          # React / TypeScript フロントエンド
│   ├── src/
│   │   ├── api/       # API クライアント（Axios + Amplify）
│   │   ├── assets/    # 静的ファイル
│   │   ├── components/# 再利用可能コンポーネント
│   │   ├── hooks/     # カスタムフック
│   │   ├── pages/     # ページコンポーネント
│   │   ├── store/     # Redux Toolkit ストア
│   │   ├── types/     # 型定義
│   │   └── utils/     # ユーティリティ関数
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   └── .prettierrc
│
├── backend/           # AWS Lambda / TypeScript バックエンド
│   ├── src/
│   │   ├── functions/
│   │   │   ├── chat-handler/       # AI対話処理（Bedrock + Polly）
│   │   │   ├── feedback-generator/ # フィードバック生成（SQS トリガー）
│   │   │   ├── session-manager/    # セッション管理
│   │   │   ├── user-manager/       # ユーザー管理
│   │   │   └── history-manager/    # 学習履歴管理
│   │   └── shared/
│   │       ├── clients/    # AWS SDK クライアント
│   │       ├── middleware/  # Lambda ミドルウェア
│   │       ├── types/       # 共通型定義
│   │       └── utils/       # ユーティリティ（Exponential Backoff 等）
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   └── .prettierrc
│
├── cdk/               # AWS CDK インフラ定義（TypeScript）
│   ├── bin/
│   │   └── app.ts     # CDK エントリーポイント
│   ├── lib/
│   │   ├── it-english-trainee-stack.ts  # メインスタック
│   │   └── constructs/
│   │       ├── cognito-construct.ts
│   │       ├── dynamodb-construct.ts
│   │       ├── s3-construct.ts
│   │       ├── sqs-construct.ts
│   │       ├── lambda-construct.ts
│   │       └── apigateway-construct.ts
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
│
└── .github/
    └── workflows/
        └── ci.yml     # GitHub Actions CI（PR マージ前自動実行）
```

## 環境

| 環境 | 用途 |
|------|------|
| `dev` | 開発・動作確認 |
| `stg` | ステージング・結合テスト |
| `prod` | 本番 |

## セットアップ

### フロントエンド

```bash
cd src/frontend
npm install
npm start
```

### バックエンド

```bash
cd src/backend
npm install
npm run build
npm test
```

### CDK

```bash
cd src/cdk
npm install
npm run synth:dev   # dev 環境の CloudFormation テンプレート生成
npm run deploy:dev  # dev 環境へデプロイ
```

## 開発ルール

- TypeScript の `any` 型使用禁止（ESLint で `error` 設定）
- 変数・関数名は `camelCase`、環境変数は `SCREAMING_SNAKE_CASE`
- Lambda 関数は単一責任原則（1関数1役割）
- Bedrock 呼び出しはクロスリージョン（`us-east-1`）
- フィードバック生成は必ず SQS 経由の非同期処理
- Bedrock 呼び出しは Exponential Backoff で最大3回リトライ
- テストカバレッジ目標: 全体 80% 以上、Bedrock/Transcribe 連携 Lambda は 90% 以上
- APIキー・シークレットは AWS Secrets Manager 経由で取得（ハードコーディング禁止）
