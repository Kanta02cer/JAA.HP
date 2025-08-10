// GitHub同期機能
class GitHubSync {
    constructor() {
        this.config = {
            owner: 'kanta02cer',
            repo: 'JAA.HP-1',
            branch: 'main',
            token: null // GitHub Personal Access Token
        };
        this.isSyncing = false;
    }

    // 設定を初期化
    async initialize() {
        try {
            // 設定をローカルストレージから読み込み
            const savedConfig = localStorage.getItem('github-sync-config');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
            
            // 設定画面を表示
            this.showConfigModal();
        } catch (error) {
            console.error('GitHub同期の初期化に失敗:', error);
            showError('GitHub同期の初期化に失敗しました');
        }
    }

    // 設定モーダルを表示
    showConfigModal() {
        const modal = document.createElement('div');
        modal.id = 'github-config-modal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">GitHub同期設定</h3>
                        <button onclick="this.closest('#github-config-modal').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">GitHub Personal Access Token</label>
                            <input type="password" id="github-token" value="${this.config.token || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                   placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
                            <p class="text-xs text-gray-500 mt-1">
                                <a href="https://github.com/settings/tokens" target="_blank" class="text-blue-600 hover:underline">
                                    GitHubでトークンを生成
                                </a>
                            </p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">リポジトリオーナー</label>
                                <input type="text" id="github-owner" value="${this.config.owner}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">リポジトリ名</label>
                                <input type="text" id="github-repo" value="${this.config.repo}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ブランチ</label>
                            <input type="text" id="github-branch" value="${this.config.branch}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end space-x-3">
                        <button onclick="this.closest('#github-config-modal').remove()" 
                                class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400">
                            キャンセル
                        </button>
                        <button onclick="githubSync.saveConfig()" 
                                class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                            設定を保存
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // 設定を保存
    saveConfig() {
        this.config.token = document.getElementById('github-token').value;
        this.config.owner = document.getElementById('github-owner').value;
        this.config.repo = document.getElementById('github-repo').value;
        this.config.branch = document.getElementById('github-branch').value;
        
        // ローカルストレージに保存
        localStorage.setItem('github-sync-config', JSON.stringify(this.config));
        
        // モーダルを閉じる
        document.getElementById('github-config-modal').remove();
        
        showSuccess('GitHub同期設定を保存しました');
    }

    // 同期を開始
    async startSync(articles = null) {
        if (this.isSyncing) {
            showWarning('既に同期処理が実行中です');
            return;
        }

        if (!this.config.token) {
            showError('GitHub Personal Access Tokenが設定されていません');
            this.showConfigModal();
            return;
        }

        this.isSyncing = true;
        showInfo('GitHubとの同期を開始しています...');

        try {
            // 記事データを取得（引数がない場合）
            if (!articles) {
                articles = await this.getArticlesFromFirestore();
            }

            // 同期処理を実行
            const result = await this.syncArticles(articles);
            
            if (result.success) {
                showSuccess(`GitHubとの同期が完了しました。${result.syncedCount}件の記事を同期しました。`);
            } else {
                showError(`GitHubとの同期に失敗しました: ${result.error}`);
            }
        } catch (error) {
            console.error('GitHub同期エラー:', error);
            showError('GitHubとの同期に失敗しました');
        } finally {
            this.isSyncing = false;
        }
    }

    // Firestoreから記事を取得
    async getArticlesFromFirestore() {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('news')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('記事取得エラー:', error);
            throw new Error('記事の取得に失敗しました');
        }
    }

    // 記事をGitHubと同期
    async syncArticles(articles) {
        try {
            let syncedCount = 0;
            
            for (const article of articles) {
                try {
                    await this.syncArticle(article);
                    syncedCount++;
                    
                    // 進捗を表示
                    showInfo(`${syncedCount}/${articles.length}件の記事を同期中...`);
                    
                } catch (error) {
                    console.error(`記事 ${article.title} の同期エラー:`, error);
                    // 個別の記事の同期エラーは記録するが、処理は続行
                }
            }
            
            return {
                success: true,
                syncedCount: syncedCount,
                totalCount: articles.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 個別記事を同期
    async syncArticle(article) {
        try {
            // 記事のMarkdownファイルを作成
            const markdown = this.createMarkdown(article);
            const filename = this.generateFilename(article);
            
            // GitHubにファイルをアップロードまたは更新
            await this.uploadToGitHub(filename, markdown, article);
            
        } catch (error) {
            throw new Error(`記事「${article.title}」の同期に失敗: ${error.message}`);
        }
    }

    // Markdownファイルを作成
    createMarkdown(article) {
        const date = article.createdAt?.toDate?.() || new Date();
        const formattedDate = date.toISOString().split('T')[0];
        
        let markdown = `---
title: "${article.title}"
date: ${formattedDate}
category: "${article.category || 'お知らせ'}"
status: "${article.status || 'published'}"
excerpt: "${article.excerpt || ''}"
tags: ${JSON.stringify(article.tags || [])}
featured: ${article.featured || false}
seo:
  metaTitle: "${article.seo?.metaTitle || ''}"
  metaDescription: "${article.seo?.metaDescription || ''}"
  keywords: ${JSON.stringify(article.seo?.keywords || [])}
---

`;

        // 画像がある場合は追加
        if (article.featuredImage) {
            markdown += `![${article.title}](${article.featuredImage})

`;
        }

        // 記事本文を追加
        markdown += article.content || '';
        
        return markdown;
    }

    // ファイル名を生成
    generateFilename(article) {
        const date = article.createdAt?.toDate?.() || new Date();
        const dateStr = date.toISOString().split('T')[0];
        const slug = article.slug || this.generateSlug(article.title);
        
        return `_news/${dateStr}-${slug}.md`;
    }

    // スラッグを生成
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // GitHubにファイルをアップロード
    async uploadToGitHub(filename, content, article) {
        try {
            // ファイルが既に存在するかチェック
            const existingFile = await this.getFileFromGitHub(filename);
            
            if (existingFile) {
                // 既存ファイルを更新
                await this.updateFileOnGitHub(filename, content, existingFile.sha, article);
            } else {
                // 新規ファイルを作成
                await this.createFileOnGitHub(filename, content, article);
            }
            
        } catch (error) {
            throw new Error(`GitHubへのアップロードに失敗: ${error.message}`);
        }
    }

    // GitHubからファイルを取得
    async getFileFromGitHub(filename) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${filename}`,
                {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.status === 200) {
                return await response.json();
            } else if (response.status === 404) {
                return null; // ファイルが存在しない
            } else {
                throw new Error(`GitHub API エラー: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`ファイル取得に失敗: ${error.message}`);
        }
    }

    // GitHubにファイルを作成
    async createFileOnGitHub(filename, content, article) {
        const commitMessage = `Add: ${article.title}`;
        
        const response = await fetch(
            `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${filename}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: btoa(unescape(encodeURIComponent(content))),
                    branch: this.config.branch
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`ファイル作成に失敗: ${error.message}`);
        }
    }

    // GitHubのファイルを更新
    async updateFileOnGitHub(filename, content, sha, article) {
        const commitMessage = `Update: ${article.title}`;
        
        const response = await fetch(
            `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${filename}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: sha,
                    branch: this.config.branch
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`ファイル更新に失敗: ${error.message}`);
        }
    }

    // 設定をテスト
    async testConnection() {
        if (!this.config.token) {
            showError('GitHub Personal Access Tokenが設定されていません');
            return false;
        }

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`,
                {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const repo = await response.json();
                showSuccess(`接続成功: ${repo.full_name}`);
                return true;
            } else {
                showError('GitHubリポジトリへの接続に失敗しました');
                return false;
            }
        } catch (error) {
            showError(`接続テストに失敗: ${error.message}`);
            return false;
        }
    }

    // 設定をリセット
    resetConfig() {
        this.config = {
            owner: 'kanta02cer',
            repo: 'JAA.HP-1',
            branch: 'main',
            token: null
        };
        localStorage.removeItem('github-sync-config');
        showInfo('GitHub同期設定をリセットしました');
    }
}

// グローバルインスタンスを作成
const githubSync = new GitHubSync();

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    githubSync.initialize();
});
