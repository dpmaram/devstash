import { test, expect, devices } from 'playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'tmp', 'ui-review');
const findings = {
  register: {},
  dashboard: {},
  mobile: {},
};

test.use({ baseURL: 'http://localhost:3000' });

test('register page + dashboard sidebar checks', async ({ page }) => {
  fs.mkdirSync(outDir, { recursive: true });

  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const githubSelectors = [
    'button:has-text("GitHub")',
    'a:has-text("GitHub")',
    '[aria-label*="GitHub" i]',
    '[href*="github" i]',
  ];

  let githubVisible = false;
  let githubSelector = null;
  for (const selector of githubSelectors) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible())) {
      githubVisible = true;
      githubSelector = selector;
      break;
    }
  }

  findings.register = {
    url: page.url(),
    githubVisible,
    githubSelector,
  };

  await page.screenshot({ path: path.join(outDir, 'register-desktop.png'), fullPage: true });

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').first().fill('demo@devstash.io');
  await page.locator('input[type="password"]').first().fill('12345678');
  await Promise.all([
    page.waitForLoadState('networkidle').catch(() => {}),
    page.locator('button[type="submit"]').first().click(),
  ]);

  if (!page.url().includes('/dashboard')) {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  }

  const sidebar = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('aside nav a, aside a'))
      .map((a) => ({
        text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
        href: a.getAttribute('href') || '',
        cls: a.getAttribute('class') || '',
        ariaCurrent: a.getAttribute('aria-current'),
      }))
      .filter((l) => l.text && l.href);

    const path = window.location.pathname;
    const activeByAria = links.filter((l) => Boolean(l.ariaCurrent));
    const activeByPath = links.filter((l) => l.href === path || (l.href.length > 1 && path.startsWith(l.href)));

    return {
      currentPath: path,
      totalLinks: links.length,
      activeByAria,
      activeByPath,
      sample: links.slice(0, 14),
    };
  });

  findings.dashboard = {
    url: page.url(),
    sidebar,
  };

  await page.screenshot({ path: path.join(outDir, 'dashboard-desktop.png'), fullPage: true });
});

test('mobile register responsiveness quick check', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'], baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  findings.mobile = {
    hasHorizontalOverflow,
    viewport: { width: 390, height: 844 },
  };

  await page.screenshot({ path: path.join(outDir, 'register-mobile.png'), fullPage: true });
  await context.close();
});

test.afterAll(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'playwright-ui-report.json'), JSON.stringify(findings, null, 2));
  // stdout marker for quick parsing
  console.log('PLAYWRIGHT_UI_REPORT=' + JSON.stringify(findings));
});