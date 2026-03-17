import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AlertsService } from './alerts.service';
import { Alert } from './alert.entity';

@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.alertsService.findAll(req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: Partial<Alert>) {
    return this.alertsService.create(req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.alertsService.delete(req.user.userId, id);
  }
}
