/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ListingCard from '@/components/listings/ListingCard';
import FilterSidebar from '@/components/listings/FilterSidebar';
import LiveScanButton from '@/components/LiveScanButton';
import { aiSearch, searchListings, SearchParams } from '@/lib/api';

interface Listing {
    id: string;
    title: string;
    priceWarm: number;
    size: number;
    rooms: number;
    locationName: string;
    address: string;
    images: string[];
    status: string;
    trustScore: number;
    listingType: string;
    platform: string;
}

interface SearchResult {
    data: Listing[];
    total: number;
    page: number;
    totalPages: number;
    extractedFilters?: any;
    originalQuery?: string;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<SearchParams>({});
    const [extractedFilters, setExtractedFilters] = useState<any>(null);

    // Load listings on mount — if ?q= is present, do AI search; otherwise load all
    useEffect(() => {
        if (initialQuery) {
            performAiSearch(initialQuery);
        } else {
            loadListings({});
        }
    }, []);

    const loadListings = async (params: SearchParams) => {
        setLoading(true);
        try {
            const result: SearchResult = await searchListings({ ...params, page, limit: 12 });
            setListings(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            console.error('Error loading listings:', err);
        } finally {
            setLoading(false);
        }
    };

    // Core AI search function (reusable for URL params and manual search)
    const performAiSearch = async (searchText: string) => {
        setLoading(true);
        setSearchPerformed(true);
        try {
            const result = await aiSearch(searchText);
            setListings(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
            setExtractedFilters(result.extractedFilters);

            // Auto-populate sidebar filters from AI extraction
            if (result.extractedFilters) {
                setFilters({
                    city: result.extractedFilters.city,
                    minPrice: result.extractedFilters.minPrice,
                    maxPrice: result.extractedFilters.maxPrice,
                    minRooms: result.extractedFilters.minRooms,
                    maxRooms: result.extractedFilters.maxRooms,
                    listingType: result.extractedFilters.listingType,
                });
            }
        } catch (err) {
            console.error('AI search failed, falling back to keyword search:', err);
            // Fallback: use the query as a city/keyword filter via regular search
            try {
                const fallbackResult: SearchResult = await searchListings({ city: searchText, page: 1, limit: 12 });
                setListings(fallbackResult.data);
                setTotal(fallbackResult.total);
                setTotalPages(fallbackResult.totalPages);
            } catch (fallbackErr) {
                console.error('Fallback search also failed:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    };

    // AI-powered natural language search (triggered by user)
    const handleAiSearch = async () => {
        if (!query.trim()) return;
        performAiSearch(query);
    };

    // Structured filter search
    const handleFilterChange = useCallback(async (newFilters: SearchParams) => {
        setFilters(newFilters);
        setPage(1);
        setSearchPerformed(true);
        setLoading(true);
        try {
            const result = await searchListings({ ...newFilters, page: 1, limit: 12 });
            setListings(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            console.error('Filter search failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Pagination
    const handlePageChange = async (newPage: number) => {
        setPage(newPage);
        setLoading(true);
        try {
            const result = await searchListings({ ...filters, page: newPage, limit: 12 });
            setListings(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            console.error('Pagination failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAiSearch();
    };

    return (
        <div className="min-h-screen">
            {/* Hero search bar — teal brand */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 pt-20 pb-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">
                        Find Your Home
                    </h1>
                    <p className="text-teal-100 text-center mb-4">
                        Describe what you&apos;re looking for in plain English — our AI does the rest
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder='e.g. "2 room apartment in Berlin Mitte, under 1200€, with a balcony"'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-6 py-4 rounded-xl bg-white text-slate-800 placeholder-slate-400 text-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
                        />
                        <button
                            onClick={handleAiSearch}
                            disabled={loading}
                            className="px-8 py-4 bg-white text-teal-700 font-bold rounded-xl shadow-xl hover:bg-teal-50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Searching...
                                </span>
                            ) : '🔍 Search'}
                        </button>
                        <div className="ml-2">
                            <LiveScanButton
                                city={filters.city || extractedFilters?.city || 'Berlin'}
                                maxPrice={filters.maxPrice || extractedFilters?.maxPrice}
                                onScanComplete={(count) => {
                                    if (count > 0) {
                                        // Specific refresh logic or just reload current params
                                        handleFilterChange(filters);
                                    }
                                }}
                            />
                        </div>
                    </div>
                    {extractedFilters && (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {Object.entries(extractedFilters).map(([key, value]) => (
                                <span key={key} className="px-3 py-1 bg-white/20 backdrop-blur text-white text-sm rounded-full">
                                    {key}: {String(value)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="hidden md:block w-80 shrink-0">
                        <FilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                        />
                    </div>

                    {/* Results */}
                    <div className="flex-1">
                        {/* Results header */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-slate-600 font-medium">
                                {searchPerformed
                                    ? `${total} result${total !== 1 ? 's' : ''} found`
                                    : `${listings.length} listings available`}
                            </p>
                            <select
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                                onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
                            >
                                <option value="createdAt">Newest First</option>
                                <option value="priceWarm">Price: Low to High</option>
                                <option value="size">Size: Largest First</option>
                                <option value="trustScore">Trust Score</option>
                            </select>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-center py-20">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                    <p className="text-slate-600 font-medium">Searching across all platforms...</p>
                                </div>
                            </div>
                        )}

                        {/* Results grid */}
                        {!loading && listings.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {listings.map((listing) => (
                                        <ListingCard key={listing.id} listing={listing} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10">
                                        <button
                                            onClick={() => handlePageChange(page - 1)}
                                            disabled={page <= 1}
                                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ← Previous
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-all ${page === pageNum
                                                        ? 'bg-teal-700 text-white shadow-lg scale-110'
                                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={page >= totalPages}
                                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Empty state */}
                        {!loading && listings.length === 0 && (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🏠</div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                                    {searchPerformed ? 'No listings match your search' : 'Start your search'}
                                </h3>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    {searchPerformed
                                        ? 'Try broadening your criteria or use different keywords'
                                        : 'Type what you\'re looking for above — like "cozy 2-room flat in Prenzlauer Berg"'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
