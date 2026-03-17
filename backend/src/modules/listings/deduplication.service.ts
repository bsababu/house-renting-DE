import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './listing.entity';

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  /**
   * Find a potential duplicate listing by comparing:
   * 1. Exact URL match
   * 2. Normalized address + similar price (±5%) + similar size (±3m²)
   */
  async findDuplicate(newListing: any): Promise<Listing | null> {
    // Check by URL first (fastest)
    if (newListing.originalUrl) {
      const urlMatch = await this.listingsRepository.findOne({
        where: { originalUrl: newListing.originalUrl },
      });
      if (urlMatch) return urlMatch;
    }

    // Fuzzy match: address + price + size
    const address = this.normalizeAddress(newListing.address || newListing.location || '');
    if (!address) return null;

    const price = newListing.warmRent || newListing.price || 0;
    const size = newListing.size || 0;

    if (!price && !size) return null;

    const qb = this.listingsRepository.createQueryBuilder('listing');

    // Normalized address match (case-insensitive, trimmed)
    qb.where(
      'LOWER(REPLACE(listing.address, \' \', \'\')) LIKE :address OR LOWER(REPLACE(listing.locationName, \' \', \'\')) LIKE :address',
      { address: `%${address}%` },
    );

    // Price within ±5%
    if (price > 0) {
      qb.andWhere('listing.priceWarm BETWEEN :minPrice AND :maxPrice', {
        minPrice: price * 0.95,
        maxPrice: price * 1.05,
      });
    }

    // Size within ±3m²
    if (size > 0) {
      qb.andWhere('listing.size BETWEEN :minSize AND :maxSize', {
        minSize: size - 3,
        maxSize: size + 3,
      });
    }

    const match = await qb.getOne();

    if (match) {
      this.logger.log(
        `Duplicate found: "${newListing.title}" matches existing "${match.title}" (ID: ${match.id})`,
      );
    }

    return match;
  }

  /**
   * Merge data from duplicate sources, preferring verified/richer data.
   */
  async mergeDuplicate(existing: Listing, newData: any): Promise<Listing> {
    // Only fill in missing fields, don't overwrite existing
    if (!existing.landlordEmail && newData.landlordEmail) {
      existing.landlordEmail = newData.landlordEmail;
    }
    if (!existing.landlordPhone && newData.landlordPhone) {
      existing.landlordPhone = newData.landlordPhone;
    }
    if (!existing.landlordName && newData.landlordName) {
      existing.landlordName = newData.landlordName;
    }
    if (!existing.deposit && newData.deposit) {
      existing.deposit = newData.deposit;
    }
    if (!existing.descriptionSummary && newData.descriptionSummary) {
      existing.descriptionSummary = newData.descriptionSummary;
    }

    // Merge images (unique only)
    const existingImages = existing.images || [];
    const newImages = newData.images || [];
    const merged = [...new Set([...existingImages, ...newImages])];
    existing.images = merged.length > 0 ? merged : existing.images;

    return this.listingsRepository.save(existing);
  }

  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/str\./g, 'straße')
      .replace(/\s+/g, '')
      .replace(/[^\w\däöüß]/g, '')
      .trim();
  }
}
