import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsUrl } from 'class-validator';
import { ListingType } from '../listing.entity';

export class CreateListingDto {
  @IsString()
  originalUrl: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  descriptionSummary?: string;

  @IsNumber()
  priceWarm: number;

  @IsOptional()
  @IsNumber()
  priceCold?: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsNumber()
  rooms?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  landlordName?: string;

  @IsOptional()
  @IsString()
  landlordEmail?: string;

  @IsOptional()
  @IsString()
  landlordPhone?: string;

  @IsOptional()
  @IsString()
  landlordWebsite?: string;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsBoolean()
  anmeldungPossible?: boolean;

  @IsOptional()
  @IsString()
  insuranceRequired?: string;

  @IsOptional()
  @IsString()
  reviewSummary?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
