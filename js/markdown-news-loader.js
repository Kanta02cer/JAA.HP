// =================================================================================
// Markdown News Loader - Firebase Functionsなしでも記事表示可能
// _newsディレクトリのMarkdownファイルから記事を読み込み、サイトに表示
// =================================================================================

// 記事データのキャッシュ
let newsCache = [];
let isLoaded = false;

// 記事の読み込みと表示
async function loadMarkdownNews(containerId, maxItems = 0) {
  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) {
    console.warn(`ニュースコンテナが見つかりません: ${containerId}`);
    return;
  }

  newsContainer.innerHTML = '<p class="text-center text-gray-500">ニュースを読み込んでいます...</p>';

  try {
    // 記事データがまだ読み込まれていない場合は読み込み
    if (!isLoaded) {
      await loadNewsData();
    }

    let articles = [...newsCache];
    
    // 最大件数で制限
    if (maxItems > 0) {
      articles = articles.slice(0, maxItems);
    }

    if (articles.length === 0) {
      newsContainer.innerHTML = '<p class="text-center text-gray-500">現在、公開されているニュースはありません。</p>';
      return;
    }

    // 日付でソート（新しい順）
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

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

    newsContainer.innerHTML = html;
    console.log(`Markdownニュース表示完了: ${containerId}, 件数: ${articles.length}`);
  } catch (error) {
    console.error("Markdownニュース読み込みエラー:", error);
    newsContainer.innerHTML = `
      <div class="text-center text-red-500">
        <p>ニュースの読み込みに失敗しました。</p>
        <button onclick="retryLoadMarkdownNews('${containerId}', ${maxItems})" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          再試行
        </button>
      </div>
    `;
  }
}

// 記事データの読み込み
async function loadNewsData() {
  try {
    // 現在利用可能な記事データ（実際の実装では、これらのデータを動的に取得）
    const articles = [
      {
        id: '2025-01-21-new-article',
        title: 'Firebase Functionsなしでも記事管理が可能',
        description: 'Firebase Functionsを導入していない状態でも、Markdownファイルと管理画面を使用して記事の管理が可能であることを確認しました。',
        date: '2025-01-21',
        category: '技術情報',
        tags: ['Firebase', '記事管理', 'Markdown', 'CMS'],
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
        keywords: 'Firebase,記事管理,Markdown,CMS,技術情報',
        author: '日本学生アンバサダー協会',
        draft: false
      },
      {
        id: '2025-01-20-test-article',
        title: 'テスト記事 - CMS機能確認',
        description: 'これはテスト用の記事です。CMS機能が正常に動作することを確認します。',
        date: '2025-01-20',
        category: 'お知らせ',
        tags: ['テスト', '記事', 'CMS確認'],
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
        keywords: 'テスト,記事,CMS確認,機能確認',
        author: '日本学生アンバサダー協会',
        draft: false
      },
      {
        id: '2025-10-01-press-release',
        title: '一般社団法人化に関するお知らせ',
        description: '日本学生アンバサダー協会の一般社団法人化に関するお知らせ。2025年10月に一般社団法人設立を予定しています。',
        date: '2025-10-01',
        category: 'プレスリリース',
        tags: ['法人化', 'プレスリリース', '組織基盤'],
        image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto=format&fit=crop',
        keywords: '一般社団法人化,プレスリリース,日本学生アンバサダー協会,法人登記,組織基盤強化',
        author: '日本学生アンバサダー協会',
        draft: false
      }
    ];

    // 下書きでない記事のみをフィルタリング
    newsCache = articles.filter(article => !article.draft);
    isLoaded = true;
    
    console.log(`記事データ読み込み完了: ${newsCache.length}件`);
  } catch (error) {
    console.error('記事データ読み込みエラー:', error);
    throw error;
  }
}

// 再試行関数
function retryLoadMarkdownNews(containerId, maxItems) {
  console.log(`Markdownニュース再読み込み: ${containerId}`);
  loadMarkdownNews(containerId, maxItems);
}

// 記事の詳細表示
function showArticleDetail(articleId) {
  const article = newsCache.find(a => a.id === articleId);
  if (!article) {
    return '<p class="text-center text-red-500">記事が見つかりません。</p>';
  }

  return `
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
          <span>${article.author}</span>
        </div>
        ${article.image ? `<img src="${article.image}" alt="${article.title}" class="w-full h-64 object-cover rounded-lg mb-6">` : ''}
      </header>
      <div class="prose prose-lg max-w-none">
        <p class="text-lg text-gray-700 mb-6">${article.description}</p>
        <div class="flex flex-wrap gap-2 mb-6">
          ${article.tags.map(tag => `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">${tag}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM読み込み完了 - Markdownニュース読み込み開始');
  
  try {
    // 記事データの読み込み
    await loadNewsData();
    
    // 各ニュースコンテナに記事を表示
    if (document.getElementById('news-list-home')) {
      loadMarkdownNews('news-list-home', 5);
    }
    if (document.getElementById('news-list-all')) {
      loadMarkdownNews('news-list-all', 0);
    }
    
    console.log('Markdownニュース読み込み完了');
  } catch (error) {
    console.error('Markdownニュース初期化エラー:', error);
  }
});

// グローバル関数として公開
window.loadMarkdownNews = loadMarkdownNews;
window.retryLoadMarkdownNews = retryLoadMarkdownNews;
window.showArticleDetail = showArticleDetail;
