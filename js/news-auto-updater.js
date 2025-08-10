// =================================================================================
// JAA News Auto Updater - Service Worker登録と記事更新の自動反映
// =================================================================================

class NewsAutoUpdater {
  constructor() {
    this.serviceWorker = null;
    this.isRegistered = false;
    this.updateCheckInterval = null;
    this.lastUpdateCheck = 0;
    this.updateCheckCooldown = 30 * 1000; // 30秒のクールダウン
  }

  // 初期化
  async init() {
    try {
      console.log('JAA News Auto Updater 初期化開始');
      
      // Service Workerの登録
      await this.registerServiceWorker();
      
      // 記事更新のリスナー設定
      this.setupUpdateListeners();
      
      // 定期的な更新チェック開始
      this.startPeriodicUpdateCheck();
      
      console.log('JAA News Auto Updater 初期化完了');
    } catch (error) {
      console.error('JAA News Auto Updater 初期化エラー:', error);
    }
  }

  // Service Workerの登録
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/js/news-service-worker.js', {
          scope: '/'
        });
        
        this.serviceWorker = registration;
        this.isRegistered = true;
        
        console.log('Service Worker 登録完了:', registration);
        
        // Service Workerの状態監視
        this.monitorServiceWorker(registration);
        
        // メッセージリスナーの設定
        this.setupServiceWorkerMessageListener();
        
      } catch (error) {
        console.error('Service Worker 登録エラー:', error);
        this.isRegistered = false;
      }
    } else {
      console.log('Service Worker がサポートされていません');
      this.isRegistered = false;
    }
  }

  // Service Workerの状態監視
  monitorServiceWorker(registration) {
    // インストール完了時の処理
    registration.addEventListener('installing', (event) => {
      console.log('Service Worker インストール中...');
    });

    // インストール完了時の処理
    registration.addEventListener('installed', (event) => {
      console.log('Service Worker インストール完了');
    });

    // アクティベート時の処理
    registration.addEventListener('activate', (event) => {
      console.log('Service Worker アクティベート完了');
    });

    // 更新時の処理
    registration.addEventListener('updatefound', (event) => {
      console.log('Service Worker 更新を検出');
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('新しいService Workerが利用可能です');
          this.showServiceWorkerUpdateNotification();
        }
      });
    });
  }

  // Service Worker更新通知の表示
  showServiceWorkerUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <div>
          <p class="font-bold">システム更新が利用可能です</p>
          <p class="text-sm opacity-90">最新の機能を利用するにはページを再読み込みしてください</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 opacity-75 hover:opacity-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // 10秒後に自動で消える
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Service Workerメッセージリスナーの設定
  setupServiceWorkerMessageListener() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'NEWS_UPDATE_DETECTED') {
          console.log('Service Workerからニュース更新通知を受信:', event.data);
          await this.handleServiceWorkerNewsUpdate(event.data);
        } else if (event.data && event.data.type === 'FORCE_NEWS_REFRESH') {
          console.log('Service Workerから強制更新通知を受信:', event.data);
          await this.forceNewsRefresh();
        }
      });
    }
  }

  // 記事更新のリスナー設定
  setupUpdateListeners() {
    // ページの可視性変更時
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await this.checkForUpdatesOnVisibilityChange();
      }
    });

    // ウィンドウフォーカス時
    window.addEventListener('focus', async () => {
      await this.checkForUpdatesOnFocus();
    });

    // オンライン復帰時
    window.addEventListener('online', async () => {
      await this.checkForUpdatesOnOnline();
    });

    // メッセージイベント（他のページからの通知）
    window.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'FORCE_NEWS_REFRESH') {
        console.log('他のページからニュース更新通知を受信:', event.data);
        await this.forceNewsRefresh();
      }
    });
  }

  // 可視性変更時の更新チェック
  async checkForUpdatesOnVisibilityChange() {
    const now = Date.now();
    if (now - this.lastUpdateCheck < this.updateCheckCooldown) {
      return;
    }
    
    console.log('ページが表示されました - ニュース更新チェック');
    await this.checkForNewsUpdates();
  }

  // フォーカス時の更新チェック
  async checkForUpdatesOnFocus() {
    const now = Date.now();
    if (now - this.lastUpdateCheck < this.updateCheckCooldown) {
      return;
    }
    
    console.log('ウィンドウにフォーカスが戻りました - ニュース更新チェック');
    await this.checkForNewsUpdates();
  }

  // オンライン復帰時の更新チェック
  async checkForUpdatesOnOnline() {
    console.log('オンライン復帰 - ニュース更新チェック');
    await this.checkForNewsUpdates();
  }

  // 定期的な更新チェック開始
  startPeriodicUpdateCheck() {
    // 5分間隔で更新チェック
    this.updateCheckInterval = setInterval(async () => {
      await this.checkForNewsUpdates();
    }, 5 * 60 * 1000);
    
    console.log('定期的なニュース更新チェック開始 (5分間隔)');
  }

  // ニュース更新チェック
  async checkForNewsUpdates() {
    try {
      const now = Date.now();
      if (now - this.lastUpdateCheck < this.updateCheckCooldown) {
        return;
      }
      
      this.lastUpdateCheck = now;
      
      // APIから最新のニュース統計を取得
      const stats = await this.getNewsStats();
      if (stats) {
        const lastUpdate = this.getLastUpdateTime();
        if (stats.lastUpdated !== lastUpdate) {
          console.log('ニュース更新を検出 - 自動更新開始');
          await this.handleNewsUpdate({
            type: 'AUTO_UPDATE',
            timestamp: now,
            action: 'refresh',
            data: stats
          });
        }
      }
    } catch (error) {
      console.log('ニュース更新チェックエラー:', error);
    }
  }

  // ニュース統計の取得
  async getNewsStats() {
    try {
      const response = await fetch('https://asia-northeast1-jaa-hp.cloudfunctions.net/getNewsStats');
      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : null;
      }
    } catch (error) {
      console.log('ニュース統計取得エラー:', error);
    }
    return null;
  }

  // 最後の更新時刻の取得
  getLastUpdateTime() {
    // セッションストレージから取得
    return sessionStorage.getItem('lastNewsUpdate') || 0;
  }

  // 最後の更新時刻の更新
  updateLastUpdateTime() {
    sessionStorage.setItem('lastNewsUpdate', Date.now().toString());
  }

  // Service Workerからのニュース更新処理
  async handleServiceWorkerNewsUpdate(updateData) {
    try {
      console.log('Service Worker経由のニュース更新処理開始:', updateData);
      
      // 最後の更新時刻を更新
      this.updateLastUpdateTime();
      
      // ニュースの強制更新
      await this.forceNewsRefresh();
      
      // 更新完了通知
      this.showUpdateNotification('Service Workerがニュース更新を検出しました');
      
    } catch (error) {
      console.error('Service Worker経由のニュース更新処理エラー:', error);
    }
  }

  // ニュースの強制更新
  async forceNewsRefresh() {
    try {
      console.log('ニュース強制更新開始');
      
      // 既存のニュースローダーが利用可能な場合
      if (typeof window.loadNews === 'function') {
        const containers = ['news-list-home', 'news-list-all', 'news-detail-content'];
        
        for (const containerId of containers) {
          const container = document.getElementById(containerId);
          if (container) {
            const maxItems = containerId === 'news-list-home' ? 5 : 0;
            await window.loadNews(containerId, maxItems, { 
              forceRefresh: true, 
              showLoading: false 
            });
          }
        }
      }
      
      // キャッシュのクリア
      if (typeof window.newsCache !== 'undefined') {
        window.newsCache.clear();
      }
      
      console.log('ニュース強制更新完了');
      
    } catch (error) {
      console.error('ニュース強制更新エラー:', error);
    }
  }

  // 記事更新の処理
  async handleNewsUpdate(updateData) {
    try {
      console.log('記事更新処理開始:', updateData);
      
      // 最後の更新時刻を更新
      this.updateLastUpdateTime();
      
      // ニュースの強制更新
      await this.forceNewsRefresh();
      
      // 更新完了通知
      this.showUpdateNotification('ニュースが更新されました');
      
    } catch (error) {
      console.error('記事更新処理エラー:', error);
    }
  }

  // 更新通知の表示
  showUpdateNotification(message) {
    // 既存の通知があれば削除
    const existingNotification = document.querySelector('.news-auto-update-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 新しい通知を作成
    const notification = document.createElement('div');
    notification.className = 'news-auto-update-notification fixed top-4 left-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <div>
          <p class="font-bold">自動更新完了</p>
          <p class="text-sm opacity-90">${message}</p>
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
      if (notification.parentElement) {
        notification.style.transform = 'translateX(-100%)';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  // クリーンアップ
  destroy() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    
    if (this.serviceWorker && this.serviceWorker.unregister) {
      this.serviceWorker.unregister();
    }
    
    console.log('JAA News Auto Updater クリーンアップ完了');
  }
}

// グローバルインスタンス
let newsAutoUpdater = null;

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    newsAutoUpdater = new NewsAutoUpdater();
    await newsAutoUpdater.init();
  } catch (error) {
    console.error('News Auto Updater 初期化エラー:', error);
  }
});

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
  if (newsAutoUpdater) {
    newsAutoUpdater.destroy();
  }
});

// グローバル関数として公開
window.newsAutoUpdater = newsAutoUpdater;
window.forceNewsRefresh = () => {
  if (newsAutoUpdater) {
    return newsAutoUpdater.forceNewsRefresh();
  }
};
