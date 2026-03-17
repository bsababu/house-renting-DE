import { Controller, Get, Param, Query, NotFoundException, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ListingsService } from './listings.service';
import { SearchListingsDto } from './dto/search-listings.dto';
import { AiService } from '../ai/ai.service';
import { ScamAnalysisService } from '../scam-analysis/scam-analysis.service';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly aiService: AiService,
    private readonly scamAnalysisService: ScamAnalysisService,
  ) {}

  @Get('matched')
  async getMatchedListings(
    @Query('maxBudget') maxBudget?: number,
    @Query('minSize') minSize?: number,
    @Query('minRooms') minRooms?: number,
    @Query('preferredCity') preferredCity?: string,
    @Query('preferredDistricts') preferredDistricts?: string,
    @Query('balcony') balcony?: string,
    @Query('parking') parking?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const prefs = {
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
      minSize: minSize ? Number(minSize) : undefined,
      minRooms: minRooms ? Number(minRooms) : undefined,
      preferredCity,
      preferredDistricts,
      balcony: balcony === 'true',
      parking: parking === 'true',
    };
    return this.listingsService.getMatchedListings(prefs, Number(page), Math.min(Number(limit), 100));
  }

  @Get('stats')
  async getStats() {
    return this.listingsService.getStats();
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.listingsService.findAll(Number(page), Math.min(Number(limit), 100));
  }

  @Get('search')
  async search(@Query() dto: SearchListingsDto) {
    return this.listingsService.search(dto);
  }

  /**
   * AI-powered natural language search.
   * User sends a plain English/German query, AI extracts structured filters,
   * then we run the same search engine.
   */
  // @UseGuards(AuthGuard('jwt'))
  @Post('ai-search')
  async aiSearch(@Body('query') query: string) {
    try {
      const extractedFilters = await this.aiService.extractSearchIntent(query);
      
      const dto = new SearchListingsDto();
      if (extractedFilters.city) dto.city = extractedFilters.city;
      if (extractedFilters.district) dto.district = extractedFilters.district;
      if (extractedFilters.minPrice) dto.minPrice = extractedFilters.minPrice;
      if (extractedFilters.maxPrice) dto.maxPrice = extractedFilters.maxPrice;
      if (extractedFilters.minRooms) dto.minRooms = extractedFilters.minRooms;
      if (extractedFilters.maxRooms) dto.maxRooms = extractedFilters.maxRooms;
      if (extractedFilters.minSize) dto.minSize = extractedFilters.minSize;
      if (extractedFilters.maxSize) dto.maxSize = extractedFilters.maxSize;
      if (extractedFilters.listingType) dto.listingType = extractedFilters.listingType;
      if (extractedFilters.features) dto.features = extractedFilters.features;

      const results = await this.listingsService.search(dto);

      return {
        ...results,
        extractedFilters,
        originalQuery: query,
      };
    } catch (err) {
      // Return empty results gracefully instead of crashing
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        extractedFilters: {},
        originalQuery: query,
        error: 'AI search processing failed. Try using the sidebar filters instead.',
      };
    }
  }

  @Get('map')
  async mapSearch(
    @Query('swLat') swLat: number,
    @Query('swLng') swLng: number,
    @Query('neLat') neLat: number,
    @Query('neLng') neLng: number,
  ) {
    return this.listingsService.searchByBounds(
      Number(swLat), Number(swLng), Number(neLat), Number(neLng),
    );
  }

  @Get(':id/trust-report')
  async getTrustReport(@Param('id') id: string) {
    const report = await this.scamAnalysisService.getTrustReport(id);
    if (!report) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    return report;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const listing = await this.listingsService.findOne(id);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    return listing;
  }
}
