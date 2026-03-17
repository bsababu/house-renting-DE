import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation, Message } from './chat.entity';
import { ChatGateway } from './chat.gateway';
import { AiModule } from '../ai/ai.module';
import { ListingsModule } from '../listings/listings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
      TypeOrmModule.forFeature([Conversation, Message]),
      JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          const secret = configService.get<string>('JWT_SECRET');
          if (!secret && configService.get<string>('NODE_ENV') === 'production') {
            throw new Error('JWT_SECRET must be set in production');
          }
          return {
            secret: secret || 'dev_secret_key_change_me',
            signOptions: { expiresIn: '60m' },
          };
        },
        inject: [ConfigService],
      }),
      AiModule,
      forwardRef(() => ListingsModule),
      UsersModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
