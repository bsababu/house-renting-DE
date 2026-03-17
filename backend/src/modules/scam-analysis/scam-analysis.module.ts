import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from '../listings/listing.entity';
import { ScamAnalysisService } from './scam-analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Listing])],
  providers: [ScamAnalysisService],
  exports: [ScamAnalysisService],
})
export class ScamAnalysisModule {}
