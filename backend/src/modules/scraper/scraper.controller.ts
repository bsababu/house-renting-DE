import { Controller, Get, Post, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WgGesuchtAgent } from './agents/wg-gesucht.agent';
import { ImmoScoutAgent } from './agents/immoscout.agent';
import { ImmoweltAgent } from './agents/immowelt.agent';
import { KleinanzeigenAgent } from './agents/kleinanzeigen.agent';
import { SentinelService } from './sentinel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('scraper')
@UseGuards(JwtAuthGuard)
export class ScraperController {
  constructor(
    private readonly wgGesuchtAgent: WgGesuchtAgent,
    private readonly immoScoutAgent: ImmoScoutAgent,
    private readonly immoweltAgent: ImmoweltAgent,
    private readonly kleinanzeigenAgent: KleinanzeigenAgent,
    private readonly sentinelService: SentinelService,
    @InjectQueue('scraper-queue') private scraperQueue: Queue,
  ) {}

  @Get('test/wg-gesucht')
  async testWgGesucht(@Query('city') city: string = 'Berlin') {
    return this.wgGesuchtAgent.search(city);
  }

  @Get('test/immoscout')
  async testImmoScout(@Query('city') city: string = 'Berlin') {
    return this.immoScoutAgent.search(city);
  }

  @Get('test/immowelt')
  async testImmowelt(@Query('city') city: string = 'Berlin') {
    return this.immoweltAgent.search(city);
  }

  @Get('test/kleinanzeigen')
  async testKleinanzeigen(@Query('city') city: string = 'Berlin') {
    return this.kleinanzeigenAgent.search(city);
  }

  @Get('scan')
  async runScan(@Request() req, @Query('city') city: string = 'Berlin') {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.sentinelService.scanAllPlatforms(city);
  }

  @Post('scan-live')
  async scanLive(@Request() req, @Body() body: { city: string; maxPrice?: number }) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const userId = req.user.userId;
    const city = body.city || 'Berlin';
    
    // Add to queue
    await this.scraperQueue.add('scan-live', {
      userId,
      city,
      maxPrice: body.maxPrice,
    }, {
      priority: 1, // High priority
      attempts: 1,
      removeOnComplete: true,
    });

    return { status: 'queued', message: `Live scan for ${city} queued.` };
  }
}
