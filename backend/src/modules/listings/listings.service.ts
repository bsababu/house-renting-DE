import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Listing, ListingStatus, ListingType } from './listing.entity';
import { SearchListingsDto } from './dto/search-listings.dto';
import { ScamAnalysisService } from '../scam-analysis/scam-analysis.service';
import { DiscoveryService } from '../discovery/discovery.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    private scamAnalysisService: ScamAnalysisService,
    @Inject(forwardRef(() => DiscoveryService))
    private discoveryService: DiscoveryService,
  ) {}

  async findAll(page: number = 1, limit: number = 20): Promise<PaginatedResult<Listing>> {
    const safePage = Math.max(1, parseInt(String(page), 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const total = await this.listingsRepository.count();
    const totalPages = Math.ceil(total / safeLimit);
    const data = await this.listingsRepository.find({
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { data, total, page: safePage, totalPages };
  }

  async getStats() {
    const total = await this.listingsRepository.count();
    const scamCount = await this.listingsRepository.count({ where: { status: ListingStatus.SCAM } });
    const activeCount = await this.listingsRepository.count({
      where: [{ status: ListingStatus.ACTIVE }, { status: ListingStatus.VERIFIED }],
    });

    // Average trust score
    const avgResult = await this.listingsRepository
      .createQueryBuilder('listing')
      .select('AVG(listing.trustScore)', 'avg')
      .getRawOne();
    const averageTrustScore = Math.round(parseFloat(avgResult?.avg || '0'));

    // Per-platform breakdown
    const platformStats = await this.listingsRepository
      .createQueryBuilder('listing')
      .select('listing.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(listing.trustScore)', 'avgTrust')
      .groupBy('listing.platform')
      .getRawMany();

    // Recently flagged scam listings (last 10)
    const recentScams = await this.listingsRepository.find({
      where: { status: ListingStatus.SCAM },
      order: { createdAt: 'DESC' },
      take: 10,
      select: ['id', 'title', 'priceWarm', 'locationName', 'trustScore', 'scamIndicators', 'platform', 'createdAt'],
    });

    return {
      total,
      activeCount,
      scamCount,
      averageTrustScore,
      platformStats: platformStats.map(p => ({
        platform: p.platform,
        count: parseInt(p.count),
        avgTrust: Math.round(parseFloat(p.avgTrust || '0')),
      })),
      recentScams,
    };
  }

  async findOne(id: string): Promise<Listing> {
    return this.listingsRepository.findOneBy({ id });
  }

  /**
   * Deterministic match score: scores a listing against a user's preferences.
   * Returns 0-100 where 100 = perfect match.
   */
  calculateMatchScore(listing: Listing, prefs: any): number {
    let score = 50; // base score for any listing
    let factors = 0;
    let earned = 0;

    // Budget (max 30 pts) — most important factor
    if (prefs.maxBudget && listing.priceWarm) {
      factors += 30;
      const budget = Number(prefs.maxBudget);
      const price = Number(listing.priceWarm); // TypeORM returns decimal as string
      if (price <= budget) {
        // Under budget = full points; cheaper = slight bonus
        const savings = (budget - price) / budget;
        earned += savings > 0.3 ? 25 : 30; // slightly penalize if too cheap (likely a catch)
      } else {
        // Over budget — lose points proportionally
        const over = (price - budget) / budget;
        earned += Math.max(0, 30 - over * 100);
      }
    }

    // Size (max 15 pts)
    if (prefs.minSize && listing.size) {
      factors += 15;
      if (listing.size >= Number(prefs.minSize)) {
        earned += 15;
      } else {
        const deficit = (Number(prefs.minSize) - listing.size) / Number(prefs.minSize);
        earned += Math.max(0, 15 - deficit * 50);
      }
    }

    // Rooms (max 15 pts)
    if (prefs.minRooms && listing.rooms) {
      factors += 15;
      if (listing.rooms >= Number(prefs.minRooms)) {
        earned += 15;
      } else {
        earned += listing.rooms / Number(prefs.minRooms) * 15;
      }
    }

    // City match (max 20 pts)
    if (prefs.preferredCity && listing.locationName) {
      factors += 20;
      if (listing.locationName.toLowerCase().includes(prefs.preferredCity.toLowerCase())) {
        earned += 20;
      }
    }

    // District match (max 10 pts)
    if (prefs.preferredDistricts && listing.address) {
      factors += 10;
      const districts = prefs.preferredDistricts.split(',').map((d: string) => d.trim().toLowerCase());
      const addr = (listing.address || '').toLowerCase();
      if (districts.some((d: string) => addr.includes(d))) {
        earned += 10;
      }
    }

    // Feature preferences (max 10 pts)
    const featureChecks = [
      { pref: prefs.balcony, keyword: 'balcon' },
      { pref: prefs.parking, keyword: 'park' },
    ];
    const activeFeatures = featureChecks.filter(f => f.pref);
    if (activeFeatures.length > 0) {
      factors += 10;
      const listingFeatures = (listing.features || []).map((f: string) => f.toLowerCase()).join(' ');
      const desc = (listing.descriptionSummary || '').toLowerCase();
      const matchedFeatures = activeFeatures.filter(
        f => listingFeatures.includes(f.keyword) || desc.includes(f.keyword),
      );
      earned += (matchedFeatures.length / activeFeatures.length) * 10;
    }

    // If user has set preferences, calculate weighted score
    if (factors > 0) {
      score = Math.round((earned / factors) * 100);
    }

    // Clamp 0-100
    return Math.max(0, Math.min(100, score));
  }

  async getContextForChat(query: string, limit = 5): Promise<string> {
    // Simple Keyword Search for context
    const keywords = query.split(' ').filter(w => w.length > 3);
    if (keywords.length === 0) return '';

    const qb = this.listingsRepository.createQueryBuilder('listing')
      .where('listing.status = :status', { status: ListingStatus.ACTIVE })
      .orderBy('listing.trustScore', 'DESC');

    // Extract potential price constraint (e.g. "under 800", "max 1000")
    const priceMatch = query.match(/(?:under|max|less than)\s+(\d+)/i);
    if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1]);
        qb.andWhere('listing.priceWarm <= :maxPrice', { maxPrice });
    }

    // Create a robust OR condition
    const conditions = keywords.map((k, i) => 
        `(LOWER(listing.title) LIKE LOWER(:k${i}) OR LOWER(listing.descriptionSummary) LIKE LOWER(:k${i}) OR LOWER(listing.locationName) LIKE LOWER(:k${i}))`
    );
    
    if (conditions.length > 0) {
        qb.andWhere(`(${conditions.join(' OR ')})`, 
            keywords.reduce((acc, k, i) => ({ ...acc, [`k${i}`]: `%${k}%` }), {})
        );
    }

    const listings = await qb.take(limit).getMany();

    if (listings.length === 0) return '';

    return listings.map(l => `
      Listing ID: ${l.id}
      Title: ${l.title}
      Price: ${l.priceWarm || l.priceCold} EUR
      Location: ${l.locationName}
      Rooms: ${l.rooms}
      Size: ${l.size}m²
      Trust Score: ${l.trustScore}
      Link: ${l.originalUrl}
    `).join('\n---\n');
  }

  async getMatchedListings(userProfile: any, page = 1, limit = 20) {
    // Pre-filter at DB level to avoid loading all listings into memory
    const qb = this.listingsRepository.createQueryBuilder('listing')
      .where('listing.status IN (:...statuses)', {
        statuses: [ListingStatus.ACTIVE, ListingStatus.VERIFIED],
      });

    // Apply database-level filters from user preferences
    if (userProfile.maxBudget) {
      // Allow 20% over budget — scoring will penalize accordingly
      qb.andWhere('listing.priceWarm <= :maxPrice', { 
        maxPrice: Number(userProfile.maxBudget) * 1.2 
      });
    }
    if (userProfile.preferredCity) {
      qb.andWhere('LOWER(listing.locationName) LIKE LOWER(:city)', { 
        city: `%${userProfile.preferredCity}%` 
      });
    }
    if (userProfile.minRooms) {
      qb.andWhere('listing.rooms >= :minRooms', { minRooms: Number(userProfile.minRooms) });
    }
    if (userProfile.minSize) {
      qb.andWhere('listing.size >= :minSize', { minSize: Number(userProfile.minSize) });
    }

    qb.orderBy('listing.createdAt', 'DESC');
    // Hard cap to avoid loading too many rows into memory for scoring
    qb.take(500);
    const listings = await qb.getMany();

    // Score each listing
    const scored = listings.map(listing => ({
      ...listing,
      matchScore: this.calculateMatchScore(listing, userProfile || {}),
    }));

    // Sort by match score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Paginate
    const total = scored.length;
    const totalPages = Math.ceil(total / limit);
    const data = scored.slice((page - 1) * limit, page * limit);

    return { data, total, page, totalPages };
  }

  async search(dto: SearchListingsDto): Promise<PaginatedResult<Listing>> {
    const qb = this.listingsRepository.createQueryBuilder('listing');

    // Only active/verified listings
    qb.andWhere('listing.status IN (:...statuses)', {
      statuses: [ListingStatus.ACTIVE, ListingStatus.VERIFIED],
    });

    // City / Location filter (case-insensitive partial match)
    if (dto.city) {
      qb.andWhere(
        '(LOWER(listing.locationName) LIKE LOWER(:city) OR LOWER(listing.address) LIKE LOWER(:city))',
        { city: `%${dto.city}%` },
      );
    }

    // District filter
    if (dto.district) {
      qb.andWhere(
        '(LOWER(listing.locationName) LIKE LOWER(:district) OR LOWER(listing.address) LIKE LOWER(:district))',
        { district: `%${dto.district}%` },
      );
    }

    // Price range
    if (dto.minPrice !== undefined) {
      qb.andWhere('listing.priceWarm >= :minPrice', { minPrice: dto.minPrice });
    }
    if (dto.maxPrice !== undefined) {
      qb.andWhere('listing.priceWarm <= :maxPrice', { maxPrice: dto.maxPrice });
    }

    // Room count
    if (dto.minRooms !== undefined) {
      qb.andWhere('listing.rooms >= :minRooms', { minRooms: dto.minRooms });
    }
    if (dto.maxRooms !== undefined) {
      qb.andWhere('listing.rooms <= :maxRooms', { maxRooms: dto.maxRooms });
    }

    // Size range
    if (dto.minSize !== undefined) {
      qb.andWhere('listing.size >= :minSize', { minSize: dto.minSize });
    }
    if (dto.maxSize !== undefined) {
      qb.andWhere('listing.size <= :maxSize', { maxSize: dto.maxSize });
    }

    // Listing type
    if (dto.listingType) {
      qb.andWhere('listing.listingType = :listingType', { listingType: dto.listingType });
    }

    // Move-in Date Availability
    if (dto.moveInDate) {
      // Find listings available ON or BEFORE user's move-in date
      // (e.g. User moves in Oct 1st -> needs listing available by Oct 1st)
      qb.andWhere('listing.availableFrom <= :moveInDate', { moveInDate: dto.moveInDate });
    }

    // Features filter (check if listing features contain requested features)
    if (dto.features) {
      const featureList = dto.features.split(',').map(f => f.trim().toLowerCase());
      // PostgreSQL JSONB — check features array contains any of the requested features
      for (let i = 0; i < featureList.length; i++) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM jsonb_array_elements_text(listing.features) AS feat WHERE LOWER(feat) LIKE :feat${i})`,
          { [`feat${i}`]: `%${featureList[i]}%` },
        );
      }
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'priceWarm', 'size', 'rooms', 'trustScore'];
    const sortField = allowedSortFields.includes(dto.sortBy) ? dto.sortBy : 'createdAt';
    const sortOrder = dto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`listing.${sortField}`, sortOrder);

    // Pagination
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const total = await qb.getCount();
    const totalPages = Math.ceil(total / limit);

    qb.skip((page - 1) * limit).take(limit);

    const data = await qb.getMany();

    // TRIGGER DISCOVERY if results are low and it's a district/city search
    if (data.length < 8 && (dto.city || dto.district)) {
      this.discoveryService.triggerQuickDiscovery({
        city: dto.city || 'Berlin',
        district: dto.district,
        maxPrice: dto.maxPrice,
      }).catch(err => this.logger.error(`Discovery trigger failed: ${err.message}`));
    }

    return { data, total, page, totalPages };
  }

  async searchByBounds(
    swLat: number, swLng: number, neLat: number, neLng: number,
  ): Promise<Listing[]> {
    return this.listingsRepository.createQueryBuilder('listing')
      .where('listing.latitude IS NOT NULL')
      .andWhere('listing.longitude IS NOT NULL')
      .andWhere('listing.latitude BETWEEN :swLat AND :neLat', { swLat, neLat })
      .andWhere('listing.longitude BETWEEN :swLng AND :neLng', { swLng, neLng })
      .andWhere('listing.status IN (:...statuses)', {
        statuses: [ListingStatus.ACTIVE, ListingStatus.VERIFIED],
      })
      .getMany();
  }

  async upsertListing(data: any): Promise<Listing> {
    const originalUrl = data.originalUrl;
    
    const existing = await this.listingsRepository.findOne({
      where: { originalUrl }
    });

    if (existing) {
      // Update fields that might have been missing on first scrape
      let needsUpdate = false;
      if ((!existing.images || existing.images.length === 0) && data.images?.length > 0) {
        existing.images = data.images;
        needsUpdate = true;
      }
      if (!existing.descriptionSummary && data.descriptionSummary) {
        existing.descriptionSummary = data.descriptionSummary;
        needsUpdate = true;
      }
      if ((!existing.features || existing.features.length === 0) && data.features?.length > 0) {
        existing.features = data.features;
        needsUpdate = true;
      }

      if (needsUpdate) {
        this.logger.log(`Updating missing fields for: ${data.title}`);
        return this.listingsRepository.save(existing);
      }

      this.logger.log(`Listing already exists: ${data.title}`);
      return existing;
    }

    const listing = this.listingsRepository.create({
      originalUrl,
      title: data.title,
      priceWarm: data.warmRent || data.price,
      priceCold: data.price,
      deposit: data.deposit || null,
      size: data.size,
      rooms: data.rooms,
      address: data.address,
      locationName: data.location,
      descriptionSummary: data.descriptionSummary,
      features: data.features,
      images: data.images || [],
      rawData: data,
      platform: data.source || 'unknown',
      status: data.isScamLikely ? ListingStatus.SCAM : ListingStatus.ACTIVE,
      trustScore: data.trustScore ?? (data.isScamLikely ? 10 : 90),
      scamIndicators: data.scamIndicators || [],
      landlordName: data.landlordName || null,
      landlordEmail: data.landlordEmail || null,
      landlordPhone: data.landlordPhone || null,
      landlordWebsite: data.landlordWebsite || null,
      listingType: Object.values(ListingType).includes(data.listingType)
        ? data.listingType
        : ListingType.PRIVATE,
      anmeldungPossible: data.anmeldungPossible ?? null,
      insuranceRequired: data.insuranceRequired || null,
      reviewSummary: data.reviewSummary || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      availableFrom: this.parseAvailabilityDate(data.availableFrom),
    });

    const savedListing = await this.listingsRepository.save(listing);

    // Run scam analysis asynchronously (don't block the save)
    this.scamAnalysisService.analyze(savedListing).catch(err => {
      this.logger.error(`Scam analysis failed for ${savedListing.id}: ${err.message}`);
    });

    return savedListing;
  }

  private parseAvailabilityDate(input: string): Date | null {
    if (!input) return null;
    const lower = input.toLowerCase();
    const now = new Date();
    
    // Immediate availability keywords
    if (['sofort', 'ab sofort', 'immediately', 'now'].some(k => lower.includes(k))) {
        return now;
    }

    // Attempt to parse German date format DD.MM.YYYY
    const deMatch = input.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (deMatch) {
        const day = parseInt(deMatch[1]);
        const month = parseInt(deMatch[2]) - 1; // JS months 0-11
        let year = parseInt(deMatch[3]);
        if (year < 100) year += 2000;
        return new Date(year, month, day);
    }
    
    // Fallback to standard date parse
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
