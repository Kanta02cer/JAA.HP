# 日本学生アンバサダー協会 公式ウェブサイト

## 概要

日本学生アンバサダー協会の公式ウェブサイトです。Jekyllを使用して構築されており、GitHub Pagesでホストされています。

## 技術スタック

- **Jekyll**: 静的サイトジェネレーター
- **GitHub Pages**: ホスティング
- **HTML/CSS/JavaScript**: フロントエンド
- **Netlify CMS**: コンテンツ管理

## セットアップ

### 前提条件

- Ruby 3.2以上
- Bundler
- Git

### ローカル開発環境の構築

1. リポジトリをクローン
```bash
git clone https://github.com/Kanta02cer/JAA.HP.git
cd JAA.HP
```

2. 依存関係をインストール
```bash
bundle install
```

3. ローカルサーバーを起動
```bash
bundle exec jekyll serve
```

4. ブラウザで `http://localhost:4000` にアクセス

## GitHub Pagesでの公開

### 1. リポジトリの設定

1. GitHubリポジトリの設定ページに移動
2. **Pages** セクションを選択
3. **Source** で **GitHub Actions** を選択

### 2. ブランチの設定

- **Source**: `main` ブランチ
- **Build and deployment**: GitHub Actions

### 3. カスタムドメイン（オプション）

1. **Custom domain** フィールドにドメインを入力
2. **Save** をクリック
3. DNSレコードを設定

## ファイル構造

```
JAA.HP/
├── _config.yml          # Jekyll設定
├── _layouts/            # レイアウトテンプレート
├── _news/              # ニュース記事
├── assets/             # CSS、画像、その他アセット
├── js/                 # JavaScriptファイル
├── admin/              # Netlify CMS管理画面
├── .github/            # GitHub Actions設定
└── Gemfile             # Ruby依存関係
```

## コンテンツ管理

### ニュース記事の追加

1. `_news/` フォルダに新しいMarkdownファイルを作成
2. ファイル名は `YYYY-MM-DD-title.md` の形式
3. フロントマターに必要なメタデータを追加

例：
```markdown
---
layout: news-detail
title: "記事タイトル"
description: "記事の説明"
date: 2025-01-20
category: "プレスリリース"
tags: ["タグ1", "タグ2"]
author: "日本学生アンバサダー協会"
---

記事の内容...
```

### Netlify CMSでの管理

1. `/admin` にアクセス
2. GitHubアカウントでログイン
3. 記事の作成・編集・削除が可能

## デプロイ

### 自動デプロイ

- `main` ブランチにプッシュすると自動的にデプロイされます
- GitHub Actionsがビルドとデプロイを実行

### 手動デプロイ

```bash
# ビルド
bundle exec jekyll build

# デプロイ（GitHub Pages）
git add .
git commit -m "Update site"
git push origin main
```

## カスタマイズ

### スタイルの変更

- `assets/css/style.css` を編集
- レスポンシブデザイン対応済み

### レイアウトの変更

- `_layouts/` フォルダ内のファイルを編集
- 新しいレイアウトは `_layouts/` に追加

### 設定の変更

- `_config.yml` でサイト全体の設定を変更
- 変更後は再ビルドが必要

## トラブルシューティング

### ビルドエラー

1. Rubyのバージョンを確認
2. 依存関係を再インストール
```bash
bundle update
```

### デプロイエラー

1. GitHub Actionsのログを確認
2. ファイルパスとファイル名を確認
3. フロントマターの構文を確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## お問い合わせ

- メール: info@jaa.or.jp
- GitHub: [Kanta02cer/JAA.HP](https://github.com/Kanta02cer/JAA.HP)

## 更新履歴

- 2025-01-20: 初回リリース
- 2025-01-20: GitHub Pages対応
