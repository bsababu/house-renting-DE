import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

@Injectable()
export class ScraperService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(ScraperService.name);

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching Headless Browser on demand...');
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async fetchPage(url: string): Promise<string> {
    const browser = await this.ensureBrowser();

    let context: BrowserContext | undefined;
    let page: Page | undefined;

    try {
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      });

      page = await context.newPage();
      this.logger.log(`Navigating to ${url}`);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      
      const content = await page.content();
      return content;

    } catch (error) {
      this.logger.error(`Failed to fetch ${url}: ${error.message}`);
      throw error;
    } finally {
      if (page) await page.close();
      if (context) await context.close();
    }
  }
}
