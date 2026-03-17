import { ListingsService } from './listings.service';
import { Listing } from './listing.entity';

describe('ListingsService.calculateMatchScore', () => {
  const service = new ListingsService({} as any, {} as any, {} as any);

  it('returns 100 for a perfect match', () => {
    const listing = {
      priceWarm: 1000,
      size: 60,
      rooms: 2,
      locationName: 'Berlin',
      address: 'Berlin Mitte',
      features: ['Balcony'],
      descriptionSummary: 'Balcony included',
    } as Listing;

    const prefs = {
      maxBudget: 1000,
      minSize: 60,
      minRooms: 2,
      preferredCity: 'Berlin',
      preferredDistricts: 'Mitte',
      balcony: true,
    };

    const score = service.calculateMatchScore(listing, prefs);
    expect(score).toBe(100);
  });

  it('penalizes listings that exceed budget', () => {
    const listing = {
      priceWarm: 1500,
      size: 50,
      rooms: 2,
      locationName: 'Berlin',
      address: 'Berlin',
    } as Listing;

    const prefs = { maxBudget: 1000 };
    const score = service.calculateMatchScore(listing, prefs);

    expect(score).toBeLessThan(50);
  });
});
