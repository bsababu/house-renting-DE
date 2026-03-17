import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { Review, ReviewTargetType } from './review.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':targetType/:targetId')
  async getReviews(
    @Param('targetType') targetType: ReviewTargetType,
    @Param('targetId') targetId: string,
  ) {
    return {
      reviews: await this.reviewsService.findByTarget(targetId, targetType),
      stats: await this.reviewsService.getAverageRating(targetId, targetType),
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Request() req: any, @Body() body: Partial<Review>) {
    return this.reviewsService.create(req.user.userId, body);
  }
}
