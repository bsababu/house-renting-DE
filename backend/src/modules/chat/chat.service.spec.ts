import { ChatService } from './chat.service';
import { NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  const conversationRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const messageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const service = new ChatService(conversationRepository as any, messageRepository as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when conversation is not owned by user', async () => {
    conversationRepository.findOne.mockResolvedValue(null);
    await expect(service.assertConversationOwnership('c1', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('saves message when conversation exists', async () => {
    conversationRepository.findOne.mockResolvedValue({ id: 'c1', userId: 'u1' });
    messageRepository.create.mockImplementation((data: any) => data);
    messageRepository.save.mockImplementation(async (data: any) => data);

    const msg = await service.saveMessage('c1', 'u1', 'user', 'hello');
    expect(msg.content).toBe('hello');
    expect(messageRepository.save).toHaveBeenCalled();
  });
});
