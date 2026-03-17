import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'firstName', 'lastName', 'profileData'],
    });
  }

  async findOneById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>, passwordRaw: string): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.findOneByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(passwordRaw, salt);

    const newUser = this.usersRepository.create({
      ...userData,
      passwordHash,
    });

    const saved = await this.usersRepository.save(newUser);
    const { passwordHash: _, ...safeUser } = saved;
    return safeUser;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update direct fields
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;

    // Update profileData JSONB
    const profileData = user.profileData || {};
    if (dto.occupation !== undefined) profileData.occupation = dto.occupation;
    if (dto.monthlyIncome !== undefined) profileData.monthlyIncome = dto.monthlyIncome;
    if (dto.schufaStatus !== undefined) profileData.schufaStatus = dto.schufaStatus;
    if (dto.moveInDate !== undefined) profileData.moveInDate = dto.moveInDate;
    if (dto.introText !== undefined) profileData.introText = dto.introText;
    if (dto.hasWBS !== undefined) profileData.hasWBS = dto.hasWBS;
    if (dto.preferredCity !== undefined) profileData.preferredCity = dto.preferredCity;
    
    // Matching preferences
    if (dto.maxBudget !== undefined) profileData.maxBudget = dto.maxBudget ? parseInt(dto.maxBudget, 10) : undefined;
    if (dto.minSize !== undefined) profileData.minSize = dto.minSize ? parseInt(dto.minSize, 10) : undefined;
    if (dto.minRooms !== undefined) profileData.minRooms = dto.minRooms ? parseFloat(dto.minRooms) : undefined;
    if (dto.preferredDistricts !== undefined) profileData.preferredDistricts = dto.preferredDistricts;
    if (dto.balcony !== undefined) profileData.balcony = dto.balcony;
    if (dto.parking !== undefined) profileData.parking = dto.parking;

    user.profileData = profileData;

    return this.usersRepository.save(user);
  }

  async saveListing(userId: string, listingId: string): Promise<string[]> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const saved = user.savedListings || [];
    if (!saved.includes(listingId)) {
      saved.push(listingId);
      user.savedListings = saved;
      await this.usersRepository.save(user);
    }
    return user.savedListings;
  }

  async unsaveListing(userId: string, listingId: string): Promise<string[]> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    user.savedListings = (user.savedListings || []).filter(id => id !== listingId);
    await this.usersRepository.save(user);
    return user.savedListings;
  }

  async getSavedListings(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user.savedListings || [];
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    await this.usersRepository.update(userId, { role });
  }
}
