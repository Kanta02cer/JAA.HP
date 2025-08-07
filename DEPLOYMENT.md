# GitHub Pages デプロイ手順

## 自動デプロイ（推奨）

このプロジェクトはGitHub Actionsを使用して自動デプロイが設定されています。

### 1. リポジトリの設定

1. GitHubでリポジトリの設定ページに移動
2. **Settings** → **Pages** を選択
3. **Source** で **GitHub Actions** を選択

### 2. デプロイの実行

`main` ブランチにプッシュすると自動的にデプロイされます：

```bash
git add .
git commit -m "Update website content"
git push origin main
```

## 手動デプロイ

### 1. リポジトリの設定

1. GitHubでリポジトリの設定ページに移動
2. **Settings** → **Pages** を選択
3. **Source** で **Deploy from a branch** を選択
4. **Branch** で **main** を選択
5. **Folder** で **/ (root)** を選択
6. **Save** をクリック

### 2. デプロイの確認

デプロイが完了すると、以下のURLでアクセスできます：
```
https://[username].github.io/[repository-name]/
```

## トラブルシューティング

### デプロイが失敗する場合

1. **Actions** タブでワークフローの実行状況を確認
2. エラーログを確認して問題を特定
3. 必要に応じてワークフローファイルを修正

### ページが表示されない場合

1. **Settings** → **Pages** でデプロイ状況を確認
2. ブランチとフォルダの設定が正しいか確認
3. ファイル名が正しいか確認（`index.html` が存在するか）

### カスタムドメインの設定

1. **Settings** → **Pages** → **Custom domain** でドメインを設定
2. `CNAME` ファイルにドメイン名を記入
3. DNS設定でGitHub PagesのIPアドレスを設定

## ファイル構成

```
JAA.HP-1/
├── .github/workflows/     # GitHub Actions設定
│   ├── deploy.yml         # デプロイワークフロー
│   └── static.yml         # 静的サイトデプロイ
├── index.html             # トップページ
├── about.html             # 協会について
├── business.html          # 事業内容
├── ambassador.html        # アンバサダー制度
├── partnership.html       # パートナーシップ
├── news.html             # ニュース一覧
├── contact.html          # お問い合わせ
├── privacy.html          # プライバシーポリシー
├── robots.txt            # 検索エンジン設定
├── sitemap.xml           # サイトマップ
├── _redirects            # リダイレクト設定
├── CNAME                 # カスタムドメイン設定
├── package.json          # プロジェクト設定
├── .gitignore            # Git除外設定
└── DEPLOYMENT.md         # このファイル
```

## 注意事項

- 静的サイトのため、サーバーサイドの処理はできません
- JavaScriptによる動的コンテンツは正常に動作します
- 外部APIとの連携は可能です
- ファイルサイズは制限があります（100MB以下推奨）

## サポート

デプロイに関する問題が発生した場合は、以下を確認してください：

1. GitHub Actionsのログ
2. ブラウザの開発者ツール
3. ネットワークタブでのエラー
4. コンソールでのJavaScriptエラー
