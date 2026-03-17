import { Controller, Post, Param, UseGuards, Req, Logger, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DiplomatService } from './diplomat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('diplomat')
export class DiplomatController {
  private readonly logger = new Logger(DiplomatController.name);

  constructor(
    private readonly diplomatService: DiplomatService,
    private readonly usersService: UsersService,
  ) { }

  private assertPremium(req: any) {
    if (!['premium', 'admin'].includes(req.user?.role)) {
      throw new ForbiddenException('Premium access required');
    }
  }

  /**
   * Preview: generates a German Bewerbungsschreiben for review before sending.
   */
  @UseGuards(JwtAuthGuard)
  @Post('preview/:listingId')
  async preview(@Req() req, @Param('listingId') listingId: string) {
    this.assertPremium(req);
    const userId = req.user.userId || req.user.sub;
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const result = await this.diplomatService.previewApplication(
      user,
      listingId,
    );

    return { success: true, ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply/:listingId')
  async apply(@Req() req, @Param('listingId') listingId: string) {
    this.assertPremium(req);
    this.logger.log(`Apply request user object: ${JSON.stringify(req.user)}`);
    const userId = req.user.userId || req.user.sub;
    this.logger.log(`Extracted userId: ${userId} for listing ${listingId}`);
    
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent duplicate applications
    const existingJob = await this.diplomatService.findExistingApplication(userId, listingId);
    if (existingJob) {
      throw new ConflictException('You have already applied to this listing');
    }
    
    const job = await this.diplomatService.queueApplication(user, listingId);
    
    return { 
      success: true, 
      jobId: job.id, 
      message: 'Application queued successfully' 
    };
  }
}
