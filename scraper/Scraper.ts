import { Browser, Page } from 'puppeteer';
import { Webhook } from 'discord-webhook-node';
import Store from "../types/Store";

class Scraper {
  private store: Store;
  private sentNotification: boolean;
  private webhook: Webhook;
  private interval: NodeJS.Timer;

  constructor(store: Store, webhook: Webhook) {
    this.store = store;
    this.sentNotification = false;
    this.webhook = webhook;
  }

  public async start(browser: Browser): Promise<void> {
    this.webhook.send(`🤖🔊 **${this.store.name}** scraper started.`);
    let page = await browser.newPage();
    this.scrape(page);
    this.interval = setInterval(async () => {
      if (this.store.needsReload) {
        page = await browser.newPage();
      }
      this.scrape(page);
    }, this.store.pollRate);
  }

  public stop(): void {
    clearInterval(this.interval);
  }

  public async scrape(page: Page): Promise<void> {
    this.store.scrapers.forEach(async (scraper) => {
      page.setUserAgent(scraper.data.userAgent);
      await page.goto(scraper.product.url);

      try {
        await page.waitForSelector(scraper.data.selectors.waitFor);
      } catch (e) {
        console.error(`Error while loading ${scraper.product.name} at ${scraper.product.url}`);
        console.error(e);
        return;
      }

      const product = await page.$x(scraper.data.selectors.xpath);
      const date = new Date().toISOString();

      if ((scraper.data.selectors.xpathIsOutOfStock && product.length === 0) || (!scraper.data.selectors.xpathIsOutOfStock && product.length > 0)) {
        if (!this.sentNotification) {
          console.log(`[${this.store.name}][${scraper.product.name}][${date}] is available`);
          this.webhook.send(`✅ ${scraper.product.name} is available on **${this.store.name}**`);
          if (scraper.data.selectors.xpathProductPageUrl) {
            const elementHandle = await page.$x(scraper.data.selectors.xpathProductPageUrl);
            let url = await elementHandle[0].evaluate((element) => element.getAttribute('href'));
            if (url.startsWith('/')) {
              url = `${this.store.website}${url}`;
            }
            this.webhook.send(url);
          } else {
            this.webhook.send(scraper.product.url);
          }
          this.sentNotification = true;
        }
      } else {
        console.log(`[${this.store.name}][${scraper.product.name}][${date}] is out of stock`);
        this.sentNotification = false;
      }

      if (this.store.needsReload) {
        await page.close();
      }
    });
  }
}

export default Scraper;