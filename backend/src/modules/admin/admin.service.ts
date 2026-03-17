import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Listing, ListingStatus } from '../listings/listing.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  // ── Overview Stats ────────────────────────────
  async getStats() {
    const [totalUsers, totalListings, activeListings, scamListings] =
      await Promise.all([
        this.usersRepository.count(),
        this.listingsRepository.count(),
        this.listingsRepository.count({ where: { status: ListingStatus.ACTIVE } }),
        this.listingsRepository.count({ where: { status: ListingStatus.SCAM } }),
      ]);

    // Listings by platform
    const platformStats = await this.listingsRepository
      .createQueryBuilder('listing')
      .select('listing.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .groupBy('listing.platform')
      .getRawMany();

    // Recent users (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :weekAgo', { weekAgo })
      .getCount();

    return {
      users: { total: totalUsers, recentSignups: recentUsers },
      listings: {
        total: totalListings,
        active: activeListings,
        scam: scamListings,
        byPlatform: platformStats,
      },
    };
  }

  // ── User Management ───────────────────────────
  async getUsers(page = 1, limit = 20) {
    const [users, total] = await this.usersRepository.findAndCount({
      select: ['id', 'email', 'role', 'firstName', 'lastName', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');
    user.role = role;
    await this.usersRepository.save(user);
    this.logger.log(`Updated user ${userId} role to ${role}`);
    return { id: userId, role };
  }

  // ── Listing Moderation ────────────────────────
  async getListings(page = 1, limit = 20, status?: string, platform?: string) {
    const qb = this.listingsRepository
      .createQueryBuilder('listing')
      .select([
        'listing.id',
        'listing.title',
        'listing.priceWarm',
        'listing.locationName',
        'listing.platform',
        'listing.status',
        'listing.trustScore',
        'listing.createdAt',
        'listing.images',
      ])
      .orderBy('listing.createdAt', 'DESC');

    if (status) {
      qb.andWhere('listing.status = :status', { status });
    }
    if (platform) {
      qb.andWhere('listing.platform = :platform', { platform });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [listings, total] = await qb.getManyAndCount();
    return { data: listings, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateListingStatus(listingId: string, status: ListingStatus) {
    await this.listingsRepository.update(listingId, { status });
    this.logger.log(`Updated listing ${listingId} status to ${status}`);
    return { id: listingId, status };
  }

  async deleteListing(listingId: string) {
    const result = await this.listingsRepository.delete(listingId);
    this.logger.log(`Deleted listing ${listingId}`);
    return { deleted: result.affected > 0 };
  }
}
