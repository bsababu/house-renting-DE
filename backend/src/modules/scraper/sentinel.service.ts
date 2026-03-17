import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WgGesuchtAgent } from './agents/wg-gesucht.agent';
import { ImmoScoutAgent } from './agents/immoscout.agent';
import { ImmoweltAgent } from './agents/immowelt.agent';
import { KleinanzeigenAgent } from './agents/kleinanzeigen.agent';
import { ListingsService } from '../listings/listings.service';
import { DeduplicationService } from '../listings/deduplication.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class SentinelService {
  private readonly logger = new Logger(SentinelService.name);

  constructor(
    private wgGesuchtAgent: WgGesuchtAgent,
    private immoScoutAgent: ImmoScoutAgent,
    private immoweltAgent: ImmoweltAgent,
    private kleinanzeigenAgent: KleinanzeigenAgent,
    private listingsService: ListingsService,
    private deduplicationService: DeduplicationService,
    private alertsService: AlertsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('⏰ Sentinel scan starting — all platforms...');
    await this.scanAllPlatforms('Berlin');
  }

  async scanAllPlatforms(city: string) {
    const agents = [
      { name: 'WG-Gesucht', agent: this.wgGesuchtAgent },
      { name: 'ImmoScout24', agent: this.immoScoutAgent },
      { name: 'Immowelt', agent: this.immoweltAgent },
      { name: 'Kleinanzeigen', agent: this.kleinanzeigenAgent },
    ];

    const results = await Promise.allSettled(
      agents.map(async ({ name, agent }) => {
        try {
          this.logger.log(`🔍 Scanning ${name} for ${city}...`);
          const listings = await agent.search(city);
          this.logger.log(`✅ ${name}: Found ${listings.length} listings`);

          let newCount = 0;
          let dupeCount = 0;
          for (const listing of listings) {
            const duplicate = await this.deduplicationService.findDuplicate(listing);
            if (duplicate) {
              await this.deduplicationService.mergeDuplicate(duplicate, listing);
              dupeCount++;
            } else {
              const savedListing = await this.listingsService.upsertListing(listing);
              newCount++;
              
              // Check for alerts
              this.alertsService.checkListing(savedListing).catch(err => 
                this.logger.error(`Failed to check alerts for listing ${savedListing.id}: ${err.message}`)
              );
            }
          }

          this.logger.log(`📊 ${name}: ${newCount} new, ${dupeCount} duplicates merged`);
          return { name, total: listings.length, new: newCount, duplicates: dupeCount };
        } catch (error) {
          this.logger.error(`❌ ${name} failed: ${error.message}`);
          return { name, error: error.message };
        }
      }),
    );

    const summary = results.map((r, i) => ({
      platform: agents[i].name,
      status: r.status,
      ...(r.status === 'fulfilled' ? r.value : { error: (r as any).reason?.message }),
    }));

    this.logger.log(`🏁 Sentinel scan complete. Summary: ${JSON.stringify(summary, null, 2)}`);
    return summary;
  }
}
