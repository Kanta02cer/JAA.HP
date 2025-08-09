// =================================================================================
// JAA News Loader (Firebase Edition)
// Firestoreからニュースを取得し、index.html（最新5件）/news.html（全件）に描画
// =================================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDUm0XzV9wPIHJSTsKiJ9LXqjlIA81l1Rc",
  authDomain: "jaa-hp.firebaseapp.com",
  projectId: "jaa-hp",
  storageBucket: "jaa-hp.appspot.com",
  messagingSenderId: "549447513177",
  appId: "1:549447513177:web:2f2fc2f9bfe0ddd29d6d48",
  measurementId: "G-JLRH848YQS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadNews(containerId, maxItems = 0) {
  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) return;

  newsContainer.innerHTML = '<p class="text-center text-gray-500">ニュースを読み込んでいます...</p>';

  try {
    const newsCol = collection(db, "news");
    const q = maxItems > 0
      ? query(newsCol, where("status", "==", "published"), orderBy("createdAt", "desc"), limit(maxItems))
      : query(newsCol, where("status", "==", "published"), orderBy("createdAt", "desc"));

    const qs = await getDocs(q);
    const rawArticles = qs.docs.map(d => ({ id: d.id, ...d.data() }));

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
  } catch (e) {
    console.error("Error fetching news:", e);
    newsContainer.innerHTML = '<p class="text-center text-red-500">ニュースの読み込みに失敗しました。</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('news-list-home')) {
    loadNews('news-list-home', 5);
  }
  if (document.getElementById('news-list-all')) {
    loadNews('news-list-all', 0);
  }
});
