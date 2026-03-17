import { Controller, Post, UseGuards, Request, Body, Get, Delete, Param, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('saved-listings')
  async getSavedListings(@Request() req) {
    return this.usersService.getSavedListings(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('saved-listings/:listingId')
  async saveListing(@Request() req, @Param('listingId') listingId: string) {
    return this.usersService.saveListing(req.user.userId, listingId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('saved-listings/:listingId')
  async unsaveListing(@Request() req, @Param('listingId') listingId: string) {
    return this.usersService.unsaveListing(req.user.userId, listingId);
  }
}
