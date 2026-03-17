import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from './application.entity';

@Controller('applications')
@UseGuards(AuthGuard('jwt'))
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.applicationsService.findAllByUser(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.applicationsService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.applicationsService.findOne(id, req.user.userId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ApplicationStatus,
    @Body('notes') notes: string,
    @Request() req,
  ) {
    return this.applicationsService.updateStatus(id, req.user.userId, status, notes);
  }
}
