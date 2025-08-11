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
    const article = articleCache.find(a => a.id === articleId);

    if (!article) {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    // 記事の表示
    titleEl.textContent = article.title || '無題の記事';
    categoryEl.textContent = article.category || 'カテゴリなし';
    
    // 日付の表示（統合記事管理システムの場合はcreatedAtを使用）
    const articleDate = article.createdAt || article.date;
    dateEl.textContent = new Date(articleDate).toLocaleDateString('ja-JP');
    
    // 記事内容の表示（Markdown形式の場合はHTMLに変換）
    let content = article.content || '<p>記事の内容がありません。</p>';
    if (article.source === 'news-console' && typeof content === 'string') {
      // news-consoleの記事はMarkdown形式なので、基本的な変換を行う
      content = content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
    }
    contentEl.innerHTML = content;
    
    // 画像の表示
    if (article.image && imageEl) {
      imageEl.src = article.image;
      imageEl.alt = article.title;
      imageEl.classList.remove('hidden');
    }
    
    // 著者の表示
    if (authorEl) {
      authorEl.textContent = article.author || '';
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
});

