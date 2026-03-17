import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NeighborhoodData {
  transitScore: number;
  walkScore: number;
  nearbyAmenities: string[];
  safetyScore: number;
  vibe: string; // e.g., "Quiet Residential", "Bustling Nightlife"
}

@Injectable()
export class NeighborhoodsService {
  private readonly logger = new Logger(NeighborhoodsService.name);

  constructor(private configService: ConfigService) {}

  async getNeighborhoodData(lat: number, lng: number): Promise<NeighborhoodData> {
    // In a real implementation, we would call Google Maps, WalkScore, or OpenStreetMap APIs here.
    // For now, we will mock deterministic data based on the coordinates to simulate the feature.
    
    // Deterministic mock based on lat/lng
    const scoreBase = (lat + lng) * 1000;
    const transitScore = Math.floor(Math.abs(Math.sin(scoreBase) * 100));
    const walkScore = Math.floor(Math.abs(Math.cos(scoreBase) * 100));
    const safetyScore = Math.floor(80 + (Math.abs(Math.sin(scoreBase * 2)) * 20)); // 80-100

    const amenities = [
        'Supermarket', 'Café', 'Park', 'Gym', 'Subway Station', 'Bakery', 'Pharmacy'
    ];
    // Randomly select 3-5 amenities
    const nearbyAmenities = amenities.filter(() => Math.random() > 0.5).slice(0, 4);

    const vibes = ['Quiet Residential', 'Trendy & Hip', 'Family Friendly', 'Bustling Center', 'Green & Relaxed'];
    const vibe = vibes[Math.floor(Math.abs(Math.sin(scoreBase)) * vibes.length)];

    return {
      transitScore,
      walkScore,
      nearbyAmenities,
      safetyScore,
      vibe
    };
  }
}
