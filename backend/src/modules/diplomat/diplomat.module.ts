import { Module, forwardRef } from '@nestjs/common';
import { DiplomatService } from './diplomat.service';
import { DiplomatController } from './diplomat.controller';
import { AiModule } from '../ai/ai.module';
import { ListingsModule } from '../listings/listings.module';
import { UsersModule } from '../users/users.module';
import { BullModule } from '@nestjs/bullmq';
import { ApplicationProcessor } from './application.processor';
import { EmailModule } from '../email/email.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [
    AiModule,
    forwardRef(() => ListingsModule),
    UsersModule,
    ApplicationsModule,
    EmailModule,
    BullModule.registerQueue({
      name: 'applications',
    }),
  ],
  providers: [DiplomatService, ApplicationProcessor],
  controllers: [DiplomatController],
  exports: [DiplomatService],
})
export class DiplomatModule {}
