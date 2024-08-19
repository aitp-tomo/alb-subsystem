# 概要

下記ブログにて紹介するシステムのソースです。
TODO URL 記載

# 各バージョン

- node: v20.16.0
- TypeScript: Version 3.7.5
- cdk: 2.152.0 (build faa7d79)

# 構築手順

## GitHub の準備

1. 本ソースがプッシュされた GitHub リポジトリを作成してください。
1. システム構築用のブランチを作成してください。各ブランチ毎にシステムが構築されますので、例えば開発環境用に develop ブランチ、本番環境用に production ブランチといった具合にブランチを作成していくと良いでしょう。

## GitHub と AWS の接続

[GitHub リポジトリと AWS との接続を作成](https://docs.aws.amazon.com/ja_jp/codepipeline/latest/userguide/connections-github.html)します。

## 環境変数の記述

[.env](./.env)ファイルに環境変数を以下の通りに記述し、システム構築に用いるブランチにプッシュします。

- `APP_NAME`: アプリ名
- `ENV_NAME`: 環境名 e.g. dev, prod...
- `VPC_ID`: VPC ID
- `INTERNET_GATEWAY_ID`: VPC のインターネットゲートウェイの ID
- `CIDR_BLOCKS`: 新規作成するサブネットの CIDR ブロック(「,」区切りで複数指定可能)
- `AVAILABILITY_ZONES`: VPC に新規作成するサブネットの AZ(「,」区切りで複数指定可能)
- `REPO_OWNER_NAME`: パイプラインのソースリポジトリ所有者名
- `REPO_NAME`: パイプラインのソースリポジトリ名
- `BRANCH_NAME`: パイプラインのソースブランチ名
- `CONNECTION_ID`: CodeStar と GitHub との connections の ID(ARN の最後の`/`より右側の文字列)
- `DESIRED_COUNT`: タスクの数
- `MIN_HEALTHY_PERCENT`: 最小実行タスク %
- `MAX_HEALTHY_PERCENT`: 最大実行タスク %
- `CPU`: タスク及びコンテナの CPU(MiB 単位)
- `MEMORY_LIMIT_MIB`: タスク及びコンテナの メモリ(MiB 単位)
- `IS_AUTO_SCALABLE`: オートスケーリングを有効化するか否か(`TRUE`とすると有効化)
- `MIN_CAPACITY`: オートスケーリングの最小キャパシティ
- `MAX_CAPACITY`: オートスケーリングの最大キャパシティ
- `CPU_SCALING`: オートスケーリングで追跡する CPU 使用率閾値
- `MEMORY_LIMIT_MIB`: オートスケーリングで追跡するメモリ使用率閾値
- `LISTENER_RULE_PRIORITY`: サブシステム用に追加するリスナールールの優先度
- `LISTENER_RULE_PRIORITY`: サブシステム用に追加するリスナールールの優先度
- `LISTENER_RULE_PATH_PATTERNS`: リスナールールの条件に加えるパスパターン(「,」区切りで複数指定可能)
- `HEALTHCHECK_PATH`: ALB ターゲットグループにおけるヘルスチェックパス
- `HEALTH_CHECK_TIMEOUT`: ヘルスチェックのタイムアウト
- `HEALTH_CHECK_INTERVAL`: ヘルスチェックの間隔
- `LISTENER_ID`: リスナーの ID(ARN の`listener/app/`より右側の文字列)
- `ALB_SECURITY_GROUP_ID`: ALB のセキュリティグループの ID
- `ALERT_EMAIL_ADDRESSES`: alert レベルのアラームを受け取るメールアドレス(「,」区切りで複数指定可能)
- `ALARM_ACTIONS_ENABLED`: アラームの有効するかどうか(TRUE とすると有効化)

## デプロイ

本ソースのトップディレクトリで、下記コマンドを実行します。

```
$ npm install
$ cdk bootstrap
$ cdk deploy
```

# 構築後の改修方法

CodePipeline で GitHub リポジトリと接続された CI/CD パイプラインが作成されています。なので以前のバージョンも含めたリリースの実行や実行中のリリース処理の中断なども行えます。
