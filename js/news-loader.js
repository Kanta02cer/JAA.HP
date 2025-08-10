// =================================================================================
// JAA News Loader (Firebase Functions API Edition) - GitHub Pages Compatible
// Firebase Functions経由でニュースを取得し、index.html（最新5件）/news.html（全件）に描画
// =================================================================================

// Firebase Functions API エンドポイント
const API_BASE_URL = 'https://asia-northeast1-jaa-hp.cloudfunctions.net';

// ニュース読み込み関数
async function loadNews(containerId, maxItems = 0) {
  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) {
    console.warn(`ニュースコンテナが見つかりません: ${containerId}`);
    return;
  }

  newsContainer.innerHTML = '<p class="text-center text-gray-500">ニュースを読み込んでいます...</p>';

  try {
    console.log(`ニュース読み込み開始: ${containerId}, 最大件数: ${maxItems}`);

    // Firebase Functions APIを使用してニュースを取得
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

    const articles = result.data || [];
    console.log(`取得したニュース件数: ${articles.length}`);

    if (articles.length === 0) {
      newsContainer.innerHTML = '<p class="text-center text-gray-500">現在、公開されているニュースはありません。</p>';
      return;
    }

    // 日付でソート（APIから既にソート済みですが、念のため）
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

    newsContainer.innerHTML = html;
    console.log(`ニュース表示完了: ${containerId}`);
  } catch (e) {
    console.error("ニュース読み込みエラー:", e);
    
    // エラーメッセージを詳細に表示
    let errorMessage = 'ニュースの読み込みに失敗しました。';
    
    if (e.message.includes('HTTP 500')) {
      errorMessage = 'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。';
    } else if (e.message.includes('HTTP 404')) {
      errorMessage = 'APIエンドポイントが見つかりません。';
    } else if (e.message.includes('fetch')) {
      errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    } else if (e.message.includes('CORS')) {
      errorMessage = 'CORSエラーが発生しました。ブラウザの設定を確認してください。';
    }
    
    newsContainer.innerHTML = `
      <div class="text-center text-red-500">
        <p>${errorMessage}</p>
        <button onclick="retryLoadNews('${containerId}', ${maxItems})" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          再試行
        </button>
        <div class="mt-2 text-xs text-gray-500">
          <p>エラー詳細: ${e.message}</p>
        </div>
      </div>
    `;
  }
}

// 再試行関数
function retryLoadNews(containerId, maxItems) {
  console.log(`ニュース再読み込み: ${containerId}`);
  loadNews(containerId, maxItems);
}

// フォールバック用のサンプルニュース表示（APIが利用できない場合）
function showFallbackNews(containerId, maxItems = 5) {
  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) return;

  console.log(`フォールバックニュース表示: ${containerId}`);

  const fallbackNews = [
    {
      title: 'サイトメンテナンスのお知らせ',
      date: '2025-01-20',
      category: 'お知らせ'
    },
    {
      title: '新年度の活動について',
      date: '2025-01-15',
      category: '活動報告'
    },
    {
      title: 'パートナー企業との連携強化',
      date: '2025-01-10',
      category: 'パートナーシップ'
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
      <p>※ 現在サンプルデータを表示しています</p>
      <p>API接続が復旧次第、最新のニュースが表示されます</p>
    </div>
  `;
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

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM読み込み完了 - ニュース読み込み開始');
  
  try {
    // API接続テスト
    const apiAvailable = await testAPIConnection();
    
    if (apiAvailable) {
      // APIが利用可能な場合
      console.log('Firebase Functions API接続成功 - ニュース読み込み開始');
      if (document.getElementById('news-list-home')) {
        loadNews('news-list-home', 5);
      }
      if (document.getElementById('news-list-all')) {
        loadNews('news-list-all', 0);
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
});

// グローバル関数として公開（デバッグ用）
window.loadNews = loadNews;
window.retryLoadNews = retryLoadNews;
window.showFallbackNews = showFallbackNews;
window.testAPIConnection = testAPIConnection;
