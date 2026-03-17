import { Injectable, Logger } from '@nestjs/common';
import { ScraperService } from '../scraper.service';
import { AiService } from '../../ai/ai.service';
import * as cheerio from 'cheerio';

@Injectable()
export class WgGesuchtAgent {
  private readonly logger = new Logger(WgGesuchtAgent.name);
  private readonly BASE_URL = 'https://www.wg-gesucht.de';

  constructor(
    private scraperService: ScraperService,
    private aiService: AiService,
  ) {}

  async search(city: string = 'Berlin'): Promise<any[]> {
    const validCity = city.toLowerCase();
    const url = `${this.BASE_URL}/1-zimmer-wohnungen-in-${validCity}.8.1.1.0.html`;

    this.logger.log(`Scraping WG-Gesucht for ${city}: ${url}`);
    
    try {
      const html = await this.scraperService.fetchPage(url);
      const $ = cheerio.load(html);
      const resultLinks: string[] = [];

      // Extract listing links from the search page
      $('.wgg_card').each((index, element) => {
        let link = $(element).find('a.detailansicht').attr('href');
        if (link && resultLinks.length < 5) {
          // If the link is relative, prepend the BASE_URL
          // External links (like Spotahome) usually start with http
          if (!link.startsWith('http')) {
            link = `${this.BASE_URL}${link}`;
          }
          
          // For now, we only process native WG-Gesucht links for structured parsing
          if (link.includes('wg-gesucht.de')) {
            resultLinks.push(link);
          }
        }
      });

      this.logger.log(`Found ${resultLinks.length} native listing links. Starting AI parsing...`);

      const listings: any[] = [];
      for (const link of resultLinks) {
        try {
          this.logger.log(`Fetching detail page: ${link}`);
          const detailHtml = await this.scraperService.fetchPage(link);
          const detail$ = cheerio.load(detailHtml);
          
          // Get the main body text for AI parsing
          const rawContent = detail$('body').text();
          
          const structuredData = await this.aiService.parseListing(rawContent);
          if (structuredData) {
            listings.push({
              ...structuredData,
              originalUrl: link,
              source: 'WG-Gesucht',
            });
          }
        } catch (detailError) {
          this.logger.error(`Error parsing detail page ${link}: ${detailError.message}`);
        }
      }

      return listings;

    } catch (error) {
      this.logger.error(`Error scraping WG-Gesucht search page: ${error.message}`);
      return [];
    }
  }

  // Legacy method fix if used elsewhere
  async getListings(url: string) {
    return this.search('Berlin');
  }
}
