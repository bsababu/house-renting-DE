import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus, ApplicationMethod } from './application.entity';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  async create(data: {
    userId: string;
    listingId: string;
    letterContent: string;
    method: ApplicationMethod;
    status?: ApplicationStatus;
  }): Promise<Application> {
    const application = this.applicationRepository.create({
      ...data,
      status: data.status || ApplicationStatus.GENERATED,
    });
    return this.applicationRepository.save(application);
  }

  async findAllByUser(userId: string): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { userId },
      relations: ['listing'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id, userId },
      relations: ['listing'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async updateStatus(
    id: string,
    userId: string,
    newStatus: ApplicationStatus,
    notes?: string,
  ): Promise<Application> {
    const application = await this.findOne(id, userId);
    application.status = newStatus;
    if (notes !== undefined) {
      application.notes = notes;
    }
    if (newStatus === ApplicationStatus.SENT) {
      application.sentAt = new Date();
    }
    return this.applicationRepository.save(application);
  }

  async getStats(userId: string) {
    const applications = await this.applicationRepository.find({ where: { userId } });
    const stats = {
      total: applications.length,
      byStatus: {} as Record<ApplicationStatus, number>,
    };

    Object.values(ApplicationStatus).forEach((status) => {
      stats.byStatus[status] = applications.filter((a) => a.status === status).length;
    });

    return stats;
  }

  async findExisting(userId: string, listingId: string): Promise<Application | null> {
    return this.applicationRepository.findOne({
      where: { userId, listingId },
    });
  }
}
