/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { SearchParams } from '@/lib/api';

interface FilterSidebarProps {
    filters: SearchParams;
    onFilterChange: (filters: SearchParams) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
    const [localFilters, setLocalFilters] = useState<SearchParams>(filters);

    // Sync when parent filters change (e.g., from AI extraction)
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const updateFilter = (key: keyof SearchParams, value: any) => {
        const updated = { ...localFilters, [key]: value || undefined };
        setLocalFilters(updated);
    };

    const applyFilters = () => {
        onFilterChange(localFilters);
    };

    const clearFilters = () => {
        const cleared: SearchParams = {};
        setLocalFilters(cleared);
        onFilterChange(cleared);
    };

    return (
        <div className="glass-card rounded-2xl p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Filters</h3>
                <button
                    onClick={clearFilters}
                    className="text-sm text-teal-700 hover:text-teal-800 font-semibold transition-colors"
                >
                    Clear all
                </button>
            </div>

            {/* City */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                <input
                    type="text"
                    value={localFilters.city || ''}
                    onChange={(e) => updateFilter('city', e.target.value)}
                    placeholder="e.g. Berlin, Munich"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                />
            </div>

            {/* District */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">District</label>
                <input
                    type="text"
                    value={localFilters.district || ''}
                    onChange={(e) => updateFilter('district', e.target.value)}
                    placeholder="e.g. Mitte, Kreuzberg"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
                />
            </div>

            {/* Price Range */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price Range (€)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={localFilters.minPrice || ''}
                        onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Min"
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                    <input
                        type="number"
                        value={localFilters.maxPrice || ''}
                        onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max"
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                </div>
            </div>

            {/* Rooms */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rooms</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={localFilters.minRooms || ''}
                        onChange={(e) => updateFilter('minRooms', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Min"
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                    <input
                        type="number"
                        value={localFilters.maxRooms || ''}
                        onChange={(e) => updateFilter('maxRooms', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max"
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                </div>
            </div>

            {/* Property Type */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
                <select
                    value={localFilters.listingType || ''}
                    onChange={(e) => updateFilter('listingType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all bg-white"
                >
                    <option value="">All Types</option>
                    <option value="private">Private Apartment</option>
                    <option value="wg">WG (Shared)</option>
                    <option value="studio">Studio</option>
                    <option value="house">House</option>
                </select>
            </div>

            {/* Size Range */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Size (m²)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={localFilters.minSize || ''}
                        onChange={(e) => updateFilter('minSize', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Min"
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                    <input
                        type="number"
                        value={localFilters.maxSize || ''}
                        onChange={(e) => updateFilter('maxSize', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max"
                        className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                </div>
            </div>

            {/* Apply button */}
            <button
                onClick={applyFilters}
                className="w-full btn-primary !py-3 uppercase tracking-widest text-sm font-black"
            >
                Apply Filters
            </button>
        </div>
    );
}
