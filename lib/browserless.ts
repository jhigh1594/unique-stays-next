import puppeteer, { type Browser, type Page } from 'puppeteer-core';

const WS_ENDPOINT = `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`;

export async function withBrowser<T>(
  fn: (page: Page) => Promise<T>,
  options: { timeout?: number } = {}
): Promise<T> {
  const browser: Browser = await puppeteer.connect({
    browserWSEndpoint: WS_ENDPOINT,
  });

  try {
    const page = await browser.newPage();
    if (options.timeout) page.setDefaultTimeout(options.timeout);
    return await fn(page);
  } finally {
    await browser.close();
  }
}

export async function screenshot(url: string): Promise<Buffer> {
  return withBrowser(async (page) => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    return page.screenshot({ fullPage: true }) as Promise<Buffer>;
  });
}

export async function scrape(url: string): Promise<string> {
  return withBrowser(async (page) => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    return page.content();
  });
}
