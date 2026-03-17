import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { ListingStatus } from '../listings/listing.entity';
import { UserRole } from '../users/user.entity';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Inline admin check — reused across all endpoints
  private assertAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  // ── Overview ──────────────────────────────────
  @Get('stats')
  async getStats(@Request() req: any) {
    this.assertAdmin(req);
    return this.adminService.getStats();
  }

  // ── Users ─────────────────────────────────────
  @Get('users')
  async getUsers(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    this.assertAdmin(req);
    return this.adminService.getUsers(+page, +limit);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    this.assertAdmin(req);
    return this.adminService.updateUserRole(id, role);
  }

  // ── Listings ──────────────────────────────────
  @Get('listings')
  async getListings(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('platform') platform?: string,
  ) {
    this.assertAdmin(req);
    return this.adminService.getListings(+page, +limit, status, platform);
  }

  @Patch('listings/:id/status')
  async updateListingStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: ListingStatus,
  ) {
    this.assertAdmin(req);
    return this.adminService.updateListingStatus(id, status);
  }

  @Delete('listings/:id')
  async deleteListing(@Request() req: any, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.adminService.deleteListing(id);
  }
}
