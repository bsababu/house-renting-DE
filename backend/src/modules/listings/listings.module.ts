import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './listing.entity';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AiModule } from '../ai/ai.module';
import { DeduplicationService } from './deduplication.service';
import { ScamAnalysisModule } from '../scam-analysis/scam-analysis.module';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing]),
    AiModule,
    ScamAnalysisModule,
    forwardRef(() => DiscoveryModule),
  ],
  providers: [ListingsService, DeduplicationService],
  controllers: [ListingsController],
  exports: [ListingsService, DeduplicationService],
})
export class ListingsModule {}
