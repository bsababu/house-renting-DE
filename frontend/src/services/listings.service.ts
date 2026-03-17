/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.client';

export interface SearchParams {
    city?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    minRooms?: number;
    maxRooms?: number;
    minSize?: number;
    maxSize?: number;
    listingType?: string;
    features?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
}

export const listingsService = {
    async getAll() {
        return apiClient.get<any>('/listings');
    },

    async getStats() {
        return apiClient.get<any>('/listings/stats');
    },

    async getById(id: string) {
        return apiClient.get<any>(`/listings/${id}`);
    },

    async getMatched(prefs: Record<string, any> = {}, page = 1) {
        const params = new URLSearchParams();
        if (prefs.maxBudget) params.set('maxBudget', String(prefs.maxBudget));
        if (prefs.minSize) params.set('minSize', String(prefs.minSize));
        if (prefs.minRooms) params.set('minRooms', String(prefs.minRooms));
        if (prefs.preferredCity) params.set('preferredCity', prefs.preferredCity);
        if (prefs.preferredDistricts) params.set('preferredDistricts', prefs.preferredDistricts);
        if (prefs.balcony) params.set('balcony', 'true');
        if (prefs.parking) params.set('parking', 'true');
        params.set('page', String(page));
        
        return apiClient.get<any>(`/listings/matched?${params.toString()}`);
    },

    async search(params: SearchParams) {
        const queryString = Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&');
            
        return apiClient.get<any>(`/listings/search?${queryString}`);
    },

    async aiSearch(query: string) {
        return apiClient.post<any>('/listings/ai-search', { query });
    },

    async getMapListings(bounds: { swLat: number; swLng: number; neLat: number; neLng: number }) {
        const queryString = Object.entries(bounds)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');
        return apiClient.get<any>(`/listings/map?${queryString}`);
    }
};
