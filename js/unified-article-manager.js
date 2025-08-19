// =================================================================================
// Unified Article Manager - CMS機能とページ表示の完全統合
// 記事の保存・更新・削除を管理し、全ページにリアルタイム反映
// =================================================================================

class UnifiedArticleManager {
    constructor() {
        this.articles = [];
        this.subscribers = new Map(); // ページID -> コールバック関数
        this.storageKey = 'jaa-unified-articles';
        this.syncInterval = null;
        this.init();
    }

    // 初期化
    async init() {
        console.log('Unified Article Manager 初期化開始');
        
        // 既存記事の読み込み
        await this.loadExistingArticles();
        
        // 自動同期の開始
        this.startAutoSync();
        
        // ページ間通信の設定
        this.setupPageCommunication();
        
        console.log('Unified Article Manager 初期化完了');
    }

    // 既存記事の読み込み
    async loadExistingArticles() {
        try {
            // ローカルストレージから読み込み
            this.loadFromLocalStorage();
            
            // Firebaseから記事を取得（利用可能な場合）
            if (typeof firebase !== 'undefined') {
                await this.loadFromFirebase();
            }
            
            // 記事を日付順でソート
            this.sortArticles();
            
            console.log(`既存記事読み込み完了: ${this.articles.length}件`);
        } catch (error) {
            console.error('既存記事読み込みエラー:', error);
        }
    }

    // ローカルストレージから読み込み
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const localArticles = JSON.parse(saved);
                this.articles = [...this.articles, ...localArticles];
            }
        } catch (error) {
            console.error('ローカルストレージ読み込みエラー:', error);
        }
    }

    // Firebaseから記事を取得
    async loadFromFirebase() {
        try {
            const db = firebase.firestore();
            const newsRef = db.collection('news');
            const snapshot = await newsRef.get();
            
            const firebaseArticles = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                firebaseArticles.push({
                    id: doc.id,
                    title: data.title || '無題の記事',
                    content: data.content || '',
                    category: data.category || 'お知らせ',
                    status: data.status || 'draft',
                    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                    updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
                    source: 'firebase',
                    lastSynced: Date.now()
                });
            });

            // 重複を避けて統合
            const existingIds = this.articles.map(a => a.id);
            const newArticles = firebaseArticles.filter(article => !existingIds.includes(article.id));
            
            this.articles = [...this.articles, ...newArticles];
            console.log(`Firebase記事読み込み完了: ${newArticles.length}件`);
            
        } catch (error) {
            console.error('Firebase記事読み込みエラー:', error);
        }
    }

    // 記事の保存・更新
    async saveArticle(articleData, source = 'manual') {
        try {
            const now = Date.now();
            const article = {
                ...articleData,
                lastUpdated: now,
                source: source
            };

            // 新規記事の場合
            if (!article.id) {
                article.id = this.generateArticleId();
                article.createdAt = now;
                this.articles.unshift(article);
            } else {
                // 既存記事の更新
                const index = this.articles.findIndex(a => a.id === article.id);
                if (index >= 0) {
                    article.updatedAt = now;
                    this.articles[index] = article;
                } else {
                    this.articles.unshift(article);
                }
            }

            // 記事を日付順でソート
            this.sortArticles();

            // ローカルストレージに保存
            this.saveToLocalStorage();

            // 全購読者に通知
            this.notifySubscribers('save', article.id, article);

            // ページ間通信で通知
            this.broadcastToOtherPages('save', article.id, article);

            // news-detail.htmlへの即座反映のための特別処理
            this.ensureNewsDetailSync(article.id, article);

            console.log(`記事保存完了: ${article.id}`);
            return article;

        } catch (error) {
            console.error('記事保存エラー:', error);
            throw error;
        }
    }

    // news-detail.htmlへの即座反映を確実にする
    ensureNewsDetailSync(articleId, articleData) {
        try {
            // 1. カスタムイベントの発火
            window.dispatchEvent(new CustomEvent('jaa-news-update', {
                detail: {
                    action: 'save',
                    articleId: articleId,
                    article: articleData,
                    timestamp: Date.now(),
                    type: 'NEWS_UPDATE'
                }
            }));

            // 2. postMessageでの通知
            if (window.opener) {
                window.opener.postMessage({
                    type: 'FORCE_NEWS_REFRESH',
                    articleId: articleId,
                    timestamp: Date.now()
                }, '*');
            }

            // 3. localStorageイベントの強制発火
            const triggerKey = `jaa-news-update-${Date.now()}`;
            localStorage.setItem(triggerKey, JSON.stringify({
                action: 'save',
                articleId: articleId,
                article: articleData,
                timestamp: Date.now(),
                type: 'NEWS_UPDATE'
            }));
            localStorage.removeItem(triggerKey);

            console.log(`news-detail.html同期処理完了: ${articleId}`);
        } catch (error) {
            console.error('news-detail.html同期処理エラー:', error);
        }
    }

    // 記事の削除
    async deleteArticle(articleId) {
        try {
            const index = this.articles.findIndex(a => a.id === articleId);
            if (index >= 0) {
                const deletedArticle = this.articles[index];
                this.articles.splice(index, 1);

                // ローカルストレージに保存
                this.saveToLocalStorage();

                // 全購読者に通知
                this.notifySubscribers('delete', articleId, deletedArticle);

                // ページ間通信で通知
                this.broadcastToOtherPages('delete', articleId, deletedArticle);

                console.log(`記事削除完了: ${articleId}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('記事削除エラー:', error);
            throw error;
        }
    }

    // 記事IDの生成
    generateArticleId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `article-${timestamp}-${random}`;
    }

    // 記事のソート
    sortArticles() {
        this.articles.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });
    }

    // ローカルストレージへの保存
    saveToLocalStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.articles));
        } catch (error) {
            console.error('ローカルストレージ保存エラー:', error);
        }
    }

    // 購読者の登録
    subscribe(pageId, callback) {
        this.subscribers.set(pageId, callback);
        console.log(`購読者登録: ${pageId}`);
    }

    // 購読者の解除
    unsubscribe(pageId) {
        this.subscribers.delete(pageId);
        console.log(`購読者解除: ${pageId}`);
    }

    // 全購読者への通知
    notifySubscribers(action, articleId, articleData) {
        this.subscribers.forEach((callback, pageId) => {
            try {
                callback(action, articleId, articleData);
            } catch (error) {
                console.error(`購読者通知エラー (${pageId}):`, error);
            }
        });
    }

    // ページ間通信での通知
    broadcastToOtherPages(action, articleId, articleData) {
        try {
            // BroadcastChannel APIを使用
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('jaa-article-sync');
                channel.postMessage({
                    type: 'ARTICLE_UPDATE',
                    action: action,
                    articleId: articleId,
                    articleData: articleData,
                    timestamp: Date.now(),
                    source: window.location.href
                });
                channel.close();
            }

            // localStorageイベントを使用（フォールバック）
            this.triggerStorageEvent(action, articleId, articleData);

        } catch (error) {
            console.error('ページ間通信エラー:', error);
        }
    }

    // localStorageイベントのトリガー
    triggerStorageEvent(action, articleId, articleData) {
        try {
            const event = new StorageEvent('storage', {
                key: 'jaa-article-sync-trigger',
                newValue: JSON.stringify({
                    action: action,
                    articleId: articleId,
                    articleData: articleData,
                    timestamp: Date.now()
                }),
                url: window.location.href
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('StorageEvent作成エラー:', error);
        }
    }

    // ページ間通信の設定
    setupPageCommunication() {
        // BroadcastChannelからのメッセージ受信
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('jaa-article-sync');
            channel.onmessage = (event) => {
                if (event.data.type === 'ARTICLE_UPDATE' && event.data.source !== window.location.href) {
                    this.handleExternalUpdate(event.data);
                }
            };
        }

        // localStorageイベントの監視
        window.addEventListener('storage', (event) => {
            if (event.key === 'jaa-article-sync-trigger') {
                try {
                    const data = JSON.parse(event.newValue);
                    this.handleExternalUpdate(data);
                } catch (error) {
                    console.error('StorageEvent処理エラー:', error);
                }
            }
        });
    }

    // 外部からの更新処理
    handleExternalUpdate(data) {
        console.log('外部更新を受信:', data);
        
        switch (data.action) {
            case 'save':
                this.handleExternalSave(data.articleId, data.articleData);
                break;
            case 'delete':
                this.handleExternalDelete(data.articleId);
                break;
        }
    }

    // 外部からの保存処理
    handleExternalSave(articleId, articleData) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index >= 0) {
            this.articles[index] = { ...this.articles[index], ...articleData };
        } else {
            this.articles.unshift(articleData);
        }
        
        this.sortArticles();
        this.notifySubscribers('save', articleId, articleData);
    }

    // 外部からの削除処理
    handleExternalDelete(articleId) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index >= 0) {
            const deletedArticle = this.articles[index];
            this.articles.splice(index, 1);
            this.notifySubscribers('delete', articleId, deletedArticle);
        }
    }

    // 自動同期の開始
    startAutoSync() {
        // 30秒間隔で同期
        this.syncInterval = setInterval(() => {
            this.performAutoSync();
        }, 30000);
    }

    // 自動同期の実行
    async performAutoSync() {
        try {
            if (typeof firebase !== 'undefined') {
                await this.loadFromFirebase();
                this.saveToLocalStorage();
                console.log('自動同期完了');
            }
        } catch (error) {
            console.error('自動同期エラー:', error);
        }
    }

    // 記事の取得
    getArticles(filter = {}) {
        let filteredArticles = [...this.articles];

        // ステータスフィルター
        if (filter.status) {
            filteredArticles = filteredArticles.filter(a => a.status === filter.status);
        }

        // カテゴリフィルター
        if (filter.category) {
            filteredArticles = filteredArticles.filter(a => a.category === filter.category);
        }

        // 件数制限
        if (filter.limit) {
            filteredArticles = filteredArticles.slice(0, filter.limit);
        }

        return filteredArticles;
    }

    // 特定の記事を取得
    getArticle(articleId) {
        return this.articles.find(a => a.id === articleId);
    }

    // 統計情報の取得
    getStats() {
        const total = this.articles.length;
        const published = this.articles.filter(a => a.status === 'published').length;
        const draft = this.articles.filter(a => a.status === 'draft').length;
        
        const categories = {};
        this.articles.forEach(article => {
            categories[article.category] = (categories[article.category] || 0) + 1;
        });

        return {
            total,
            published,
            draft,
            categories,
            lastUpdated: Date.now()
        };
    }

    // クリーンアップ
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('Unified Article Manager クリーンアップ完了');
    }
    
    // 強制更新（統合記事管理システム用）
    async forceRefresh() {
        try {
            // Firebaseから最新データを取得
            if (typeof firebase !== 'undefined') {
                await this.loadFromFirebase();
            }
            
            // ローカルストレージに保存
            this.saveToLocalStorage();
            
            // 全購読者に通知
            this.notifySubscribers('refresh', null, null);
            
            console.log('統合記事管理システムの強制更新完了');
        } catch (error) {
            console.error('強制更新エラー:', error);
        }
    }
}

// グローバルインスタンス
let unifiedArticleManager = null;

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        unifiedArticleManager = new UnifiedArticleManager();
        window.unifiedArticleManager = unifiedArticleManager;
        console.log('Unified Article Manager グローバル設定完了');
        
        // 初期化完了イベントを発火
        window.dispatchEvent(new CustomEvent('unified-article-manager-ready', {
            detail: { manager: unifiedArticleManager }
        }));
    } catch (error) {
        console.error('Unified Article Manager 初期化エラー:', error);
    }
});

// ページ読み込み完了後の初期化（フォールバック）
window.addEventListener('load', async () => {
    if (!unifiedArticleManager) {
        try {
            unifiedArticleManager = new UnifiedArticleManager();
            window.unifiedArticleManager = unifiedArticleManager;
            console.log('Unified Article Manager フォールバック初期化完了');
            
            // 初期化完了イベントを発火
            window.dispatchEvent(new CustomEvent('unified-article-manager-ready', {
                detail: { manager: unifiedArticleManager }
            }));
        } catch (error) {
            console.error('Unified Article Manager フォールバック初期化エラー:', error);
        }
    }
});

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (unifiedArticleManager) {
        unifiedArticleManager.destroy();
    }
});

// グローバル関数として公開
window.createUnifiedArticleManager = () => {
    if (!unifiedArticleManager) {
        unifiedArticleManager = new UnifiedArticleManager();
    }
    return unifiedArticleManager;
};
