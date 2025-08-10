// =================================================================================
// JAA News Loader (Enhanced Edition) - リアルタイム更新・キャッシュ対応
// Firebase Functions経由でニュースを取得し、リアルタイムで更新
// =================================================================================

// Firebase Functions API エンドポイント
const API_BASE_URL = 'https://asia-northeast1-jaa-hp.cloudfunctions.net';

// ニュースキャッシュ管理
class NewsCache {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5分
  }

  // キャッシュに保存
  set(key, data, expiry = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.cacheExpiry
    });
  }

  // キャッシュから取得
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // キャッシュをクリア
  clear() {
    this.cache.clear();
    this.lastUpdate = 0;
  }

  // キャッシュの有効性チェック
  isValid() {
    return Date.now() - this.lastUpdate < this.cacheExpiry;
  }
}

// グローバルキャッシュインスタンス
const newsCache = new NewsCache();

// ニュース読み込み関数（改善版）
async function loadNews(containerId, maxItems = 0, options = {}) {
  const {
    useCache = true,
    forceRefresh = false,
    showLoading = true,
    onSuccess = null,
    onError = null
  } = options;

  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) {
    console.warn(`ニュースコンテナが見つかりません: ${containerId}`);
    return;
  }

  // ローディング表示
  if (showLoading) {
    newsContainer.innerHTML = `
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p class="mt-2 text-gray-500">ニュースを読み込んでいます...</p>
      </div>
    `;
  }

  try {
    console.log(`ニュース読み込み開始: ${containerId}, 最大件数: ${maxItems}`);

    // キャッシュチェック
    if (useCache && !forceRefresh) {
      const cacheKey = `${containerId}_${maxItems}`;
      const cachedData = newsCache.get(cacheKey);
      if (cachedData) {
        console.log(`キャッシュからニュースを表示: ${containerId}`);
        displayNews(newsContainer, cachedData, containerId);
        if (onSuccess) onSuccess(cachedData);
        return;
      }
    }

    // APIからニュースを取得
    const articles = await fetchNewsFromAPI(maxItems);
    
    // キャッシュに保存
    if (useCache) {
      const cacheKey = `${containerId}_${maxItems}`;
      newsCache.set(cacheKey, articles);
      newsCache.lastUpdate = Date.now();
    }

    // ニュースを表示
    displayNews(newsContainer, articles, containerId);
    
    if (onSuccess) onSuccess(articles);
    
    console.log(`ニュース表示完了: ${containerId}`);
  } catch (error) {
    console.error("ニュース読み込みエラー:", error);
    
    // エラーハンドリング
    handleNewsError(newsContainer, error, containerId, maxItems);
    
    if (onError) onError(error);
  }
}

// APIからニュースを取得
async function fetchNewsFromAPI(maxItems = 0) {
  // まずキャッシュAPIを試行
  try {
    const url = `${API_BASE_URL}/getCachedNews?limit=${maxItems}&status=published`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('キャッシュAPIからニュースを取得');
        return result.data || [];
      }
    }
  } catch (error) {
    console.log('キャッシュAPIが利用できないため、通常APIを使用');
  }

  // フォールバック: 通常のAPIを使用
  const url = `${API_BASE_URL}/getNews?limit=${maxItems}&status=published`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'API呼び出しに失敗しました');
  }

  return result.data || [];
}

// ニュースを表示
function displayNews(container, articles, containerId) {
  if (articles.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p>現在、公開されているニュースはありません。</p>
        <p class="text-sm mt-2">新しいニュースが投稿されると、ここに表示されます。</p>
      </div>
    `;
    return;
  }

  // 日付でソート
  const sorted = articles.sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
    return bTime - aTime;
  });

  const html = sorted.map(article => {
    const dateObj = new Date(article.updatedAt || article.createdAt);
    const postDate = dateObj.toLocaleDateString('ja-JP');
    const detailUrl = `news-detail.html?id=${article.id}`;
    
    return `
      <a href="${detailUrl}" class="block border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors duration-200 group">
        <div class="flex items-center">
          <p class="text-sm text-gray-600 w-28">${postDate}</p>
          <span class="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full">
            ${article.category || 'カテゴリなし'}
          </span>
          <p class="ml-4 text-gray-800 font-medium flex-1 group-hover:text-orange-600 transition-colors duration-200">
            ${article.title || '無題の記事'}
          </p>
          <svg class="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </a>
    `;
  }).join('');

  container.innerHTML = html;
}

// エラーハンドリング
function handleNewsError(container, error, containerId, maxItems) {
  let errorMessage = 'ニュースの読み込みに失敗しました。';
  let errorDetails = '';
  
  if (error.message.includes('HTTP 500')) {
    errorMessage = 'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。';
  } else if (error.message.includes('HTTP 404')) {
    errorMessage = 'APIエンドポイントが見つかりません。';
  } else if (error.message.includes('fetch')) {
    errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
  } else if (error.message.includes('CORS')) {
    errorMessage = 'CORSエラーが発生しました。ブラウザの設定を確認してください。';
  }
  
  container.innerHTML = `
    <div class="text-center py-8">
      <div class="text-red-500 mb-4">
        <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <p class="text-lg font-semibold">${errorMessage}</p>
      </div>
      <div class="space-y-2">
        <button onclick="retryLoadNews('${containerId}', ${maxItems})" 
                class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200">
          再試行
        </button>
        <button onclick="loadFallbackNews('${containerId}', ${maxItems})" 
                class="block mx-auto mt-2 px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200">
          フォールバック表示を使用
        </button>
      </div>
      <div class="mt-4 text-xs text-gray-500">
        <p>エラー詳細: ${error.message}</p>
        <p>時刻: ${new Date().toLocaleString('ja-JP')}</p>
      </div>
    </div>
  `;
}

// 再試行関数
function retryLoadNews(containerId, maxItems) {
  console.log(`ニュース再読み込み: ${containerId}`);
  loadNews(containerId, maxItems, { forceRefresh: true });
}

// フォールバックニュース表示
function loadFallbackNews(containerId, maxItems) {
  console.log(`フォールバックニュース表示: ${containerId}`);
  showFallbackNews(containerId, maxItems);
}

// フォールバック用のMarkdownニュース表示（APIが利用できない場合）
function showFallbackNews(containerId, maxItems = 5) {
  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) return;

  console.log(`フォールバックMarkdownニュース表示: ${containerId}`);

  // Markdownベースのニュースローダーが利用可能な場合は使用
  if (typeof loadMarkdownNews === 'function') {
    console.log('Markdownニュースローダーを使用してフォールバック表示');
    loadMarkdownNews(containerId, maxItems);
    return;
  }

  // フォールバック用のサンプルニュース表示
  const fallbackNews = [
    {
      title: 'Firebase Functionsなしでも記事管理が可能',
      date: '2025-01-21',
      category: '技術情報'
    },
    {
      title: 'テスト記事 - CMS機能確認',
      date: '2025-01-20',
      category: 'お知らせ'
    },
    {
      title: '一般社団法人化に関するお知らせ',
      date: '2025-10-01',
      category: 'プレスリリース'
    }
  ];

  const html = fallbackNews.slice(0, maxItems).map(news => `
    <div class="block border-b border-gray-200 py-4">
      <div class="flex items-center">
        <p class="text-sm text-gray-600 w-28">${news.date}</p>
        <span class="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full">
          ${news.category}
        </span>
        <p class="ml-4 text-gray-800 font-medium flex-1">${news.title}</p>
      </div>
    </div>
  `).join('');

  newsContainer.innerHTML = html + `
    <div class="text-center mt-4 text-sm text-gray-500">
      <p>※ 現在Markdownベースの記事を表示しています</p>
      <p>Firebase Functions接続が復旧次第、リアルタイム更新が可能になります</p>
    </div>
  `;
}

// リアルタイム更新機能
class NewsRealtimeUpdater {
  constructor(containerId, maxItems = 0) {
    this.containerId = containerId;
    this.maxItems = maxItems;
    this.updateInterval = null;
    this.isActive = false;
  }

  // 更新を開始
  start(intervalMs = 30000) { // デフォルト30秒
    if (this.isActive) return;
    
    this.isActive = true;
    this.updateInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
    
    console.log(`リアルタイム更新開始: ${this.containerId} (${intervalMs}ms間隔)`);
  }

  // 更新を停止
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isActive = false;
    console.log(`リアルタイム更新停止: ${this.containerId}`);
  }

  // 更新チェック
  async checkForUpdates() {
    try {
      const statsResponse = await fetch(`${API_BASE_URL}/getNewsStats`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        if (stats.success) {
          // キャッシュの最終更新時刻と比較
          const lastUpdate = newsCache.lastUpdate;
          if (stats.data.lastUpdated !== lastUpdate) {
            console.log(`ニュース更新を検出: ${this.containerId}`);
            await loadNews(this.containerId, this.maxItems, { forceRefresh: true });
          }
        }
      }
    } catch (error) {
      console.log('更新チェックエラー:', error);
    }
  }
}

// API接続テスト関数
async function testAPIConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/getNews?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.success;
    }
    return false;
  } catch (error) {
    console.error('API接続テスト失敗:', error);
    return false;
  }
}

// ニュース統計情報を取得
async function getNewsStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/getNewsStats`);
    if (response.ok) {
      const result = await response.json();
      return result.success ? result.data : null;
    }
    return null;
  } catch (error) {
    console.error('ニュース統計取得失敗:', error);
    return null;
  }
}

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM読み込み完了 - ニュース読み込み開始');
  
  try {
    // API接続テスト
    const apiAvailable = await testAPIConnection();
    
    if (apiAvailable) {
      // APIが利用可能な場合
      console.log('Firebase Functions API接続成功 - ニュース読み込み開始');
      
      // ホームページのニュース（最新5件）
      if (document.getElementById('news-list-home')) {
        await loadNews('news-list-home', 5);
        
        // リアルタイム更新を開始
        const homeUpdater = new NewsRealtimeUpdater('news-list-home', 5);
        homeUpdater.start(60000); // 1分間隔
      }
      
      // ニュース一覧ページ（全件）
      if (document.getElementById('news-list-all')) {
        await loadNews('news-list-all', 0);
        
        // リアルタイム更新を開始
        const allUpdater = new NewsRealtimeUpdater('news-list-all', 0);
        allUpdater.start(60000); // 1分間隔
      }
      
      // ニュース詳細ページ
      if (document.getElementById('news-detail-content')) {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        if (articleId) {
          await loadNewsDetail(articleId);
        }
      }
    } else {
      // APIが利用できない場合、フォールバック表示
      console.warn('Firebase Functions APIが利用できないため、フォールバック表示を使用します');
      if (document.getElementById('news-list-home')) {
        showFallbackNews('news-list-home', 5);
      }
      if (document.getElementById('news-list-all')) {
        showFallbackNews('news-list-all', 0);
      }
    }
  } catch (error) {
    console.error('ニュース読み込み初期化エラー:', error);
    // エラーが発生した場合もフォールバック表示
    if (document.getElementById('news-list-home')) {
      showFallbackNews('news-list-home', 5);
    }
    if (document.getElementById('news-list-all')) {
      showFallbackNews('news-list-all', 0);
    }
  }
  
  // 記事更新通知のリスナーを設定
  setupNewsUpdateListeners();
});

// 記事更新通知のリスナー設定
function setupNewsUpdateListeners() {
  // メッセージイベントのリスナー
  window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'FORCE_NEWS_REFRESH') {
      console.log('記事更新通知を受信:', event.data);
      await handleNewsUpdate(event.data);
    }
  });

  // ページの可視性変更時のリスナー（タブ切り替え時）
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('ページが表示されました - ニュース更新チェック');
      await checkForNewsUpdates();
    }
  });

  // フォーカス時のリスナー（ウィンドウにフォーカスが戻った時）
  window.addEventListener('focus', async () => {
    console.log('ウィンドウにフォーカスが戻りました - ニュース更新チェック');
    await checkForNewsUpdates();
  });

  // オンライン復帰時のリスナー
  window.addEventListener('online', async () => {
    console.log('オンライン復帰 - ニュース更新チェック');
    await checkForNewsUpdates();
  });
}

// 記事更新の処理
async function handleNewsUpdate(updateData) {
  try {
    console.log('記事更新処理開始:', updateData);
    
    // キャッシュをクリア
    newsCache.clear();
    
    // 現在表示中のニュースを強制更新
    const containers = ['news-list-home', 'news-list-all', 'news-detail-content'];
    
    for (const containerId of containers) {
      const container = document.getElementById(containerId);
      if (container) {
        const maxItems = containerId === 'news-list-home' ? 5 : 0;
        await loadNews(containerId, maxItems, { 
          forceRefresh: true, 
          showLoading: false 
        });
      }
    }
    
    // 更新完了通知
    showNewsUpdateNotification(updateData);
    
  } catch (error) {
    console.error('記事更新処理エラー:', error);
  }
}

// ニュース更新チェック
async function checkForNewsUpdates() {
  try {
    // 最後の更新から一定時間経過している場合のみチェック
    const lastCheck = sessionStorage.getItem('lastNewsCheck') || 0;
    const now = Date.now();
    const checkInterval = 5 * 60 * 1000; // 5分間隔
    
    if (now - lastCheck < checkInterval) {
      return;
    }
    
    sessionStorage.setItem('lastNewsCheck', now);
    
    // APIから最新のニュース統計を取得
    const stats = await getNewsStats();
    if (stats) {
      const lastUpdate = newsCache.lastUpdate;
      if (stats.lastUpdated !== lastUpdate) {
        console.log('ニュース更新を検出 - 自動更新開始');
        await handleNewsUpdate({
          type: 'AUTO_UPDATE',
          timestamp: now,
          action: 'refresh'
        });
      }
    }
  } catch (error) {
    console.log('ニュース更新チェックエラー:', error);
  }
}

// ニュース更新通知の表示
function showNewsUpdateNotification(updateData) {
  // 既存の通知があれば削除
  const existingNotification = document.querySelector('.news-update-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // 新しい通知を作成
  const notification = document.createElement('div');
  notification.className = 'news-update-notification fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
      <div>
        <p class="font-bold">ニュースが更新されました</p>
        <p class="text-sm opacity-90">最新の情報を表示しています</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 opacity-75 hover:opacity-100">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // 5秒後に自動で消える
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ニュース詳細ページ用の読み込み関数
async function loadNewsDetail(articleId) {
  const contentContainer = document.getElementById('news-detail-content');
  if (!contentContainer) return;

  try {
    const response = await fetch(`${API_BASE_URL}/getNewsById?id=${articleId}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        displayNewsDetail(contentContainer, result.data);
      } else {
        throw new Error(result.error || '記事の取得に失敗しました');
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('ニュース詳細読み込みエラー:', error);
    contentContainer.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <p>記事の読み込みに失敗しました。</p>
        <p class="text-sm mt-2">${error.message}</p>
      </div>
    `;
  }
}

// ニュース詳細を表示
function displayNewsDetail(container, article) {
  const dateObj = new Date(article.updatedAt || article.createdAt);
  const postDate = dateObj.toLocaleDateString('ja-JP');
  
  container.innerHTML = `
    <article class="max-w-4xl mx-auto">
      <header class="mb-8">
        <div class="mb-4">
          <span class="inline-block bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full mb-3">
            ${article.category || 'カテゴリなし'}
          </span>
          <time class="block text-gray-600 text-sm">${postDate}</time>
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-4">${article.title || '無題の記事'}</h1>
      </header>
      
      <div class="prose prose-lg max-w-none">
        ${article.content || '<p>内容がありません。</p>'}
      </div>
      
      <footer class="mt-8 pt-6 border-t border-gray-200">
        <div class="flex items-center justify-between text-sm text-gray-600">
          <span>最終更新: ${postDate}</span>
          <a href="news.html" class="text-orange-500 hover:text-orange-600 transition-colors duration-200">
            ← ニュース一覧に戻る
          </a>
        </div>
      </footer>
    </article>
  `;
}

// グローバル関数として公開
window.loadNews = loadNews;
window.retryLoadNews = retryLoadNews;
window.showFallbackNews = showFallbackNews;
window.testAPIConnection = testAPIConnection;
window.getNewsStats = getNewsStats;
window.NewsRealtimeUpdater = NewsRealtimeUpdater;
window.NewsCache = NewsCache;
