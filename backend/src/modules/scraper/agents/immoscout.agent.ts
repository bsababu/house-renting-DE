import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ImmoScoutAgent {
  private readonly logger = new Logger(ImmoScoutAgent.name);
  private readonly BASE_URL = 'https://www.immobilienscout24.de';

  constructor(private aiService: AiService) {}

  async search(city: string = 'Berlin'): Promise<any[]> {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const url = `${this.BASE_URL}/Suche/de/${this.getCityState(city)}/${citySlug}/wohnung-mieten`;

    this.logger.log(`Scraping ImmoScout24 for ${city}: ${url}`);

    try {
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(html);
      const resultLinks: string[] = [];

      // ImmoScout uses result-list entries
      $('article[data-item="result"]').each((index, element) => {
        const link = $(element).find('a[href*="/expose/"]').attr('href');
        if (link && resultLinks.length < 5) {
          const fullLink = link.startsWith('http') ? link : `${this.BASE_URL}${link}`;
          resultLinks.push(fullLink);
        }
      });

      // Fallback selector if primary doesn't match
      if (resultLinks.length === 0) {
        $('a[href*="/expose/"]').each((index, element) => {
          const link = $(element).attr('href');
          if (link && resultLinks.length < 5) {
            const fullLink = link.startsWith('http') ? link : `${this.BASE_URL}${link}`;
            if (!resultLinks.includes(fullLink)) {
              resultLinks.push(fullLink);
            }
          }
        });
      }

      this.logger.log(`Found ${resultLinks.length} ImmoScout links. Starting AI parsing...`);

      const listings: any[] = [];
      for (const link of resultLinks) {
        try {
          const { data: detailHtml } = await axios.get(link, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept-Language': 'de-DE,de;q=0.9',
            },
            timeout: 15000,
          });

          const detail$ = cheerio.load(detailHtml);
          const rawContent = detail$('body').text();

          const structuredData = await this.aiService.parseListing(rawContent);
          if (structuredData) {
            listings.push({
              ...structuredData,
              originalUrl: link,
              source: 'ImmoScout24',
            });
          }
        } catch (detailError) {
          this.logger.error(`Error parsing ImmoScout detail ${link}: ${detailError.message}`);
        }
      }

      return listings;
    } catch (error) {
      this.logger.error(`Error scraping ImmoScout24 for ${city}: ${error.message}`);
      return [];
    }
  }

  private getCityState(city: string): string {
    const cityStateMap: Record<string, string> = {
      berlin: 'berlin/berlin',
      munich: 'bayern/muenchen',
      münchen: 'bayern/muenchen',
      hamburg: 'hamburg/hamburg',
      frankfurt: 'hessen/frankfurt-am-main',
      cologne: 'nordrhein-westfalen/koeln',
      köln: 'nordrhein-westfalen/koeln',
      düsseldorf: 'nordrhein-westfalen/duesseldorf',
      stuttgart: 'baden-wuerttemberg/stuttgart',
      dresden: 'sachsen/dresden',
      leipzig: 'sachsen/leipzig',
    };
    return cityStateMap[city.toLowerCase()] || `${city.toLowerCase()}/${city.toLowerCase()}`;
  }
}
