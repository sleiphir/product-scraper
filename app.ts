import { config } from 'dotenv';
import { Webhook } from 'discord-webhook-node';
import Scraper from './scraper/Scraper';
import stores from './configs/stores';
import puppeteer from 'puppeteer';

(async () => {
  config();
  const webhook = new Webhook(process.env.DISCORD_WEBHOOK_URL);
  const browser = await puppeteer.launch();
  const scrapers = stores.map(store => { return new Scraper(store, webhook); });
  scrapers.forEach(scraper => {
    scraper.start(browser);
  });
})();
