import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './core/health/health.controller';
import { HealthService } from './core/health/health.service';
import databaseConfig from './core/config/database.config';
import redisConfig from './core/config/redis.config';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { AuthModule } from './modules/auth/auth.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { AiModule } from './modules/ai/ai.module';
import { DiplomatModule } from './modules/diplomat/diplomat.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NeighborhoodsModule } from './modules/neighborhoods/neighborhoods.module';
import { ChatModule } from './modules/chat/chat.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { ScamAnalysisModule } from './modules/scam-analysis/scam-analysis.module';
import { ApplicationsModule } from './modules/applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig],
    }),

    // Task Scheduling (Cron Jobs)
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),

    // Queue System (Redis)
    // Queue System (Redis)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),

    // Application Modules
    UsersModule,
    ListingsModule,
    AuthModule,
    ScraperModule,
    AiModule,
    DiplomatModule,
    DocumentsModule,
    AlertsModule,
    ReviewsModule,
    NeighborhoodsModule,
    ChatModule,
    PaymentsModule,
    AdminModule,
    DiscoveryModule, // Added DiscoveryModule
    ScamAnalysisModule,
    ApplicationsModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
