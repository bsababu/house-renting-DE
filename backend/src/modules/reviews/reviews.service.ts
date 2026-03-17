import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewTargetType } from './review.entity';
import { Listing } from '../listings/listing.entity';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  async create(reviewerId: string, data: Partial<Review>): Promise<Review> {
    const review = this.reviewsRepository.create({ ...data, reviewerId });
    const saved = await this.reviewsRepository.save(review);

    // Recalculate average rating for the target
    if (saved.targetType === ReviewTargetType.LISTING) {
      const { average, count } = await this.getAverageRating(saved.targetId, saved.targetType);
      await this.listingsRepository.update(saved.targetId, {
        averageRating: average,
        reviewCount: count,
      });
      this.logger.log(`Updated listing ${saved.targetId} rating: ${average} (${count} reviews)`);
    }

    return saved;
  }

  async findByTarget(targetId: string, targetType: ReviewTargetType): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { targetId, targetType },
      order: { createdAt: 'DESC' },
      relations: ['reviewer'], // To show reviewer name
    });
  }

  async getAverageRating(targetId: string, targetType: ReviewTargetType): Promise<{ average: number; count: number }> {
    const { avg, count } = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.targetId = :targetId', { targetId })
      .andWhere('review.targetType = :targetType', { targetType })
      .getRawOne();

    return { 
      average: parseFloat(avg) || 0, 
      count: parseInt(count, 10) || 0 
    };
  }
}
