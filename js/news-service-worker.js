// =================================================================================
// JAA News Service Worker - バックグラウンドでのニュース更新監視
// =================================================================================

const CACHE_NAME = 'jaa-news-cache-v1';
const NEWS_UPDATE_INTERVAL = 2 * 60 * 1000; // 2分間隔

// Service Workerのインストール
self.addEventListener('install', (event) => {
  console.log('JAA News Service Worker インストール完了');
  self.skipWaiting();
});

// Service Workerのアクティベート
self.addEventListener('activate', (event) => {
  console.log('JAA News Service Worker アクティベート完了');
  event.waitUntil(self.clients.claim());
  
  // 定期的なニュース更新チェックを開始
  startNewsUpdateCheck();
});

// メッセージ受信処理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NEWS_UPDATED') {
    console.log('Service Worker: ニュース更新通知を受信');
    handleNewsUpdate(event.data);
  }
});

// 定期的なニュース更新チェック
function startNewsUpdateCheck() {
  setInterval(async () => {
    try {
      await checkForNewsUpdates();
    } catch (error) {
      console.log('Service Worker: ニュース更新チェックエラー:', error);
    }
  }, NEWS_UPDATE_INTERVAL);
}

// ニュース更新チェック
async function checkForNewsUpdates() {
  try {
    const response = await fetch('https://asia-northeast1-jaa-hp.cloudfunctions.net/getNewsStats');
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // キャッシュされた統計と比較
        const cachedStats = await getCachedStats();
        if (cachedStats && result.data.lastUpdated !== cachedStats.lastUpdated) {
          console.log('Service Worker: ニュース更新を検出');
          await notifyClientsOfUpdate(result.data);
          await updateCachedStats(result.data);
        }
      }
    }
  } catch (error) {
    console.log('Service Worker: ニュース統計取得エラー:', error);
  }
}

// クライアントへの更新通知
async function notifyClientsOfUpdate(updateData) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'NEWS_UPDATE_DETECTED',
      data: updateData,
      timestamp: Date.now()
    });
  });
}

// ニュース更新の処理
async function handleNewsUpdate(updateData) {
  try {
    console.log('Service Worker: ニュース更新処理開始');
    
    // キャッシュをクリア
    await clearNewsCache();
    
    // クライアントに通知
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'FORCE_NEWS_REFRESH',
        data: updateData,
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('Service Worker: ニュース更新処理エラー:', error);
  }
}

// ニュースキャッシュのクリア
async function clearNewsCache() {
  try {
    const cacheNames = await caches.keys();
    const newsCaches = cacheNames.filter(name => 
      name.includes('news') || name.includes('jaa')
    );
    
    await Promise.all(
      newsCaches.map(name => caches.delete(name))
    );
    
    console.log('Service Worker: ニュースキャッシュクリア完了');
  } catch (error) {
    console.log('Service Worker: キャッシュクリアエラー:', error);
  }
}

// 統計情報のキャッシュ
async function getCachedStats() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('news-stats');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.log('Service Worker: キャッシュ統計取得エラー:', error);
  }
  return null;
}

// 統計情報のキャッシュ更新
async function updateCachedStats(stats) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(stats));
    await cache.put('news-stats', response);
  } catch (error) {
    console.log('Service Worker: キャッシュ統計更新エラー:', error);
  }
}

// プッシュ通知の処理（将来の拡張用）
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.type === 'NEWS_UPDATE') {
        const options = {
          body: data.message || '新しいニュースが投稿されました',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'news-update',
          data: data
        };
        
        event.waitUntil(
          self.registration.showNotification('JAA ニュース更新', options)
        );
      }
    } catch (error) {
      console.log('Service Worker: プッシュ通知処理エラー:', error);
    }
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url)
    );
  }
});

console.log('JAA News Service Worker 読み込み完了');
