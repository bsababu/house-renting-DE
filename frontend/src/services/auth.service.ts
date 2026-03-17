/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.client';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  profileData?: any;
}

export const authService = {
  async login(credentials: { email: string; password: string }) {
    return apiClient.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(userData: any) {
    return apiClient.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getProfile() {
    return apiClient.get<UserProfile>('/users/profile');
  },

  async updateProfile(profileData: any) {
    return apiClient.patch<UserProfile>('/users/profile', profileData);
  },

  async getSavedListings(): Promise<string[]> {
    return apiClient.get<string[]>('/auth/saved-listings');
  },

  async saveListing(listingId: string) {
    return apiClient.post<any>(`/auth/saved-listings/${listingId}`, {});
  },

  async unsaveListing(listingId: string) {
    return apiClient.delete<any>(`/auth/saved-listings/${listingId}`);
  },
};
