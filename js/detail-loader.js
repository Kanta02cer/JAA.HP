// =================================================================================
// JAA Detail Loader (Firebase Edition)
// URLの ?id= から記事を取得して news-detail.html に描画
// =================================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

async function loadArticleDetail() {
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');

  const titleEl = document.getElementById('article-title');
  const categoryEl = document.getElementById('article-category');
  const dateEl = document.getElementById('article-date');
  const contentEl = document.getElementById('article-body');

  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const articleRoot = document.getElementById('article-content');

  if (!articleId) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    return;
  }

  try {
    const ref = doc(db, "news", articleId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    const article = snap.data();
    const postDate = article.createdAt?.toDate().toLocaleDateString('ja-JP') || '日付不明';

    titleEl.textContent = article.title || '無題の記事';
    categoryEl.textContent = article.category || 'カテゴリなし';
    dateEl.textContent = postDate;
    contentEl.innerHTML = article.content || '<p>記事の内容がありません。</p>';
    document.title = `${article.title || 'ニュース詳細'} | 日本学生アンバサダー協会`;

    if (loadingEl) loadingEl.classList.add('hidden');
    if (articleRoot) articleRoot.classList.remove('hidden');
  } catch (e) {
    console.error("Error fetching article detail:", e);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', loadArticleDetail);

