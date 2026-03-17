import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScraperProcessor } from './scraper.processor';
import { BullModule } from '@nestjs/bullmq';
import { ChatModule } from '../chat/chat.module';
import { WgGesuchtAgent } from './agents/wg-gesucht.agent';
import { ImmoScoutAgent } from './agents/immoscout.agent';
import { ImmoweltAgent } from './agents/immowelt.agent';
import { KleinanzeigenAgent } from './agents/kleinanzeigen.agent';
import { SentinelService } from './sentinel.service';
import { AiModule } from '../ai/ai.module';
import { ListingsModule } from '../listings/listings.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    AiModule, 
    forwardRef(() => ListingsModule), 
    AlertsModule, 
    ChatModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'scraper-queue',
    }),
  ],
  providers: [
    ScraperService,
    WgGesuchtAgent,
    ImmoScoutAgent,
    ImmoweltAgent,
    KleinanzeigenAgent,
    SentinelService,
    ScraperProcessor,
  ],
  controllers: [ScraperController],
  exports: [ScraperService, SentinelService],
})
export class ScraperModule {}
