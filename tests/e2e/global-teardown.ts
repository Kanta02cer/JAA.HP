import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 グローバルティアダウン開始');
  
  // テスト結果の集計
  try {
    console.log('📊 テスト結果の集計中...');
    
    // 必要に応じてテスト結果の処理を追加
    // 例: レポートの生成、結果のアップロードなど
    
    console.log('✅ テスト結果の集計完了');
    
  } catch (error) {
    console.error('❌ テスト結果の集計でエラーが発生:', error);
  }
  
  console.log('🎯 グローバルティアダウン完了');
  console.log('🚀 すべてのテストが完了しました！');
}

export default globalTeardown;
