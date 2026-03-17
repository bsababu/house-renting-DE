import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { Listing } from '../listings/listing.entity';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { DiplomatService } from '../diplomat/diplomat.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
    @Inject(forwardRef(() => DiplomatService))
    private diplomatService: DiplomatService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, data: Partial<Alert>): Promise<Alert> {
    const alert = this.alertsRepository.create({ ...data, userId });
    return this.alertsRepository.save(alert);
  }

  async findAll(userId: string): Promise<Alert[]> {
    return this.alertsRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.alertsRepository.delete({ id, userId });
  }

  async checkListing(listing: Listing) {
    // Guard: skip if listing has no location
    if (!listing.locationName) {
      this.logger.warn(`Listing ${listing.id} has no locationName, skipping alert check`);
      return;
    }

    // 1. Find all active alerts that might match this listing
    // Optimization: Filter by city at DB level first
    const alerts = await this.alertsRepository.createQueryBuilder('alert')
      .where('alert.enabled = :enabled', { enabled: true })
      .andWhere("alert.filters->>'city' ILIKE :city", { city: listing.locationName.split(',')[0].trim() }) 
      .getMany();
      
    this.logger.log(`Checking ${alerts.length} alerts for new listing: ${listing.title}`);

    for (const alert of alerts) {
      if (this.matches(alert, listing)) {
        await this.triggerAlert(alert, listing);
      }
    }
  }

  private matches(alert: Alert, listing: Listing): boolean {
    const f = alert.filters;
    if (f.maxPrice && listing.priceWarm > f.maxPrice) return false;
    if (f.minSize && listing.size < f.minSize) return false;
    if (f.minRooms && listing.rooms < f.minRooms) return false;
    if (f.districts && f.districts.length > 0) {
      const haystack = `${listing.address || ''} ${listing.locationName || ''}`.toLowerCase();
      const districtMatch = f.districts.some(d => haystack.includes(d.toLowerCase()));
      if (!districtMatch) return false;
    }
    return true;
  }

  private async triggerAlert(alert: Alert, listing: Listing) {
    this.logger.log(`Alert "${alert.name}" triggered for user ${alert.userId}`);
    
    // Update last triggered
    await this.alertsRepository.update(alert.id, { lastTriggeredAt: new Date() });

    // Send Email
    const user = await this.usersService.findOneById(alert.userId);
    if (user) {
      await this.emailService.sendNewListingAlert(user.email, user.firstName || 'there', listing);
    }

    // Auto-apply if enabled — The Diplomat sends a German Bewerbung automatically
    if (alert.autoApply && user && ['premium', 'admin'].includes(user.role)) {
      this.logger.log(`⚡ Auto-applying to listing ${listing.id} for user ${alert.userId}`);
      try {
        const alreadyApplied = await this.diplomatService.findExistingApplication(user.id, listing.id);
        if (!alreadyApplied) {
          await this.diplomatService.queueApplication(user, listing.id);
          this.logger.log(`✅ Auto-application queued for ${user.email} → ${listing.title}`);
        } else {
          this.logger.log(`Skipping auto-apply: user already applied to ${listing.id}`);
        }
      } catch (err) {
        this.logger.error(`Auto-apply failed for listing ${listing.id}:`, err.stack);
      }
    } else if (alert.autoApply) {
      this.logger.warn(`Auto-apply skipped for user ${alert.userId}: premium required`);
    }
  }
}
