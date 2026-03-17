import { IsOptional, IsString, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  monthlyIncome?: string;

  @IsOptional()
  @IsString()
  schufaStatus?: string;

  @IsOptional()
  @IsString()
  moveInDate?: string;

  @IsOptional()
  @IsString()
  introText?: string;

  @IsOptional()
  @IsBoolean()
  hasWBS?: boolean;

  @IsOptional()
  @IsString()
  preferredCity?: string;

  // Matching Preferences
  @IsOptional()
  @IsString()
  maxBudget?: string;

  @IsOptional()
  @IsString()
  minSize?: string;

  @IsOptional()
  @IsString()
  minRooms?: string;

  @IsOptional()
  @IsString()
  preferredDistricts?: string;

  @IsOptional()
  @IsBoolean()
  balcony?: boolean;

  @IsOptional()
  @IsBoolean()
  parking?: boolean;
}
