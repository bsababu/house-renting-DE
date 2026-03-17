'use client';

import React, { useState, useEffect } from 'react';
import { getListings } from '@/lib/api';
import HeroSection from '@/components/home/HeroSection';
import LatestListings from '@/components/home/LatestListings';
import TrustSignals from '@/components/home/TrustSignals';

// Interface duped for now - should move to types/listing.ts in phase 3 or next step
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
  createdAt?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestTime, setLatestTime] = useState('');

  useEffect(() => {
    async function fetchListings() {
      try {
        const result = await getListings();
        const items = (result.data || result).slice(0, 6);
        setListings(items);
        if (items.length > 0 && items[0].createdAt) {
          setLatestTime(timeAgo(items[0].createdAt));
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
      <HeroSection />
      <LatestListings listings={listings} loading={loading} latestTime={latestTime} />
      <TrustSignals />
    </div>
  );
}
