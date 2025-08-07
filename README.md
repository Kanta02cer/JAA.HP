# 日本学生アンバサダー協会 公式ホームページ

## 概要

日本学生アンバサダー協会の公式ホームページです。学生の挑戦に寄り添うパートナーとして、企業と学生をつなぐ架け橋となる一般社団法人の活動を紹介しています。

## 機能

### 主要機能
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップに対応
- **SEO最適化**: メタタグ、構造化データ、サイトマップ対応
- **アクセシビリティ**: WCAG準拠のデザイン
- **Cookie管理**: GDPR準拠のCookie同意システム
- **Google Analytics**: アクセス解析機能

### ニュース機能（CMS対応）
- **動的コンテンツ**: JavaScriptによる動的ニュース表示
- **カテゴリフィルター**: プレスリリース、メディア掲載、イベント、お知らせ
- **管理画面**: Netlify CMSによる記事管理
- **自動デプロイ**: GitHub Actionsによる自動更新

## 技術スタック

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: Tailwind CSS + カスタムスタイル
- **JavaScript**: ES6+ モジュラー設計
- **フォント**: Inter, Noto Sans JP, Zen Old Mincho

### CMS・管理
- **Netlify CMS**: ヘッドレスCMS
- **GitHub Pages**: ホスティング
- **GitHub Actions**: CI/CD

### 分析・SEO
- **Google Analytics**: アクセス解析
- **Google Tag Manager**: タグ管理
- **構造化データ**: JSON-LD

## ファイル構成

```
JAA.HP-1/
├── index.html              # トップページ
├── about.html              # 協会について
├── business.html           # 事業内容
├── ambassador.html         # アンバサダー制度
├── partnership.html        # パートナーシップ
├── news.html              # ニュース一覧
├── news-detail.html       # 動的ニュース詳細
├── contact.html           # お問い合わせ
├── privacy.html           # プライバシーポリシー
├── robots.txt             # 検索エンジン設定
├── sitemap.xml            # サイトマップ
├── _config.yml            # Netlify CMS設定
├── admin/
│   └── index.html         # CMS管理画面
├── _news/                 # ニュース記事（Markdown）
│   └── 2025-10-01-press-release.md
├── js/
│   └── news-loader.js     # ニュース管理スクリプト
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions設定
└── README.md              # このファイル
```

## セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/JAA.HP-1.git
cd JAA.HP-1
```

### 2. ローカル開発サーバーの起動
```bash
# Python 3の場合
python -m http.server 8000

# Node.jsの場合
npx serve .

# PHPの場合
php -S localhost:8000
```

### 3. CMS管理画面へのアクセス
```
http://localhost:8000/admin/
```

## ニュース記事の管理

### 記事の追加
1. `/admin/` にアクセス
2. "ニュース記事" → "新規作成"
3. 以下の項目を入力：
   - タイトル
   - 説明
   - 日付
   - カテゴリ
   - タグ
   - 画像（オプション）
   - 内容（Markdown形式）

### 記事の編集
1. `/admin/` にアクセス
2. "ニュース記事" → 編集したい記事を選択
3. 内容を変更して保存

### 手動での記事追加
`_news/` ディレクトリにMarkdownファイルを作成：

```markdown
---
title: "記事タイトル"
description: "記事の説明"
date: 2025-01-01
category: "プレスリリース"
tags: ["タグ1", "タグ2"]
image: "画像URL"
keywords: "SEOキーワード"
author: "著者名"
draft: false
---

記事の内容（Markdown形式）
```

## デプロイ

### 自動デプロイ
- `main` ブランチにプッシュすると自動的にGitHub Pagesにデプロイされます
- GitHub Actionsが設定済み

### 手動デプロイ
1. 変更をコミット
```bash
git add .
git commit -m "Update content"
git push origin main
```

2. GitHub Pagesの設定でソースブランチを `main` に設定

## カスタマイズ

### スタイルの変更
- `index.html` の `<style>` タグ内を編集
- Tailwind CSSクラスを追加・変更

### ニュース機能の拡張
- `js/news-loader.js` を編集
- 新しいカテゴリやフィールドを追加

### CMS設定の変更
- `_config.yml` を編集
- 新しいコレクションやフィールドを追加

## ブラウザサポート

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## ライセンス

© 2025 Japan Ambassador Association. All Rights Reserved.

## お問い合わせ

- **公式サイト**: [https://kanta02cer.github.io/JAA.HP/](https://kanta02cer.github.io/JAA.HP/)
- **Instagram**: [@jaa_ed.official](https://www.instagram.com/jaa_ed.official/)
- **お問い合わせ**: [contact.html](contact.html)
