const fs = require('node:fs');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const baseUrl = 'http://localhost:3000';
const outDir = path.join(process.cwd(), 'tmp', 'ui-review');

function textOrNull(value) {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length ? trimmed : null;
}

async function inspectRegister(page) {
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const githubCandidates = [
    'button:has-text("GitHub")',
    'a:has-text("GitHub")',
    '[aria-label*="GitHub" i]',
    '[href*="github" i]',
  ];

  let githubVisible = false;
  let githubSelector = null;

  for (const selector of githubCandidates) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      const first = page.locator(selector).first();
      if (await first.isVisible()) {
        githubVisible = true;
        githubSelector = selector;
        break;
      }
    }
  }

  await page.screenshot({ path: path.join(outDir, 'register-desktop.png'), fullPage: true });

  return {
    path: '/register',
    title: await page.title(),
    githubVisible,
    githubSelector,
  };
}

async function signInAndInspectSidebar(page) {
  const attemptedAccounts = [];

  async function attemptSignIn(email, password) {
    await page.goto(`${baseUrl}/sign-in`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.fill(email);
    await passwordInput.fill(password);

    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.locator('button[type="submit"]').first().click(),
    ]);

    const pageText = textOrNull(await page.locator('body').innerText());
    attemptedAccounts.push({
      email,
      urlAfterSubmit: page.url(),
      errorSnippet: pageText ? pageText.slice(0, 240) : null,
    });

    return page.url().includes('/dashboard');
  }

  let signedIn = await attemptSignIn('demo@devstash.io', '12345678');

  if (!signedIn) {
    const uniqueEmail = `ui-review-${Date.now()}@example.com`;
    const password = 'password123';

    await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInputs = page.locator('input[type="password"]');
    await emailInput.fill(uniqueEmail);
    await passwordInputs.nth(0).fill(password);
    if ((await passwordInputs.count()) > 1) {
      await passwordInputs.nth(1).fill(password);
    }

    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.locator('button[type="submit"]').first().click(),
    ]);

    signedIn = await attemptSignIn(uniqueEmail, password);
  }

  if (!signedIn) {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
  }

  await page.screenshot({ path: path.join(outDir, 'dashboard-desktop.png'), fullPage: true });

  const sidebarData = await page.evaluate(() => {
    const navCandidates = Array.from(document.querySelectorAll('aside nav a, aside a'));
    const links = navCandidates
      .map((a) => {
        const href = a.getAttribute('href') || '';
        const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
        const cls = a.getAttribute('class') || '';
        const ariaCurrent = a.getAttribute('aria-current');
        return { href, text, cls, ariaCurrent };
      })
      .filter((item) => item.href && item.text);

    const currentPath = window.location.pathname;
    const activeByAria = links.filter((l) => l.ariaCurrent);
    const activeByPath = links.filter((l) => {
      if (l.href === currentPath) return true;
      if (l.href !== '/' && currentPath.startsWith(l.href) && l.href.length > 1) return true;
      return false;
    });

    return {
      currentPath,
      totalSidebarLinks: links.length,
      activeByAria,
      activeByPath,
      sampleLinks: links.slice(0, 12),
    };
  });

  return {
    path: '/dashboard',
    url: page.url(),
    signedIn,
    attemptedAccounts,
    sidebar: sidebarData,
  };
}

async function inspectMobileRegister(browser) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'register-mobile.png'), fullPage: true });

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  await context.close();

  return {
    path: '/register',
    hasHorizontalOverflow,
  };
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const register = await inspectRegister(page);
  const dashboard = await signInAndInspectSidebar(page);
  const mobile = await inspectMobileRegister(browser);

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    register,
    dashboard,
    mobile,
  };

  fs.writeFileSync(path.join(outDir, 'playwright-ui-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  await context.close();
  await browser.close();
})();