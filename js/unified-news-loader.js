// =================================================================================
// Unified News Loader - news-console.htmlと統合
// Firebaseで保存された記事を確実に表示
// =================================================================================

class UnifiedNewsLoader {
    constructor() {
        this.articles = [];
        this.isLoaded = false;
        this.articleManager = null;
        this.pageId = this.generatePageId();
        this.init();
    }

    // ページIDの生成
    generatePageId() {
        return `${window.location.pathname}-${Date.now()}`;
    }

    // 初期化
    async init() {
        // 統合記事管理システムとの連携を設定
        await this.setupArticleManager();
        
        // 記事の読み込み
        this.loadArticles();
        
        // 自動更新の設定
        this.setupAutoRefresh();
        
        console.log('Unified News Loader 初期化完了');
    }

    // 統合記事管理システムとの連携設定
    async setupArticleManager() {
        // 統合記事管理システムが利用可能になるまで待機
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            if (window.unifiedArticleManager) {
                this.articleManager = window.unifiedArticleManager;
                
                // 購読者として登録
                this.articleManager.subscribe(this.pageId, this.handleArticleUpdate.bind(this));
                
                console.log('統合記事管理システムとの連携完了');
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!this.articleManager) {
            console.warn('統合記事管理システムとの連携に失敗しました');
        }
    }

    // 記事データの読み込み
    async loadArticles() {
        try {
            // Firebaseから記事を取得
            await this.loadFirebaseArticles();
            
            // ローカルストレージから記事を取得（バックアップ）
            this.loadLocalArticles();
            
            // 削除された記事を除外
            this.filterDeletedArticles();
            
            // 記事を日付順でソート
            this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            this.isLoaded = true;
            console.log(`記事データ読み込み完了: ${this.articles.length}件（削除済み記事を除外後）`);
        } catch (error) {
            console.error('記事データ読み込みエラー:', error);
            // エラーの場合はローカルストレージから読み込み
            this.loadLocalArticles();
        }
    }

    // Firebaseから記事を取得
    async loadFirebaseArticles() {
        try {
            // Firebaseの設定を確認
            if (typeof firebase === 'undefined') {
                console.log('Firebaseが利用できません。ローカルストレージから読み込みます。');
                return;
            }

            const db = firebase.firestore();
            const newsRef = db.collection('news');
            const snapshot = await newsRef.where('status', '==', 'published').get();
            
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
                    source: 'firebase'
                });
            });

            // Firebase記事を統合
            this.articles = [...this.articles, ...firebaseArticles];
            console.log(`Firebase記事読み込み完了: ${firebaseArticles.length}件`);
            
        } catch (error) {
            console.error('Firebase記事読み込みエラー:', error);
        }
    }

    // ローカルストレージから記事を取得
    loadLocalArticles() {
        try {
            const saved = localStorage.getItem('jaa-unified-articles');
            if (saved) {
                const localArticles = JSON.parse(saved);
                const validArticles = localArticles.filter(article => article.status === 'published');
                
                // 既存の記事と統合（重複を避ける）
                const existingIds = this.articles.map(a => a.id);
                const newArticles = validArticles.filter(article => !existingIds.includes(article.id));
                
                this.articles = [...this.articles, ...newArticles];
                console.log(`ローカル記事読み込み完了: ${newArticles.length}件`);
            }
        } catch (error) {
            console.error('ローカル記事読み込みエラー:', error);
        }
    }

    // 記事一覧の表示
    loadNews(containerId, maxItems = 0) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`ニュースコンテナが見つかりません: ${containerId}`);
            return;
        }

        // 記事データがまだ読み込まれていない場合は読み込み
        if (!this.isLoaded) {
            this.loadArticles();
        }

        // 削除された記事をフィルタリング
        let articles = this.articles.filter(article => {
            // 削除フラグがtrueの場合は除外
            if (article.isDeleted === true) {
                return false;
            }
            // 削除日時が設定されている場合は除外
            if (article.deletedAt) {
                return false;
            }
            // ステータスがdeletedの場合は除外
            if (article.status === 'deleted') {
                return false;
            }
            return true;
        });
        
        // 最大件数で制限
        if (maxItems > 0) {
            articles = articles.slice(0, maxItems);
        }

        if (articles.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">現在、公開されているニュースはありません。</p>';
            return;
        }

        const html = articles.map(article => {
            const dateObj = new Date(article.createdAt || article.date);
            const postDate = dateObj.toLocaleDateString('ja-JP');
            const detailUrl = `news-detail.html?id=${article.id}`;
            
            return `
                <a href="${detailUrl}" class="block border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors duration-200">
                    <div class="flex items-center">
                        <p class="text-sm text-gray-600 w-28">${postDate}</p>
                        <span class="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full">
                            ${article.category || 'カテゴリなし'}
                        </span>
                        <p class="ml-4 text-gray-800 font-medium flex-1">${article.title || '無題の記事'}</p>
                        ${article.source === 'firebase' ? '<span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Firebase</span>' : ''}
                    </div>
                </a>
            `;
        }).join('');

        container.innerHTML = html;
        console.log(`統合ニュース表示完了: ${containerId}, 件数: ${articles.length}`);
    }

    // 削除された記事をフィルタリング
    filterDeletedArticles() {
        const originalCount = this.articles.length;
        
        // 削除された記事を除外
        this.articles = this.articles.filter(article => {
            // 削除フラグがtrueの場合は除外
            if (article.isDeleted === true) {
                return false;
            }
            // 削除日時が設定されている場合は除外
            if (article.deletedAt) {
                return false;
            }
            // ステータスがdeletedの場合は除外
            if (article.status === 'deleted') {
                return false;
            }
            return true;
        });
        
        const filteredCount = this.articles.length;
        const deletedCount = originalCount - filteredCount;
        
        if (deletedCount > 0) {
            console.log(`削除された記事を除外: ${deletedCount}件`);
        }
        
        return deletedCount;
    }

    // 記事の詳細表示
    loadArticleDetail(articleId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`記事詳細コンテナが見つかりません: ${containerId}`);
            return;
        }

        const article = this.articles.find(a => a.id === articleId);
        if (!article) {
            container.innerHTML = '<p class="text-center text-red-500">記事が見つかりません。</p>';
            return;
        }

        const html = `
            <article class="max-w-4xl mx-auto px-4 py-8">
                <header class="mb-8">
                    <div class="mb-4">
                        <span class="inline-block bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                            ${article.category}
                        </span>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-900 mb-4">${article.title}</h1>
                    <div class="flex items-center text-sm text-gray-600 mb-4">
                        <span class="mr-4">${new Date(article.createdAt || article.date).toLocaleDateString('ja-JP')}</span>
                        <span>日本学生アンバサダー協会</span>
                    </div>
                </header>
                <div class="prose prose-lg max-w-none">
                    <div class="article-content">
                        ${this.formatContent(article.content)}
                    </div>
                </div>
            </article>
        `;

        container.innerHTML = html;
        console.log(`記事詳細表示完了: ${articleId}`);
    }

    // 記事内容のフォーマット
    formatContent(content) {
        if (!content) return '<p>記事の内容がありません。</p>';
        
        // 改行を適切に処理
        return content
            .split('\n\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    // 記事の検索
    searchArticles(query, maxResults = 10) {
        if (!query || query.trim() === '') {
            return this.articles.slice(0, maxResults);
        }

        const searchTerm = query.toLowerCase();
        const results = this.articles.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            (article.content && article.content.toLowerCase().includes(searchTerm)) ||
            (article.category && article.category.toLowerCase().includes(searchTerm))
        );

        return results.slice(0, maxResults);
    }

    // カテゴリ別記事の取得
    getArticlesByCategory(category, maxResults = 0) {
        let articles = this.articles.filter(article => article.category === category);
        
        if (maxResults > 0) {
            articles = articles.slice(0, maxResults);
        }
        
        return articles;
    }

    // 最新記事の取得
    getLatestArticles(count = 5) {
        return this.articles.slice(0, count);
    }

    // 記事の統計情報
    getStats() {
        const total = this.articles.length;
        const categories = {};
        
        this.articles.forEach(article => {
            categories[article.category] = (categories[article.category] || 0) + 1;
        });

        return {
            total,
            categories,
            lastUpdated: new Date().toISOString()
        };
    }

    // 自動更新の設定
    setupAutoRefresh() {
        // 1分間隔で記事データを再読み込み
        setInterval(() => {
            this.loadArticles();
        }, 60 * 1000);

        // ストレージ変更の監視
        window.addEventListener('storage', (e) => {
            if (e.key === 'jaa-unified-articles') {
                console.log('記事データが更新されました');
                this.loadArticles();
                this.refreshAllContainers();
            }
        });
        
        // ページ間通信の設定
        this.setupPageCommunication();
    }
    
    // ページ間通信の設定
    setupPageCommunication() {
        // BroadcastChannelからのメッセージ受信
        if (typeof BroadcastChannel !== 'undefined') {
            // 記事同期チャンネルの監視
            const articleChannel = new BroadcastChannel('jaa-article-sync');
            articleChannel.onmessage = (event) => {
                if (event.data.type === 'ARTICLE_UPDATE' && event.data.source !== window.location.href) {
                    this.handleExternalUpdate(event.data);
                }
            };
            
            // ニュース更新チャンネルの監視
            const newsChannel = new BroadcastChannel('jaa-news-update');
            newsChannel.onmessage = (event) => {
                if (event.data.type === 'NEWS_UPDATE' && event.data.source !== window.location.href) {
                    this.handleNewsUpdate(event.data);
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
        
        // カスタムイベントの監視
        window.addEventListener('jaa-news-update', (event) => {
            this.handleNewsUpdate(event.detail);
        });
        
        // postMessageの監視
        window.addEventListener('message', (event) => {
            if (event.data.type === 'FORCE_NEWS_REFRESH') {
                console.log('ニュース強制更新を受信');
                this.forceRefresh();
            }
        });
    }

    // 全コンテナの更新
    refreshAllContainers() {
        const containers = ['news-list-home', 'news-list-all', 'news-detail-content'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const maxItems = containerId === 'news-list-home' ? 5 : 0;
                this.loadNews(containerId, maxItems);
            }
        });
    }

    // 記事更新の処理
    handleArticleUpdate(action, articleId, articleData) {
        console.log(`記事更新を受信: ${action} - ${articleId}`);
        
        switch (action) {
            case 'save':
                this.handleArticleSave(articleId, articleData);
                break;
            case 'delete':
                this.handleArticleDelete(articleId);
                break;
        }
    }
    
    // ニュース更新の処理
    handleNewsUpdate(data) {
        console.log(`ニュース更新を受信: ${data.action} - ${data.articleId}`);
        
        switch (data.action) {
            case 'create':
            case 'update':
                this.handleNewsSave(data.articleId, data.article);
                break;
            case 'delete':
                this.handleNewsDelete(data.articleId);
                break;
        }
    }
    
    // ニュース保存の処理
    handleNewsSave(articleId, articleData) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index >= 0) {
            // 既存記事の更新
            this.articles[index] = { ...this.articles[index], ...articleData };
        } else {
            // 新規記事の追加
            this.articles.unshift(articleData);
        }
        
        // 記事を日付順でソート
        this.sortArticles();
        
        // 全コンテナを更新
        this.refreshAllContainers();
        
        console.log(`ニュース保存処理完了: ${articleId}`);
    }
    
    // ニュース削除の処理
    handleNewsDelete(articleId) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index >= 0) {
            this.articles.splice(index, 1);
            this.refreshAllContainers();
            
            // 削除イベントを発火
            this.dispatchDeleteEvent(articleId);
            
            console.log(`ニュース削除処理完了: ${articleId}`);
        }
    }

    // 記事保存の処理
    handleArticleSave(articleId, articleData) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index >= 0) {
            // 既存記事の更新
            this.articles[index] = { ...this.articles[index], ...articleData };
        } else {
            // 新規記事の追加
            this.articles.unshift(articleData);
        }
        
        // 記事を日付順でソート
        this.sortArticles();
        
        // 全コンテナを更新
        this.refreshAllContainers();
        
        console.log(`記事保存処理完了: ${articleId}`);
    }

    // 記事削除の処理
    handleArticleDelete(articleId) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index >= 0) {
            this.articles.splice(index, 1);
            this.refreshAllContainers();
            
            // 削除イベントを発火
            this.dispatchDeleteEvent(articleId);
            
            console.log(`記事削除処理完了: ${articleId}`);
        }
    }

    // 記事のソフト削除（論理削除）
    softDeleteArticle(articleId) {
        const index = this.articles.findIndex(a => a.id === articleId);
        if (index >= 0) {
            // 削除フラグを設定
            this.articles[index].isDeleted = true;
            this.articles[index].deletedAt = new Date().toISOString();
            this.articles[index].status = 'deleted';
            
            // 削除された記事をフィルタリング
            this.filterDeletedArticles();
            
            // 全コンテナを更新
            this.refreshAllContainers();
            
            // 削除イベントを発火
            this.dispatchDeleteEvent(articleId);
            
            console.log(`記事ソフト削除処理完了: ${articleId}`);
        }
    }

    // 削除イベントを発火
    dispatchDeleteEvent(articleId) {
        const event = new CustomEvent('jaa-article-deleted', {
            detail: {
                articleId: articleId,
                timestamp: Date.now(),
                action: 'softDelete'
            }
        });
        window.dispatchEvent(event);
    }

    // 記事のソート
    sortArticles() {
        this.articles.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });
    }

    // 記事データの強制更新
    forceRefresh() {
        this.loadArticles();
        this.refreshAllContainers();
        console.log('記事データを強制更新しました');
    }

    // 記事の存在確認
    articleExists(articleId) {
        return this.articles.some(article => article.id === articleId);
    }

    // 記事の取得
    getArticle(articleId) {
        return this.articles.find(article => article.id === articleId);
    }
}

// グローバルインスタンス
let unifiedNewsLoader = null;

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', () => {
    unifiedNewsLoader = new UnifiedNewsLoader();
    
    // 既存のニュースコンテナに記事を表示
    if (document.getElementById('news-list-home')) {
        unifiedNewsLoader.loadNews('news-list-home', 5);
    }
    if (document.getElementById('news-list-all')) {
        unifiedNewsLoader.loadNews('news-list-all', 0);
    }
    
    // 初期化完了イベントを発火
    window.dispatchEvent(new CustomEvent('unified-news-loader-ready', {
        detail: { loader: unifiedNewsLoader }
    }));
});

// 統合記事管理システムの準備完了を待機
window.addEventListener('unified-article-manager-ready', () => {
    if (unifiedNewsLoader) {
        console.log('統合記事管理システムとの連携完了');
        // 記事データを再読み込み
        unifiedNewsLoader.loadArticles();
    }
});

// グローバル関数として公開
window.unifiedNewsLoader = unifiedNewsLoader;
window.loadUnifiedNews = (containerId, maxItems) => {
    if (unifiedNewsLoader) {
        return unifiedNewsLoader.loadNews(containerId, maxItems);
    }
};
window.loadUnifiedArticleDetail = (articleId, containerId) => {
    if (unifiedNewsLoader) {
        return unifiedNewsLoader.loadArticleDetail(articleId, containerId);
    }
};
window.forceUnifiedNewsRefresh = () => {
    if (unifiedNewsLoader) {
        return unifiedNewsLoader.forceRefresh();
    }
};
