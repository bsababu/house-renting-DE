import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ListingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  VERIFIED = 'verified',
  SCAM = 'scam',
  DISCOVERED = 'discovered',
}

export enum ListingType {
  PRIVATE = 'private',
  WG = 'wg',
  STUDIO = 'studio',
  HOUSE = 'house',
}

@Entity('listings')
@Index(['originalUrl'], { unique: true })
@Index(['locationName'])
@Index(['priceWarm'])
@Index(['createdAt'])
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  externalId: string;

  @Column({ default: 'unknown' })
  platform: string;

  @Column()
  originalUrl: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  descriptionSummary: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceWarm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceCold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  deposit: number;

  @Column({ type: 'float', nullable: true })
  size: number;

  @Column({ type: 'float', nullable: true })
  rooms: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  locationName: string;

  // Landlord / Owner Information
  @Column({ nullable: true })
  landlordName: string;

  @Column({ nullable: true })
  landlordEmail: string;

  @Column({ nullable: true })
  landlordPhone: string;

  @Column({ nullable: true })
  landlordWebsite: string;

  // Listing Classification
  @Column({ type: 'enum', enum: ListingType, default: ListingType.PRIVATE })
  listingType: ListingType;

  @Column({ type: 'boolean', nullable: true })
  anmeldungPossible: boolean;

  @Column({ type: 'text', nullable: true })
  insuranceRequired: string;

  @Column({ type: 'text', nullable: true })
  reviewSummary: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  images: string[];

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.ACTIVE })
  status: ListingStatus;

  @Column({ type: 'float', default: 0 })
  trustScore: number;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'jsonb', nullable: true })
  rawData: any;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  scamIndicators: { type: string; severity: string; explanation: string }[];

  // Reviews Cache
  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  // Neighborhood Intelligence Cache
  @Column({ type: 'jsonb', nullable: true })
  neighborhoodData: {
      transitScore: number;
      walkScore: number;
      nearbyAmenities: string[];
      safetyScore: number;
      vibe: string;
  };

  @Column({ type: 'date', nullable: true })
  availableFrom: Date;

  // Geo Coordinates for Map View
  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
