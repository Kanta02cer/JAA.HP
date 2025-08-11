// =================================================================================
// Simple News Loader - 簡易ニュース投稿システムと連携
// ローカルストレージの記事データを読み込み、サイトに表示
// =================================================================================

class SimpleNewsLoader {
    constructor() {
        this.articles = [];
        this.isLoaded = false;
        this.cacheKey = 'simpleNewsArticles';
        this.init();
    }

    // 初期化
    init() {
        this.loadArticles();
        this.setupAutoRefresh();
    }

    // 記事データの読み込み
    loadArticles() {
        try {
            const saved = localStorage.getItem(this.cacheKey);
            this.articles = saved ? JSON.parse(saved) : this.getDefaultArticles();
            
            // 下書きでない記事のみをフィルタリング
            this.articles = this.articles.filter(article => !article.draft);
            
            // 日付でソート（新しい順）
            this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            this.isLoaded = true;
            console.log(`簡易ニュース記事読み込み完了: ${this.articles.length}件`);
        } catch (error) {
            console.error('簡易ニュース記事読み込みエラー:', error);
            this.articles = this.getDefaultArticles();
        }
    }

    // デフォルト記事の取得
    getDefaultArticles() {
        return [
            {
                id: '2025-01-21-new-article',
                title: 'Firebase Functionsなしでも記事管理が可能',
                description: 'Firebase Functionsを導入していない状態でも、Markdownファイルと管理画面を使用して記事の管理が可能であることを確認しました。',
                date: '2025-01-21',
                category: '技術情報',
                tags: ['Firebase', '記事管理', 'Markdown', 'CMS'],
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
                content: '# Firebase Functionsなしでも記事管理が可能\n\nFirebase Functionsを導入していない状態でも、Markdownファイルと管理画面を使用して記事の管理が可能であることを確認しました。\n\n## 機能\n\n- Markdownエディタ\n- プレビュー機能\n- 記事の保存・編集・削除\n- Markdownファイルの出力\n\n## 使用方法\n\n1. 新規記事ボタンで記事作成\n2. フォームに入力\n3. プレビューで確認\n4. 保存またはMarkdownファイル出力',
                draft: false,
                createdAt: new Date().toISOString()
            }
        ];
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

        let articles = [...this.articles];
        
        // 最大件数で制限
        if (maxItems > 0) {
            articles = articles.slice(0, maxItems);
        }

        if (articles.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">現在、公開されているニュースはありません。</p>';
            return;
        }

        const html = articles.map(article => {
            const dateObj = new Date(article.date);
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
                    </div>
                </a>
            `;
        }).join('');

        container.innerHTML = html;
        console.log(`簡易ニュース表示完了: ${containerId}, 件数: ${articles.length}`);
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
                        <span class="mr-4">${new Date(article.date).toLocaleDateString('ja-JP')}</span>
                        <span>${article.author || '日本学生アンバサダー協会'}</span>
                    </div>
                    ${article.image ? `<img src="${article.image}" alt="${article.title}" class="w-full h-64 object-cover rounded-lg mb-6">` : ''}
                </header>
                <div class="prose prose-lg max-w-none">
                    <p class="text-lg text-gray-700 mb-6">${article.description}</p>
                    ${article.tags && article.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mb-6">
                            ${article.tags.map(tag => `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="markdown-content">
                        ${this.parseMarkdown(article.content)}
                    </div>
                </div>
            </article>
        `;

        container.innerHTML = html;
        console.log(`記事詳細表示完了: ${articleId}`);
    }

    // Markdownの解析（簡易版）
    parseMarkdown(markdown) {
        if (!markdown) return '';
        
        // 基本的なMarkdown記法をHTMLに変換
        let html = markdown
            // 見出し
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
            // リスト
            .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
            // 太字・斜体
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // リンク
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
            // 改行
            .replace(/\n/g, '<br>');

        // リストの処理
        html = html.replace(/(<li.*<\/li>)/gs, '<ul class="list-disc ml-6 mb-4">$1</ul>');
        
        return html;
    }

    // 記事の検索
    searchArticles(query, maxResults = 10) {
        if (!query || query.trim() === '') {
            return this.articles.slice(0, maxResults);
        }

        const searchTerm = query.toLowerCase();
        const results = this.articles.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.description.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
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
        const tags = {};
        
        this.articles.forEach(article => {
            // カテゴリ統計
            categories[article.category] = (categories[article.category] || 0) + 1;
            
            // タグ統計
            article.tags.forEach(tag => {
                tags[tag] = (tags[tag] || 0) + 1;
            });
        });

        return {
            total,
            categories,
            tags,
            lastUpdated: new Date().toISOString()
        };
    }

    // 自動更新の設定
    setupAutoRefresh() {
        // 5分間隔で記事データを再読み込み
        setInterval(() => {
            this.loadArticles();
        }, 5 * 60 * 1000);

        // ストレージ変更の監視
        window.addEventListener('storage', (e) => {
            if (e.key === this.cacheKey) {
                console.log('簡易ニュース記事データが更新されました');
                this.loadArticles();
                this.refreshAllContainers();
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

    // 記事データの強制更新
    forceRefresh() {
        this.loadArticles();
        this.refreshAllContainers();
        console.log('簡易ニュース記事データを強制更新しました');
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
let simpleNewsLoader = null;

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', () => {
    simpleNewsLoader = new SimpleNewsLoader();
    
    // 既存のニュースコンテナに記事を表示
    if (document.getElementById('news-list-home')) {
        simpleNewsLoader.loadNews('news-list-home', 5);
    }
    if (document.getElementById('news-list-all')) {
        simpleNewsLoader.loadNews('news-list-all', 0);
    }
});

// グローバル関数として公開
window.simpleNewsLoader = simpleNewsLoader;
window.loadSimpleNews = (containerId, maxItems) => {
    if (simpleNewsLoader) {
        return simpleNewsLoader.loadNews(containerId, maxItems);
    }
};
window.loadSimpleArticleDetail = (articleId, containerId) => {
    if (simpleNewsLoader) {
        return simpleNewsLoader.loadArticleDetail(articleId, containerId);
    }
};
window.forceSimpleNewsRefresh = () => {
    if (simpleNewsLoader) {
        return simpleNewsLoader.forceRefresh();
    }
};
