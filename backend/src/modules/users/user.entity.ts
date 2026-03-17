import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Don't return password by default
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  // Profile Data for Applications
  @Column({ type: 'jsonb', nullable: true })
  profileData: {
    monthlyIncome?: string;
    occupation?: string;
    schufaStatus?: string;
    moveInDate?: string;
    introText?: string;
    hasWBS?: boolean;
    preferredCity?: string;
    // Matching Preferences
    maxBudget?: number;
    minSize?: number;
    minRooms?: number;
    pets?: boolean;
    parking?: boolean;
    balcony?: boolean;
    preferredDistricts?: string;
  };

  // Saved / bookmarked listing IDs
  @Column({ type: 'jsonb', nullable: true, default: [] })
  savedListings: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
