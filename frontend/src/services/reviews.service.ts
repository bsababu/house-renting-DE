/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.client';

export const reviewsService = {
    async get(targetType: string, targetId: string) {
        return apiClient.get<any>(`/reviews/${targetType}/${targetId}`);
    },

    async create(data: any) {
        return apiClient.post<any>('/reviews', data);
    }
};
