import { Module, forwardRef } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { ScraperModule } from '../scraper/scraper.module';
import { ListingsModule } from '../listings/listings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from '../listings/listing.entity';
import { DiscoveryGateway } from './discovery.gateway';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    AiModule,
    forwardRef(() => ScraperModule),
    forwardRef(() => ListingsModule),
    TypeOrmModule.forFeature([Listing]),
  ],
  providers: [DiscoveryService, DiscoveryGateway],
  exports: [DiscoveryService, DiscoveryGateway],
})
export class DiscoveryModule {}
