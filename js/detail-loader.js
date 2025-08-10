// =================================================================================
// JAA Detail Loader (Markdown Edition)
// URLの ?id= から記事を取得して news-detail.html に描画
// Firebase Functionsなしでも動作可能
// =================================================================================

// 記事データのキャッシュ
let articleCache = [];

// 記事データの初期化
async function initializeArticleData() {
  if (articleCache.length > 0) return;

  try {
    // 現在利用可能な記事データ
    const articles = [
      {
        id: '2025-01-21-new-article',
        title: 'Firebase Functionsなしでも記事管理が可能',
        description: 'Firebase Functionsを導入していない状態でも、Markdownファイルと管理画面を使用して記事の管理が可能であることを確認しました。',
        content: `
          <h2>Firebase Functionsなしでも記事管理が可能</h2>
          <p>Firebase Functionsを導入していない状態でも、現在のプロジェクトでは記事の管理が可能であることが確認できました。</p>
          
          <h3>利用可能な機能</h3>
          <h4>1. 記事の表示</h4>
          <ul>
            <li><code>_news/</code> ディレクトリのMarkdownファイルが自動読み込み</li>
            <li>フォールバック機能により、APIがなくても記事が表示される</li>
            <li>カテゴリ、日付、タグなどのメタデータが自動処理</li>
          </ul>
          
          <h4>2. 記事の管理</h4>
          <ul>
            <li><strong>管理画面</strong>: <code>/admin/</code> から各種エディタにアクセス</li>
            <li><strong>Markdown編集</strong>: 直接ファイルを編集可能</li>
            <li><strong>GitHub連携</strong>: GitHub経由での編集も可能</li>
          </ul>
          
          <h4>3. 現在の記事</h4>
          <ul>
            <li>テスト記事（2025-01-20）</li>
            <li>プレスリリース（2025-10-01）</li>
            <li>この記事（2025-01-21）</li>
          </ul>
          
          <h3>技術的な仕組み</h3>
          <ol>
            <li><strong>静的ファイル生成</strong>: MarkdownファイルからHTMLを生成</li>
            <li><strong>JavaScript処理</strong>: クライアントサイドでの記事読み込み</li>
            <li><strong>フォールバック機能</strong>: APIが利用できない場合の代替表示</li>
            <li><strong>管理画面</strong>: 記事作成・編集用のWebインターフェース</li>
          </ol>
          
          <h3>今後の拡張可能性</h3>
          <ul>
            <li>Firebase Functionsの導入により、リアルタイム更新が可能</li>
            <li>データベース連携による高度な管理機能</li>
            <li>ユーザー認証と権限管理</li>
            <li>メディアファイルの自動最適化</li>
          </ul>
        `,
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
        content: `
          <h2>テスト記事</h2>
          <p>これはテスト用の記事です。CMS機能が正常に動作することを確認するために作成されました。</p>
          
          <h3>機能確認項目</h3>
          <ul>
            <li>✅ 記事の表示</li>
            <li>✅ カテゴリフィルター</li>
            <li>✅ 日付表示</li>
            <li>✅ 画像表示</li>
            <li>✅ Markdown形式の本文</li>
          </ul>
          
          <h3>システムの動作確認</h3>
          <p>この記事が正常に表示されることで、以下の機能が動作していることを確認できます：</p>
          
          <ol>
            <li><strong>動的コンテンツ生成</strong>: JavaScriptによる記事の読み込み</li>
            <li><strong>カテゴリ管理</strong>: お知らせカテゴリでの表示</li>
            <li><strong>SEO対策</strong>: メタタグの自動生成</li>
            <li><strong>レスポンシブデザイン</strong>: モバイル対応</li>
          </ol>
          
          <h3>今後の記事追加方法</h3>
          <p>記事を追加する際は、以下の方法が利用できます：</p>
          
          <ol>
            <li><strong>管理画面</strong>: <code>/admin/</code> からGUIで記事管理</li>
            <li><strong>手動作成</strong>: <code>_news/</code> ディレクトリにMarkdownファイルを作成</li>
            <li><strong>API連携</strong>: 将来的に外部APIとの連携も可能</li>
          </ol>
        `,
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
        content: `
          <p>平素より日本学生アンバサダー協会の活動にご理解とご支援を賜り、誠にありがとうございます。</p>
          
          <p>この度、当団体は2025年10月を目途に「一般社団法人日本学生アンバサダー協会」の設立を予定していることをご報告いたします。現在は任意団体として活動しており、法人設立が完了次第、改めてご報告いたします。</p>
          
          <p>また、今後の方針として、2035年を目標に公益社団法人の設立も視野に入れております。</p>
          
          <h2>法人化の背景と目的</h2>
          <p>2025年5月の任意団体設立以来、私たちは「学生だから信頼されないをなくす」というミッションの実現に向け、多くの学生、企業、関係者の皆様に支えられながら活動してまいりました。学生アンバサダー認定サービスの基盤構築や、企業との連携プロジェクトを進める中で、より一層の社会的信頼性を確保し、安定的かつ継続的に事業を推進していく必要性を強く認識するに至りました。</p>
          
          <p>今後、法人格の取得により、組織基盤を強化し、社会的責任を明確にすることで、私たちの活動をさらに加速させてまいります。学生一人ひとりの挑戦に寄り添い、企業や社会との強固な架け橋となるべく、役員・スタッフ一同、決意を新たにしております。</p>
          
          <h2>今後の展望</h2>
          <p>今後は、2035年の公益社団法人化を目指し、非営利性と透明性の高い組織運営に努めてまいります。Webプラットフォームの本格稼働や、学生の活動拠点となるレジデンス事業など、計画中のプロジェクトを着実に実行し、理念の実現に向けて邁進する所存です。</p>
          
          <p>今後とも、変わらぬご支援とご鞭撻を賜りますよう、心よりお願い申し上げます。</p>
        `,
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
    articleCache = articles.filter(article => !article.draft);
    console.log(`記事詳細データ読み込み完了: ${articleCache.length}件`);
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
    dateEl.textContent = new Date(article.date).toLocaleDateString('ja-JP');
    contentEl.innerHTML = article.content || '<p>記事の内容がありません。</p>';
    
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

