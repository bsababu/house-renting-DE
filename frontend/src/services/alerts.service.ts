/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.client';

export const alertsService = {
    async getAll() {
        return apiClient.get<any>('/alerts');
    },

    async create(data: any) {
        return apiClient.post<any>('/alerts', data);
    },

    async delete(id: string) {
        return apiClient.delete<any>(`/alerts/${id}`);
    }
};
