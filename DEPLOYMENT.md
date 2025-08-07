# GitHub Pages デプロイメントガイド

## 概要

このプロジェクトはGitHub Pagesを使用して自動デプロイされます。

## デプロイメント設定

### 1. GitHubリポジトリの設定

1. GitHubリポジトリの設定ページに移動
2. **Pages** セクションを選択
3. **Source** で **GitHub Actions** を選択
4. **Save** をクリック

### 2. 権限の確認

リポジトリの設定で以下を確認してください：

- **Settings > Actions > General**
  - Actions permissions: "Allow all actions and reusable workflows"
  - Workflow permissions: "Read and write permissions"

### 3. 環境の設定

1. **Settings > Environments**
2. **New environment** をクリック
3. Environment name: `github-pages`
4. **Configure environment** をクリック
5. **Save protection rules** をクリック

## デプロイメントプロセス

### 自動デプロイ

- `main` ブランチにプッシュすると自動的にデプロイされます
- GitHub Actionsが以下の処理を実行：
  1. コードのチェックアウト
  2. Ruby環境のセットアップ
  3. 依存関係のインストール
  4. Jekyllサイトのビルド
  5. GitHub Pagesへのデプロイ

### 手動デプロイ

1. GitHubリポジトリの **Actions** タブに移動
2. **Deploy to GitHub Pages** ワークフローを選択
3. **Run workflow** をクリック

## トラブルシューティング

### 権限エラー

```
remote: Permission to Kanta02cer/JAA.HP.git denied to github-actions[bot].
```

**解決方法:**
1. リポジトリの設定で **Settings > Actions > General** を確認
2. Workflow permissionsを "Read and write permissions" に設定
3. 環境設定で `github-pages` 環境が正しく設定されているか確認

### ビルドエラー

**解決方法:**
1. GitHub Actionsのログを確認
2. ローカルで `bundle exec jekyll build` を実行してエラーを確認
3. 依存関係を更新: `bundle update`

### デプロイエラー

**解決方法:**
1. GitHub Pagesの設定を確認
2. ブランチ名が `main` であることを確認
3. ワークフローファイルの構文を確認

## ファイル構造

```
.github/
└── workflows/
    └── pages.yml          # GitHub Pages用ワークフロー

_config.yml                # Jekyll設定
Gemfile                    # Ruby依存関係
.nojekyll                 # Jekyll処理無効化
```

## アクセスURL

デプロイ成功後、以下のURLでアクセス可能：

- **本番環境**: https://kanta02cer.github.io/JAA.HP/
- **開発環境**: ローカルで `bundle exec jekyll serve`

## 更新手順

1. コードを変更
2. 変更をコミット
3. `main` ブランチにプッシュ
4. GitHub Actionsでデプロイ状況を確認
5. デプロイ完了後、サイトを確認

## 注意事項

- デプロイには数分かかる場合があります
- 初回デプロイは特に時間がかかります
- エラーが発生した場合は、GitHub Actionsのログを確認してください
