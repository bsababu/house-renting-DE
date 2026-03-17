import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ImmoweltAgent {
  private readonly logger = new Logger(ImmoweltAgent.name);
  private readonly BASE_URL = 'https://www.immowelt.de';

  constructor(private aiService: AiService) {}

  async search(city: string = 'Berlin'): Promise<any[]> {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const url = `${this.BASE_URL}/liste/${citySlug}/wohnungen/mieten`;

    this.logger.log(`Scraping Immowelt for ${city}: ${url}`);

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

      // Immowelt listing card links
      $('a[href*="/expose/"]').each((index, element) => {
        const link = $(element).attr('href');
        if (link && resultLinks.length < 5) {
          const fullLink = link.startsWith('http') ? link : `${this.BASE_URL}${link}`;
          if (!resultLinks.includes(fullLink)) {
            resultLinks.push(fullLink);
          }
        }
      });

      this.logger.log(`Found ${resultLinks.length} Immowelt links. Starting AI parsing...`);

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

          // Extract Images (Immowelt specific selectors)
          const extractedImages: string[] = [];

          // 1. Gallery images (newer Immowelt layouts)
          detail$('app-media-gallery img').each((_, el) => {
             const src = detail$(el).attr('src');
             if (src) extractedImages.push(src);
          });
          
          // 2. Legacy Gallery
          detail$('.sd-gallery-element img').each((_, el) => {
             const src = detail$(el).attr('src') || detail$(el).attr('data-src');
             if (src) extractedImages.push(src);
          });

          // 3. Meta tag fallback
          if (extractedImages.length === 0) {
             const metaImg = detail$('meta[property="og:image"]').attr('content');
             if (metaImg) extractedImages.push(metaImg);
          }

          // Unique & Valid URLs only
          const uniqueImages = [...new Set(extractedImages)].filter(url => url && url.startsWith('http'));

          const structuredData = await this.aiService.parseListing(rawContent);
          if (structuredData) {
            listings.push({
              ...structuredData,
              originalUrl: link,
              source: 'Immowelt',
              images: uniqueImages,
            });
          }
        } catch (detailError) {
          this.logger.error(`Error parsing Immowelt detail ${link}: ${detailError.message}`);
        }
      }

      return listings;
    } catch (error) {
      this.logger.error(`Error scraping Immowelt for ${city}: ${error.message}`);
      return [];
    }
  }
}
