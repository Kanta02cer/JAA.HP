import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log('🌐 グローバルセットアップ開始');
  console.log(`📡 ベースURL: ${baseURL}`);
  
  // ブラウザを起動してヘルスチェック
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // サイトの応答性を確認
    console.log('🔍 サイトの応答性を確認中...');
    await page.goto(baseURL, { timeout: 60000, waitUntil: 'domcontentloaded' });
    
    // ページタイトルを確認
    const title = await page.title();
    console.log(`📄 ページタイトル: ${title}`);
    
    // 基本的な要素の存在確認
    const body = await page.locator('body');
    await body.waitFor({ state: 'visible', timeout: 30000 });
    
    console.log('✅ サイトの応答性確認完了');
    
  } catch (error) {
    console.error('❌ サイトの応答性確認でエラーが発生:', error);
    // エラーが発生してもテストを続行（サイトが一時的に利用できない可能性）
    console.log('⚠️ サイトの応答性確認に失敗しましたが、テストを続行します');
  } finally {
    await browser.close();
  }
  
  console.log('🎯 グローバルセットアップ完了');
}

export default globalSetup;
