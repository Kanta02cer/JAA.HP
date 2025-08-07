// ニュース記事管理クラス
class NewsManager {
    constructor() {
        this.newsData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentCategory = 'all';
    }

    // ニュース記事を読み込む
    async loadNews() {
        try {
            // 実際の実装では、APIエンドポイントからデータを取得
            // 現在はサンプルデータを使用
            this.newsData = await this.getSampleNews();
            this.renderNews();
        } catch (error) {
            console.error('ニュースの読み込みに失敗しました:', error);
        }
    }

    // サンプルニュースデータ（実際の実装ではAPIから取得）
    async getSampleNews() {
        return [
            {
                id: 1,
                title: "一般社団法人化に関するお知らせ",
                description: "日本学生アンバサダー協会の一般社団法人化に関するお知らせ。2025年10月に一般社団法人設立を予定しています。",
                date: "2025-10-01",
                category: "プレスリリース",
                tags: ["法人化", "プレスリリース", "組織基盤"],
                image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto=format&fit=crop",
                slug: "press-release",
                author: "日本学生アンバサダー協会"
            },
            {
                id: 2,
                title: "「人材版令和の虎」に出演しました",
                description: "テレビ番組「人材版令和の虎」に代表の井上幹太が出演し、学生支援の取り組みについて紹介されました。",
                date: "2025-07-17",
                category: "メディア掲載",
                tags: ["メディア掲載", "テレビ出演", "井上幹太"],
                image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop",
                slug: "media-appearance",
                author: "日本学生アンバサダー協会"
            },
            {
                id: 3,
                title: "公式ホームページリニューアルのお知らせ",
                description: "日本学生アンバサダー協会の公式ホームページをリニューアルいたしました。より使いやすく、情報が見やすいデザインに変更しています。",
                date: "2025-01-15",
                category: "お知らせ",
                tags: ["ホームページ", "リニューアル", "お知らせ"],
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
                slug: "website-renewal",
                author: "日本学生アンバサダー協会"
            }
        ];
    }

    // ニュース記事を表示
    renderNews() {
        const container = document.getElementById('news-container');
        if (!container) return;

        const filteredNews = this.filterNewsByCategory();
        const paginatedNews = this.paginateNews(filteredNews);

        container.innerHTML = paginatedNews.map(news => this.createNewsCard(news)).join('');
    }

    // カテゴリでフィルタリング
    filterNewsByCategory() {
        if (this.currentCategory === 'all') {
            return this.newsData;
        }
        return this.newsData.filter(news => news.category === this.currentCategory);
    }

    // ページネーション
    paginateNews(news) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return news.slice(start, end);
    }

    // ニュースカードのHTML生成
    createNewsCard(news) {
        const date = new Date(news.date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        return `
            <a href="news-detail.html?id=${news.id}" class="block news-card border-b py-6">
                <div class="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <time datetime="${news.date}">${date}</time>
                    <span class="category-tag tag-${this.getCategoryClass(news.category)}">${news.category}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-800 hover:text-orange-600">${news.title}</h3>
                <p class="text-gray-600 mt-2">${news.description}</p>
            </a>
        `;
    }

    // カテゴリに応じたCSSクラスを取得
    getCategoryClass(category) {
        const categoryMap = {
            'プレスリリース': 'release',
            'メディア掲載': 'media',
            'イベント': 'event',
            'お知らせ': 'update'
        };
        return categoryMap[category] || 'update';
    }

    // カテゴリフィルターを設定
    setCategoryFilter(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.renderNews();
        this.updateCategoryButtons(category);
    }

    // カテゴリボタンの状態を更新
    updateCategoryButtons(activeCategory) {
        const buttons = document.querySelectorAll('.category-filter-btn');
        buttons.forEach(btn => {
            const category = btn.dataset.category;
            if (category === activeCategory) {
                btn.classList.remove('text-gray-500');
                btn.classList.add('text-orange-500');
            } else {
                btn.classList.remove('text-orange-500');
                btn.classList.add('text-gray-500');
            }
        });
    }

    // ホームページ用の最新ニュース表示
    renderLatestNews(count = 3) {
        const container = document.getElementById('news-container');
        if (!container) return;

        const latestNews = this.newsData.slice(0, count);
        container.innerHTML = latestNews.map(news => this.createLatestNewsCard(news)).join('');
    }

    // ホームページ用のニュースカード
    createLatestNewsCard(news) {
        const date = new Date(news.date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        return `
            <a href="news-detail.html?id=${news.id}" class="block card p-4 flex justify-between items-center news-item">
                <span class="font-bold">${news.title}</span>
                <span class="text-sm text-gray-500">${date}</span>
            </a>
        `;
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    const newsManager = new NewsManager();
    
    // ニュースを読み込む
    newsManager.loadNews();

    // カテゴリフィルターボタンのイベントリスナー
    const categoryButtons = document.querySelectorAll('.category-filter-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            newsManager.setCategoryFilter(category);
        });
    });

    // グローバルにアクセス可能にする
    window.newsManager = newsManager;
});

// ホームページ用の最新ニュース表示関数
function loadLatestNews(count = 3) {
    if (window.newsManager) {
        window.newsManager.renderLatestNews(count);
    }
}
