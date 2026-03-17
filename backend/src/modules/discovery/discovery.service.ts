import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingStatus, ListingType } from '../listings/listing.entity';
import { ScraperService } from '../scraper/scraper.service';
import { DiscoveryGateway } from './discovery.gateway';
import { AiService } from '../ai/ai.service';
import * as cheerio from 'cheerio';

export interface DiscoveryResult {
  title: string;
  price: number;
  location: string;
  url: string;
  imageUrl: string;
  platform: string;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private scraperService: ScraperService,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    private discoveryGateway: DiscoveryGateway,
    private aiService: AiService,
  ) {}

  async triggerQuickDiscovery(params: { city: string; district?: string; maxPrice?: number; originalQuery?: string }) {
    const { city, district, maxPrice, originalQuery } = params;
    const query = originalQuery || `${city} ${district || ''} ${maxPrice ? 'under ' + maxPrice : ''}`.trim();
    
    this.logger.log(`Triggering agentic discovery for query: "${query}"...`);

    try {
      const platformUrls = await this.aiService.synthesizeSearchUrls(query);
      
      for (const [platform, url] of Object.entries(platformUrls)) {
        this.discoverFromPlatform(platform, url, city).catch(err => {
          this.logger.error(`Discovery failed for platform ${platform}: ${err.message}`);
        });
      }
    } catch (err) {
      this.logger.error(`Failed to trigger discovery flow: ${err.message}`);
    }
  }

  private async discoverFromPlatform(platform: string, url: string, city: string) {
    this.logger.log(`Discovery URL for ${platform}: ${url}`);
    
    try {
      const html = await this.scraperService.fetchPage(url);
      const rawResults = this.extractListingCards(html, url, platform);
      
      this.logger.log(`Discovered ${rawResults.length} potential listings from ${platform} for ${city}. Starting AI Inspection...`);

      if (rawResults.length === 0) return;

      // PHASE 3: The "Inspector" (Batch Scan)
      const analyzedResults = await this.aiService.analyzeDiscoveryBatch(platform, rawResults);
      
      // Save results to DB
      for (const item of analyzedResults) {
        // Skip obvious scams
        if (item.isScam || item.trustScore < 40) {
          this.logger.warn(`Skipping potential scam: ${item.url} (Score: ${item.trustScore})`);
          continue;
        }

        const existing = await this.listingRepository.findOne({ where: { originalUrl: item.url } });
        if (existing) continue;

        let parsed: any = null;
        try {
          const detailHtml = await this.scraperService.fetchPage(item.url);
          const $ = cheerio.load(detailHtml);
          const rawText = $('body').text();
          parsed = await this.aiService.parseListing(rawText);
        } catch (err) {
          this.logger.error(`Failed to parse discovered listing ${item.url}: ${err.message}`);
        }

        if (!parsed?.title) {
          this.logger.warn(`Skipping discovery item without parsed title: ${item.url}`);
          continue;
        }

        const parsedAvailable = parsed?.availableFrom ? new Date(parsed.availableFrom) : null;
        const availableFrom = parsedAvailable && !isNaN(parsedAvailable.getTime()) ? parsedAvailable : null;

        const listingType = Object.values(ListingType).includes(parsed.listingType)
          ? parsed.listingType
          : ListingType.PRIVATE;

        const listing = this.listingRepository.create({
          originalUrl: item.url,
          title: parsed.title || item.title || 'Untitled Discovery',
          priceWarm: parsed.warmRent || parsed.price || item.extractedData?.price || 0,
          priceCold: parsed.price || item.extractedData?.price || 0,
          deposit: parsed.deposit || null,
          rooms: parsed.rooms || item.extractedData?.rooms || 0,
          size: parsed.size || item.extractedData?.size || 0,
          locationName: parsed.location || item.location || city,
          address: parsed.address || null,
          descriptionSummary: parsed.descriptionSummary || null,
          features: parsed.features || [],
          images: parsed.images || [],
          landlordName: parsed.landlordName || null,
          landlordEmail: parsed.landlordEmail || null,
          landlordPhone: parsed.landlordPhone || null,
          landlordWebsite: parsed.landlordWebsite || null,
          platform: platform,
          status: parsed.isScamLikely ? ListingStatus.SCAM : ListingStatus.ACTIVE,
          trustScore: parsed.trustScore ?? item.trustScore ?? 50,
          scamIndicators: parsed.scamIndicators || item.redFlags || [],
          listingType,
          anmeldungPossible: parsed.anmeldungPossible ?? null,
          availableFrom,
        });

        const saved = await this.listingRepository.save(listing);
        this.discoveryGateway.broadcastDiscovery(saved);
      }
    } catch (err) {
      this.logger.error(`Failed to handle discovery for platform ${platform}: ${err.message}`);
    }
  }

  private extractListingCards(html: string, baseUrl: string, platform: string): DiscoveryResult[] {
    const results: DiscoveryResult[] = [];
    
    if (platform === 'immobilienscout24') {
      const cardRegex = /<a[^>]+href="(\/expose\/\d+)"[^>]*>[\s\S]*?<h5[^>]*>(.*?)<\/h5>/g;
      let match;
      while ((match = cardRegex.exec(html)) !== null && results.length < 15) {
        results.push({
          title: match[2].replace(/<[^>]*>/g, '').trim(),
          url: `https://www.immobilienscout24.de${match[1]}`,
          price: 0,
          location: 'Discovery Area',
          imageUrl: '',
          platform
        });
      }
    } else if (platform === 'kleinanzeigen') {
      // Very basic regex for Kleinanzeigen cards
      const cardRegex = /<a[^>]+class="aditem-main--title--anchor"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
      let match;
      while ((match = cardRegex.exec(html)) !== null && results.length < 15) {
        results.push({
          title: match[2].trim(),
          url: `https://www.kleinanzeigen.de${match[1]}`,
          price: 0,
          location: 'Discovery Area',
          imageUrl: '',
          platform
        });
      }
    } else if (platform === 'wg-gesucht') {
      // Very specific regex for WG-Gesucht listing titles and links
      const cardRegex = /<h3[^>]+class="truncate_title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
      let match;
      while ((match = cardRegex.exec(html)) !== null && results.length < 15) {
        results.push({
          title: match[2].trim(),
          url: `https://www.wg-gesucht.de${match[1]}`,
          price: 0,
          location: 'Discovery Area',
          imageUrl: '',
          platform
        });
      }
    }
    
    return results;
  }
}
