
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SentinelService } from './sentinel.service';
import { ChatGateway } from '../chat/chat.gateway';
import { KleinanzeigenAgent } from './agents/kleinanzeigen.agent';
import { WgGesuchtAgent } from './agents/wg-gesucht.agent';
import { ImmoScoutAgent } from './agents/immoscout.agent';
import { ImmoweltAgent } from './agents/immowelt.agent';
import { ListingsService } from '../listings/listings.service';
import { DeduplicationService } from '../listings/deduplication.service';

@Processor('scraper-queue')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly sentinelService: SentinelService,
    private readonly kleinanzeigenAgent: KleinanzeigenAgent,
    private readonly wgGesuchtAgent: WgGesuchtAgent,
    private readonly immoScoutAgent: ImmoScoutAgent,
    private readonly immoweltAgent: ImmoweltAgent,
    private readonly listingsService: ListingsService,
    private readonly deduplicationService: DeduplicationService,
    private readonly chatGateway: ChatGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    if (job.name === 'scan-live') {
      return this.handleLiveScan(job);
    }
  }

  private async handleLiveScan(job: Job) {
    const { userId, city, maxPrice } = job.data;
    
    this.logger.log(`Live Scan requested by User ${userId} for ${city} (Max ${maxPrice})`);
    
    try {
        // 1. Notify start
        this.chatGateway.notifyUser(userId, 'SCAN_UPDATE', { 
            status: 'running', 
            message: `Expanding search on all platforms for ${city}...` 
        });

        // 2. Run targeted search in parallel
        const agents = [
          { name: 'Kleinanzeigen', agent: this.kleinanzeigenAgent },
          { name: 'WG-Gesucht', agent: this.wgGesuchtAgent },
          { name: 'ImmoScout24', agent: this.immoScoutAgent },
          { name: 'Immowelt', agent: this.immoweltAgent },
        ];

        let totalNewCount = 0;
        let totalVisibleCount = 0;
        let platformResults = [];

        await Promise.allSettled(
          agents.map(async ({ name, agent }) => {
            try {
              this.chatGateway.notifyUser(userId, 'SCAN_UPDATE', { status: 'running', message: `Scanning ${name}...` });
              
              const rawListings = await agent.search(city);
              let localNew = 0;
              let localVisible = 0;

              for (const listing of rawListings) {
                  const duplicate = await this.deduplicationService.findDuplicate(listing);
                  let savedListing;

                  if (duplicate) {
                      await this.deduplicationService.mergeDuplicate(duplicate, listing);
                      savedListing = duplicate;
                  } else {
                      savedListing = await this.listingsService.upsertListing(listing);
                      localNew++;
                  }

                  let matches = true;
                  if (maxPrice && savedListing.priceWarm > maxPrice) matches = false;
                  if (matches) localVisible++;
              }
              
              totalNewCount += localNew;
              totalVisibleCount += localVisible;
              platformResults.push(`${name}: ${localVisible}`);
            } catch (err) {
              this.logger.error(`${name} scan failed: ${err.message}`);
            }
          })
        );
        
        this.logger.log(`Live Scan complete. ${totalNewCount} new listings. ${totalVisibleCount} match criteria.`);

        // 4. Notify completion
        this.chatGateway.notifyUser(userId, 'SCAN_COMPLETE', {
            status: 'completed',
            count: totalVisibleCount,
            newCount: totalNewCount,
            message: `Found ${totalVisibleCount} listings across platforms (${totalNewCount} new).`
        });

    } catch (error) {
        this.logger.error(`Live Scan failed: ${error.message}`);
        this.chatGateway.notifyUser(userId, 'SCAN_ERROR', {
            status: 'failed',
            message: 'Scan failed. Please try again later.'
        });
        throw error;
    }
  }
}
