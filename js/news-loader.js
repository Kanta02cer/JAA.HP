// =================================================================================
// JAA News Loader (Firebase Edition) - GitHub Pages Compatible
// Firestoreからニュースを取得し、index.html（最新5件）/news.html（全件）に描画
// =================================================================================

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyDUm0XzV9wPIHJSTsKiJ9LXqjlIA81l1Rc",
  authDomain: "jaa-hp.firebaseapp.com",
  projectId: "jaa-hp",
  storageBucket: "jaa-hp.appspot.com",
  messagingSenderId: "549447513177",
  appId: "1:549447513177:web:2f2fc2f9bfe0ddd29d6d48",
  measurementId: "G-JLRH848YQS"
};

// Firebase初期化とFirestore取得
let app, db;

// Firebase初期化関数
async function initializeFirebase() {
  try {
    // Firebase SDKが読み込まれているかチェック
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDKが読み込まれていません。動的読み込みを試行します。');
      await loadFirebaseSDK();
    }
    
    // Firebase初期化
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
      console.log('Firebase初期化完了');
    } else {
      app = firebase.app();
      console.log('既存のFirebaseアプリを使用');
    }
    
    // Firestore設定
    db = firebase.firestore();
    
    // GitHub Pagesでの動作を改善するための設定
    if (window.location.hostname === 'kanta02cer.github.io' || window.location.hostname === 'localhost') {
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: true,
        useFetchStreams: false
      });
      console.log('GitHub Pages用のFirestore設定を適用');
    }
    
    // Firestore接続テスト
    try {
      await db.collection('news').limit(1).get();
      console.log('Firestore接続成功');
      return true;
    } catch (testError) {
      console.error('Firestore接続テスト失敗:', testError);
      return false;
    }
  } catch (error) {
    console.error('Firebase初期化エラー:', error);
    return false;
  }
}

// Firebase SDK動的読み込み
async function loadFirebaseSDK() {
  return new Promise((resolve, reject) => {
    console.log('Firebase SDK動的読み込み開始');
    
    // Firebase App
    const appScript = document.createElement('script');
    appScript.src = 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
    appScript.onload = () => {
      console.log('Firebase App SDK読み込み完了');
      
      // Firestore
      const firestoreScript = document.createElement('script');
      firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
      firestoreScript.onload = () => {
        console.log('Firebase Firestore SDK読み込み完了');
        resolve();
      };
      firestoreScript.onerror = (error) => {
        console.error('Firebase Firestore SDK読み込み失敗:', error);
        reject(error);
      };
      document.head.appendChild(firestoreScript);
    };
    appScript.onerror = (error) => {
      console.error('Firebase App SDK読み込み失敗:', error);
      reject(error);
    };
    document.head.appendChild(appScript);
  });
}

// ニュース読み込み関数
async function loadNews(containerId, maxItems = 0) {
  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) {
    console.warn(`ニュースコンテナが見つかりません: ${containerId}`);
    return;
  }

  newsContainer.innerHTML = '<p class="text-center text-gray-500">ニュースを読み込んでいます...</p>';

  try {
    // Firebase初期化
    const firebaseReady = await initializeFirebase();
    if (!firebaseReady) {
      throw new Error('Firebase初期化に失敗しました');
    }

    console.log(`ニュース読み込み開始: ${containerId}, 最大件数: ${maxItems}`);

    const newsCol = db.collection("news");
    let q = newsCol.where("status", "==", "published").orderBy("createdAt", "desc");
    
    if (maxItems > 0) {
      q = q.limit(maxItems);
    }

    const qs = await q.get();
    const rawArticles = qs.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`取得したニュース件数: ${rawArticles.length}`);

    if (rawArticles.length === 0) {
      newsContainer.innerHTML = '<p class="text-center text-gray-500">現在、公開されているニュースはありません。</p>';
      return;
    }

    // 更新日優先（なければ作成日）で並び替え
    const sorted = rawArticles.sort((a, b) => {
      const aTime = (a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0);
      const bTime = (b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0);
      return bTime - aTime;
    });

    const articles = maxItems > 0 ? sorted.slice(0, maxItems) : sorted;

    const html = articles.map(article => {
      const dateObj = article.updatedAt?.toDate?.() ?? article.createdAt?.toDate?.();
      const postDate = dateObj ? dateObj.toLocaleDateString('ja-JP') : '日付不明';
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
    
    if (e.code === 'permission-denied') {
      errorMessage = 'データベースへのアクセス権限がありません。';
    } else if (e.code === 'unavailable') {
      errorMessage = 'データベースが一時的に利用できません。しばらく時間をおいてから再試行してください。';
    } else if (e.message.includes('Firebase')) {
      errorMessage = 'Firebaseの初期化に失敗しました。ネットワーク接続を確認してください。';
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
          <p>エラーコード: ${e.code || 'N/A'}</p>
          <p>エラーメッセージ: ${e.message}</p>
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

// フォールバック用のサンプルニュース表示
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
      <p>Firebase接続が復旧次第、最新のニュースが表示されます</p>
    </div>
  `;
}

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM読み込み完了 - ニュース読み込み開始');
  
  try {
    // Firebase初期化を試行
    const firebaseReady = await initializeFirebase();
    
    if (firebaseReady) {
      // Firebaseが利用可能な場合
      console.log('Firebase初期化成功 - ニュース読み込み開始');
      if (document.getElementById('news-list-home')) {
        loadNews('news-list-home', 5);
      }
      if (document.getElementById('news-list-all')) {
        loadNews('news-list-all', 0);
      }
    } else {
      // Firebaseが利用できない場合、フォールバック表示
      console.warn('Firebaseが利用できないため、フォールバック表示を使用します');
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
window.initializeFirebase = initializeFirebase;
