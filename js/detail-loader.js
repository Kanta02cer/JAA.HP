// =================================================================================
// JAA Detail Loader
// URLの ?id= から記事を取得して news-detail.html に描画
// 統合記事管理システムと連携して動作
// =================================================================================

// 記事データのキャッシュ
let articleCache = [];

// 記事データの初期化
async function initializeArticleData() {
  if (articleCache.length > 0) return;

  try {
    // 統合記事管理システムから記事データを取得
    let articles = [];
    
    if (window.unifiedArticleManager) {
      articles = window.unifiedArticleManager.getArticles({ status: 'published' });
    } else if (window.unifiedNewsLoader) {
      articles = window.unifiedNewsLoader.articles;
    } else {
      // 統合システムが利用できない場合は、ローカルストレージから取得
      const unifiedArticles = JSON.parse(localStorage.getItem('jaa-unified-articles') || '[]');
      articles = unifiedArticles.filter(article => article.status === 'published');
    }
    
    // 記事データをキャッシュに保存
    articleCache = articles;
    
    console.log(`記事詳細データ読み込み完了: 統合記事${articles.length}件`);
  } catch (error) {
    console.error('記事詳細データ読み込みエラー:', error);
    throw error;
  }
}

// 記事詳細の読み込み
async function loadArticleDetail() {
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');

  const titleEl = document.getElementById('article-title');
  const categoryEl = document.getElementById('article-category');
  const dateEl = document.getElementById('article-date');
  const contentEl = document.getElementById('article-body');
  const imageEl = document.getElementById('article-image');
  const authorEl = document.getElementById('article-author');

  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const articleRoot = document.getElementById('article-content');

  if (!articleId) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    return;
  }

  try {
    // 記事データの初期化
    await initializeArticleData();
    
    // 指定されたIDの記事を検索
    let article = articleCache.find(a => a.id === articleId);

    // 記事が見つからない場合は、ローカルストレージから直接検索
    if (!article) {
      console.log('キャッシュに記事が見つかりません。ローカルストレージから検索します。');
      const unifiedArticles = JSON.parse(localStorage.getItem('jaa-unified-articles') || '[]');
      article = unifiedArticles.find(a => a.id === articleId);
      
      if (article) {
        // キャッシュに追加
        articleCache.push(article);
        console.log('ローカルストレージから記事を発見し、キャッシュに追加しました。');
      }
    }

    if (!article) {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    // 記事の表示
    titleEl.textContent = article.title || '無題の記事';
    
    // カテゴリの表示とスタイリング
    const category = article.category || 'お知らせ';
    categoryEl.textContent = category;
    categoryEl.className = 'category-tag';
    
    // カテゴリに応じたスタイルを適用
    if (category.includes('リリース') || category.includes('release')) {
      categoryEl.classList.add('tag-release');
    } else if (category.includes('メディア') || category.includes('media')) {
      categoryEl.classList.add('tag-media');
    } else if (category.includes('イベント') || category.includes('event')) {
      categoryEl.classList.add('tag-event');
    } else if (category.includes('更新') || category.includes('update')) {
      categoryEl.classList.add('tag-update');
    } else {
      categoryEl.classList.add('tag-update'); // デフォルト
    }
    
    // 日付の表示（統合記事管理システムの場合はcreatedAtを使用）
    const articleDate = article.createdAt || article.date || article.updatedAt;
    if (articleDate) {
      const date = new Date(articleDate);
      dateEl.textContent = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateEl.setAttribute('datetime', date.toISOString());
    } else {
      dateEl.textContent = '日付不明';
    }
    
    // 記事内容の表示
    let content = article.content || '<p>記事の内容がありません。</p>';
    
    // news-consoleの記事はMarkdown形式なので、基本的な変換を行う
    if (article.source === 'news-console' && typeof content === 'string') {
      // HTMLタグが含まれている場合はそのまま使用
      if (content.includes('<') && content.includes('>')) {
        // 既にHTML形式の場合はそのまま使用
        contentEl.innerHTML = content;
      } else {
        // プレーンテキストまたはMarkdown形式の場合は変換
        content = content
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>')
          .replace(/^/, '<p>')
          .replace(/$/, '</p>');
        contentEl.innerHTML = content;
      }
    } else {
      // その他の記事はそのまま表示
      contentEl.innerHTML = content;
    }
    
    // 画像の表示
    if (article.image && imageEl) {
      imageEl.src = article.image;
      imageEl.alt = article.title;
      imageEl.classList.remove('hidden');
    }
    
    // 著者の表示
    if (authorEl) {
      authorEl.textContent = article.author || '日本学生アンバサダー協会';
    }
    
    // ページタイトルの更新
    document.title = `${article.title || 'ニュース詳細'} | 日本学生アンバサダー協会`;

    // ローディングとエラー表示の制御
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (articleRoot) articleRoot.classList.remove('hidden');
    
    console.log(`記事詳細表示完了: ${article.title}`);
  } catch (error) {
    console.error("記事詳細読み込みエラー:", error);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', loadArticleDetail);

// ページ間通信の監視を開始
document.addEventListener('DOMContentLoaded', () => {
  // ニュース更新イベントの監視
  window.addEventListener('jaa-news-update', (event) => {
    console.log('ニュース更新イベントを受信:', event.detail);
    // 記事データを再読み込み
    articleCache = [];
    loadArticleDetail();
  });
  
  // postMessageの監視
  window.addEventListener('message', (event) => {
    if (event.data.type === 'FORCE_NEWS_REFRESH') {
      console.log('ニュース強制更新を受信');
      // 記事データを再読み込み
      articleCache = [];
      loadArticleDetail();
    }
  });

  // 統合記事管理システムの準備完了を待つ
  window.addEventListener('unified-article-manager-ready', (event) => {
    console.log('統合記事管理システムの準備完了を受信');
    // 記事データを再読み込み
    articleCache = [];
    loadArticleDetail();
  });

  // localStorageの変更を監視
  window.addEventListener('storage', (event) => {
    if (event.key === 'jaa-unified-articles') {
      console.log('ローカルストレージの記事データが更新されました');
      // 記事データを再読み込み
      articleCache = [];
      loadArticleDetail();
    }
  });
});

// 強制更新関数（デバッグ用）
window.forceArticleRefresh = () => {
  console.log('記事の強制更新を実行します');
  articleCache = [];
  loadArticleDetail();
};

