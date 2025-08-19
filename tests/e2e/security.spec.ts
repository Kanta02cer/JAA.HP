import { test, expect } from '@playwright/test';

// 環境変数から設定を取得
const SITE_URL = process.env.SITE_URL || 'https://kanta02cer.github.io/JAA.HP';

test.describe('セキュリティ検証', () => {
  test('混在コンテンツがないことの確認 (HTTP資源なし)', async ({ page }) => {
    await page.goto(`${SITE_URL}`, { timeout: 60000, waitUntil: 'domcontentloaded' });

    const hasMixedContent = await page.evaluate(() => {
      const isHttp = (url: string | null) => !!url && (url.toLowerCase().startsWith('http://'));
      const elements: Array<HTMLElement & { src?: string; href?: string }> = Array.from(
        document.querySelectorAll('img, script, link[rel="stylesheet"], video, audio, source, iframe')
      ) as any;
      return elements.some((el) => isHttp((el as any).src || (el as any).href));
    });

    expect(hasMixedContent).toBe(false);
  });

  test('target="_blank" の外部リンクに rel="noopener|noreferrer" が付与されている', async ({ page }) => {
    await page.goto(`${SITE_URL}`, { timeout: 60000, waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[target="_blank"]')) as HTMLAnchorElement[];
      const violations = anchors.filter((a) => {
        const rel = (a.getAttribute('rel') || '').toLowerCase();
        return !(rel.includes('noopener') || rel.includes('noreferrer'));
      }).map((a) => a.href);
      return { count: violations.length, violations };
    });

    // 失敗を厳格にせず、検出は残す（必要に応じて厳格化可能）
    expect.soft(result.count, `noopener/noreferrer が不足しているリンク: ${result.violations.join(', ')}`).toBe(0);
  });

  test('HTTPセキュリティヘッダーの存在（情報目的・ソフトアサート）', async ({ request }) => {
    const response = await request.get(`${SITE_URL}`);
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();

    const hasAnySecurityHeader = Boolean(
      headers['content-security-policy'] ||
      headers['x-content-type-options'] ||
      headers['x-frame-options'] ||
      headers['strict-transport-security']
    );

    expect.soft(hasAnySecurityHeader).toBe(true);
  });
});

 