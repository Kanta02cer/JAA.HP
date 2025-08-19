import { test, expect, Browser } from '@playwright/test';

const SITE_URL = process.env.SITE_URL || 'https://kanta02cer.github.io/JAA.HP';

test.describe('簡易負荷テスト', () => {
  test('同時アクセス 5 クライアントでニュース一覧が表示できる', async ({ browser }) => {
    const clientCount = 5;
    const contexts = await Promise.all(
      Array.from({ length: clientCount }).map(() => browser.newContext())
    );

    try {
      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
      await Promise.all(
        pages.map(async (page) => {
          await page.goto(`${SITE_URL}/news.html`, { timeout: 60000, waitUntil: 'domcontentloaded' });
          await expect(page.locator('body')).toBeVisible();
          const container = page.locator('#news-list-all');
          await expect.soft(container).toBeVisible({ timeout: 15000 });
        })
      );
    } finally {
      await Promise.all(contexts.map((c) => c.close()));
    }
  });
});

 