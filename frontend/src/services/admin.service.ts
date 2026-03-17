/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.client';

export const adminService = {
  // Overview
  async getStats() {
    return apiClient.get<any>('/admin/stats');
  },

  // Users
  async getUsers(page = 1, limit = 20) {
    return apiClient.get<any>(`/admin/users?page=${page}&limit=${limit}`);
  },

  async updateUserRole(userId: string, role: string) {
    return apiClient.patch<any>(`/admin/users/${userId}/role`, { role });
  },

  // Listings
  async getListings(page = 1, limit = 20, status?: string, platform?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    if (platform) params.set('platform', platform);
    return apiClient.get<any>(`/admin/listings?${params.toString()}`);
  },

  async updateListingStatus(listingId: string, status: string) {
    return apiClient.patch<any>(`/admin/listings/${listingId}/status`, { status });
  },

  async deleteListing(listingId: string) {
    return apiClient.delete<any>(`/admin/listings/${listingId}`);
  },

  // Scraper (uses existing endpoint)
  async triggerScan() {
    return apiClient.get<any>('/scraper/scan');
  },
};
