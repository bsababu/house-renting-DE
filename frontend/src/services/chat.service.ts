/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.client';

export const chatService = {
    async createConversation() {
        return apiClient.post<any>('/chat/conversations', {});
    },

    async getConversations() {
        return apiClient.get<any>('/chat/conversations');
    },

    async getMessages(conversationId: string) {
        return apiClient.get<any>(`/chat/conversations/${conversationId}/messages`);
    },

    async deleteConversation(id: string) {
        return apiClient.delete<any>(`/chat/conversations/${id}`);
    }
};
