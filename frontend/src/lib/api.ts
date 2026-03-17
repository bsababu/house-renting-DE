// Re-export services for backward compatibility
import { authService } from '../services/auth.service';
import { listingsService } from '../services/listings.service';
import { chatService } from '../services/chat.service';
import { documentsService } from '../services/documents.service';
import { alertsService } from '../services/alerts.service';
import { reviewsService } from '../services/reviews.service';
import { apiClient } from '../services/api.client';

export type { SearchParams } from '../services/listings.service';

// Auth
export const login = authService.login;
export const register = authService.register;

// Auth & Legacy API (combining multiple services for backward compatibility)
export const authApi = {
    ...authService,
    // Documents (Vault)
    getVaultSummary: documentsService.getSummary,
    uploadDocument: documentsService.upload,
    deleteDocument: documentsService.delete,
    // Alerts
    getAlerts: alertsService.getAll,
    createAlert: alertsService.create,
    deleteAlert: alertsService.delete,
    // Reviews
    getReviews: reviewsService.get,
    createReview: reviewsService.create,
};

// Listings
export const getListings = listingsService.getAll;
export const getListingStats = listingsService.getStats;
export const getListingById = listingsService.getById;
export const getMatchedListings = listingsService.getMatched;
export const searchListings = listingsService.search;
export const aiSearch = listingsService.aiSearch;
export const getMapListings = listingsService.getMapListings;

// Chat
export const chatApi = chatService;

// Diplomat (Applications) - TODO: Move to diplomat.service.ts
export const api = {
    applyForListing: async (listingId: string) => {
        return apiClient.post(`/diplomat/apply/${listingId}`, {});
    },
};
