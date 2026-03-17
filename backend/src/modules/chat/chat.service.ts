import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message } from './chat.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createConversation(userId: string): Promise<Conversation> {
    const conversation = this.conversationRepository.create({ userId });
    return this.conversationRepository.save(conversation);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    // Verify the conversation belongs to the requesting user
    await this.assertConversationOwnership(conversationId, userId);

    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async saveMessage(conversationId: string, userId: string, role: 'user' | 'assistant', content: string): Promise<Message> {
    // Verify the conversation belongs to the requesting user
    await this.assertConversationOwnership(conversationId, userId);

    const message = this.messageRepository.create({
      conversationId,
      role,
      content,
    });
    return this.messageRepository.save(message);
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
      await this.conversationRepository.delete({ id, userId });
  }

  async assertConversationOwnership(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }
}
