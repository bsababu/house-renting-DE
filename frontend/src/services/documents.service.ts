/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.client';

export const documentsService = {
    async getSummary() {
        return apiClient.get<any>('/documents/summary');
    },

    async upload(file: File, type: string, notes?: string) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (notes) formData.append('notes', notes);
        
        // Custom fetch for FormData since apiClient defaults to JSON
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/documents/upload`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload document');
        return response.json();
    },

    async delete(id: string) {
        return apiClient.delete<any>(`/documents/${id}`);
    }
};
