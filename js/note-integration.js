// =================================================================================
// Note Integration System - 公式noteからプレスリリースを取得・表示
// =================================================================================

class NoteIntegrationManager {
    constructor() {
        this.noteArticles = [];
        this.isLoaded = false;
        this.noteUrl = 'https://note.com/jaa_official'; // 公式noteのURL
        this.rssUrl = 'https://note.com/jaa_official/rss'; // RSSフィードのURL
        this.cacheKey = 'jaa-note-cache';
        this.cacheExpiry = 30 * 60 * 1000; // 30分
        this.init();
    }

    // 初期化
    async init() {
        console.log('Note Integration Manager 初期化開始');
        
        // キャッシュから記事を読み込み
        this.loadFromCache();
        
        // 最新記事を取得
        await this.fetchLatestArticles();
        
        // 自動更新の設定
        this.setupAutoRefresh();
        
        console.log('Note Integration Manager 初期化完了');
    }

    // キャッシュから記事を読み込み
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const cacheData = JSON.parse(cached);
                
                // キャッシュの有効期限をチェック
                if (Date.now() - cacheData.timestamp < this.cacheExpiry) {
                    this.noteArticles = cacheData.articles;
                    this.isLoaded = true;
                    console.log(`キャッシュから記事読み込み完了: ${this.noteArticles.length}件`);
                    return true;
                }
            }
        } catch (error) {
            console.error('キャッシュ読み込みエラー:', error);
        }
        return false;
    }

    // 最新記事を取得
    async fetchLatestArticles() {
        try {
            // CORSの問題を回避するため、プロキシサービスを使用
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(this.rssUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const xmlText = data.contents;
            
            // XMLをパース
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // 記事を抽出
            const items = xmlDoc.querySelectorAll('item');
            const articles = [];
            
            items.forEach((item, index) => {
                if (index < 20) { // 最新20件まで
                    const title = item.querySelector('title')?.textContent || '無題';
                    const link = item.querySelector('link')?.textContent || '';
                    const description = item.querySelector('description')?.textContent || '';
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    const category = item.querySelector('category')?.textContent || 'プレスリリース';
                    
                    // 画像URLを抽出（descriptionから）
                    const imageUrl = this.extractImageUrl(description);
                    
                    articles.push({
                        id: `note-${Date.now()}-${index}`,
                        title: this.cleanText(title),
                        content: this.cleanText(description),
                        link: link,
                        category: category,
                        imageUrl: imageUrl,
                        publishedAt: new Date(pubDate).toISOString(),
                        source: 'note',
                        isPressRelease: this.isPressRelease(title, description)
                    });
                }
            });
            
            this.noteArticles = articles;
            this.isLoaded = true;
            
            // キャッシュに保存
            this.saveToCache();
            
            console.log(`Note記事取得完了: ${articles.length}件`);
            
            // イベントを発火
            this.dispatchUpdateEvent();
            
        } catch (error) {
            console.error('Note記事取得エラー:', error);
            // エラーの場合はキャッシュから読み込み
            if (!this.isLoaded) {
                this.loadFromCache();
            }
        }
    }

    // 画像URLを抽出
    extractImageUrl(htmlContent) {
        const imgMatch = htmlContent.match(/<img[^>]+src="([^"]+)"/);
        if (imgMatch) {
            return imgMatch[1];
        }
        
        // og:imageタグを探す
        const ogMatch = htmlContent.match(/og:image" content="([^"]+)"/);
        if (ogMatch) {
            return ogMatch[1];
        }
        
        return null;
    }

    // テキストをクリーンアップ
    cleanText(text) {
        if (!text) return '';
        return text
            .replace(/<[^>]*>/g, '') // HTMLタグを除去
            .replace(/&nbsp;/g, ' ') // 特殊文字を変換
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }

    // プレスリリースかどうかを判定
    isPressRelease(title, description) {
        const pressKeywords = [
            'プレスリリース', 'press release', 'press', 'リリース',
            '発表', 'お知らせ', 'ニュース', 'news', '記者会見',
            '取材', 'メディア', 'media', '報道'
        ];
        
        const text = (title + ' ' + description).toLowerCase();
        return pressKeywords.some(keyword => text.includes(keyword.toLowerCase()));
    }

    // キャッシュに保存
    saveToCache() {
        try {
            const cacheData = {
                articles: this.noteArticles,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('キャッシュ保存エラー:', error);
        }
    }

    // 自動更新の設定
    setupAutoRefresh() {
        // 30分ごとに更新
        setInterval(() => {
            this.fetchLatestArticles();
        }, this.cacheExpiry);
    }

    // 更新イベントを発火
    dispatchUpdateEvent() {
        const event = new CustomEvent('jaa-note-update', {
            detail: {
                articles: this.noteArticles,
                count: this.noteArticles.length
            }
        });
        window.dispatchEvent(event);
    }

    // プレスリリースのみを取得
    getPressReleases() {
        return this.noteArticles.filter(article => article.isPressRelease);
    }

    // カテゴリ別に記事を取得
    getArticlesByCategory(category) {
        return this.noteArticles.filter(article => 
            article.category.toLowerCase().includes(category.toLowerCase())
        );
    }

    // 最新記事を取得
    getLatestArticles(limit = 10) {
        return this.noteArticles
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, limit);
    }

    // 記事を検索
    searchArticles(query) {
        const searchTerm = query.toLowerCase();
        return this.noteArticles.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.category.toLowerCase().includes(searchTerm)
        );
    }

    // 強制更新
    async forceRefresh() {
        console.log('Note記事の強制更新を実行');
        await this.fetchLatestArticles();
    }
}

// グローバルインスタンスを作成
window.noteIntegrationManager = new NoteIntegrationManager();

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
    // Note記事の表示を開始
    if (window.noteIntegrationManager) {
        window.noteIntegrationManager.fetchLatestArticles();
    }
});
