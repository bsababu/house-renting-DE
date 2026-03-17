import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

import { ListingsService } from '../listings/listings.service';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL,'http://localhost:3000'
    ].filter(Boolean),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly aiService: AiService,
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      
      // Join a room specific to the user for personalized updates if needed
      client.join(`user_${payload.sub}`);
      console.log(`Client connected: ${client.id}, User: ${payload.sub}`);
    } catch (e) {
      console.error('Connection unauthorized', e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.user.sub;
    try {
      await this.chatService.assertConversationOwnership(conversationId, userId);
      client.join(conversationId);
      console.log(`Client ${client.id} joined conversation ${conversationId}`);
      return { event: 'joined', data: conversationId };
    } catch (err) {
      console.error(`Unauthorized join attempt by user ${userId} for conversation ${conversationId}`);
      return { event: 'error', data: 'Conversation not found' };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    const userId = client.data.user.sub;
    
    // Save user message
    const userMessage = await this.chatService.saveMessage(payload.conversationId, userId, 'user', payload.content);
    this.server.to(payload.conversationId).emit('newMessage', userMessage);

    // Context Retrieval
    const context = await this.listingsService.getContextForChat(payload.content);
    
    // Get Conversation History (last 10 messages for context window)
    const messages = await this.chatService.getMessages(payload.conversationId, userId);
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    
    try {
      // Fetch full user profile for AI context
      const user = await this.usersService.findOneById(userId);

      // Call AI with real conversation history
      const aiResponse = await this.aiService.chatWithContext(payload.content, history, context, user);

      // Save & Broadcast AI Message
      const aiMessage = await this.chatService.saveMessage(payload.conversationId, userId, 'assistant', aiResponse);
      this.server.to(payload.conversationId).emit('newMessage', aiMessage);
    } catch (err) {
      console.error('Error handling chat message', err);
      const errorMessage = await this.chatService.saveMessage(
        payload.conversationId,
        userId,
        'assistant',
        "I'm sorry, I'm having trouble processing your request right now. Please try again later."
      );
      this.server.to(payload.conversationId).emit('newMessage', errorMessage);
    }
  }

  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }
}
