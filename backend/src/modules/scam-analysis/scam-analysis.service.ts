import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listings/listing.entity';
import * as crypto from 'crypto';

interface ScamSignal {
  type: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface TrustReport {
  overallScore: number;
  priceAnalysis: {
    status: 'pass' | 'warn' | 'fail';
    listingPrice: number;
    avgPrice: number;
    detail: string;
  };
  duplicateAnalysis: {
    status: 'pass' | 'warn' | 'fail';
    duplicateCount: number;
    detail: string;
  };
  textAnalysis: {
    status: 'pass' | 'warn' | 'fail';
    patternsFound: string[];
    detail: string;
  };
  contactAnalysis: {
    status: 'pass' | 'warn' | 'fail';
    detail: string;
  };
  signals: ScamSignal[];
}

// Known scam phrases in German and English
const SCAM_PATTERNS = [
  { pattern: /überweisung\s+vor\s+besichtigung/i, label: 'Requests transfer before viewing', severity: 'high' as const },
  { pattern: /transfer\s+before\s+viewing/i, label: 'Requests transfer before viewing', severity: 'high' as const },
  { pattern: /kaution\s+sofort/i, label: 'Demands immediate deposit', severity: 'high' as const },
  { pattern: /deposit\s+(immediately|upfront|in\s+advance)/i, label: 'Demands deposit upfront', severity: 'high' as const },
  { pattern: /western\s*union/i, label: 'Mentions Western Union', severity: 'high' as const },
  { pattern: /moneygram/i, label: 'Mentions MoneyGram', severity: 'high' as const },
  { pattern: /bitcoin|crypto\s*currency|btc/i, label: 'Requests cryptocurrency payment', severity: 'high' as const },
  { pattern: /bin\s+(im|gerade)\s+ausland/i, label: 'Landlord claims to be abroad', severity: 'medium' as const },
  { pattern: /i.?m\s+(abroad|overseas|out\s+of\s+(the\s+)?country)/i, label: 'Landlord claims to be abroad', severity: 'medium' as const },
  { pattern: /schlüssel\s+(per|via)\s+(post|mail)/i, label: 'Offers to send keys by mail', severity: 'high' as const },
  { pattern: /send\s+(the\s+)?keys?\s+(by|via)\s+(mail|post)/i, label: 'Offers to send keys by mail', severity: 'high' as const },
  { pattern: /airbnb\s+payment/i, label: 'Redirects to Airbnb payment', severity: 'medium' as const },
  { pattern: /zahlung\s+über\s+airbnb/i, label: 'Redirects to Airbnb payment', severity: 'medium' as const },
  { pattern: /only\s+(whatsapp|telegram|signal)/i, label: 'Only contactable via messenger app', severity: 'low' as const },
  { pattern: /no\s+viewing\s+(possible|available|necessary)/i, label: 'No viewing offered', severity: 'medium' as const },
  { pattern: /keine\s+besichtigung/i, label: 'No viewing offered', severity: 'medium' as const },
];

// Disposable / suspicious email domains
const SUSPICIOUS_DOMAINS = [
  'yopmail.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'mailnesia.com', 'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'dispostable.com', 'mailinator.com', '10minutemail.com',
];

@Injectable()
export class ScamAnalysisService {
  private readonly logger = new Logger(ScamAnalysisService.name);

  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  /**
   * Run full scam analysis on a listing.
   * Called after a listing is saved/upserted.
   */
  async analyze(listing: Listing): Promise<TrustReport> {
    this.logger.log(`Analyzing listing: ${listing.title} (${listing.id})`);

    const [priceAnalysis, duplicateAnalysis, textAnalysis, contactAnalysis] = await Promise.all([
      this.analyzePriceAnomaly(listing),
      this.detectDuplicates(listing),
      this.analyzeTextPatterns(listing),
      this.analyzeContactInfo(listing),
    ]);

    // Collect all signals
    const signals: ScamSignal[] = [];

    if (priceAnalysis.status === 'fail') {
      signals.push({ type: 'price_anomaly', severity: 'high', explanation: priceAnalysis.detail });
    } else if (priceAnalysis.status === 'warn') {
      signals.push({ type: 'price_anomaly', severity: 'medium', explanation: priceAnalysis.detail });
    }

    if (duplicateAnalysis.status === 'fail') {
      signals.push({ type: 'cross_platform_duplicate', severity: 'high', explanation: duplicateAnalysis.detail });
    }

    for (const pattern of textAnalysis.patternsFound) {
      const matched = SCAM_PATTERNS.find(p => p.label === pattern);
      signals.push({
        type: 'scam_language',
        severity: matched?.severity || 'medium',
        explanation: pattern,
      });
    }

    if (contactAnalysis.status === 'fail') {
      signals.push({ type: 'suspicious_contact', severity: 'medium', explanation: contactAnalysis.detail });
    }

    // Merge with existing AI-generated scam indicators
    if (listing.scamIndicators?.length) {
      for (const indicator of listing.scamIndicators) {
        // Avoid duplicates
        if (!signals.find(s => s.type === indicator.type)) {
          signals.push(indicator as ScamSignal);
        }
      }
    }

    // Calculate weighted overall score
    const overallScore = this.calculateScore(listing.trustScore, priceAnalysis, duplicateAnalysis, textAnalysis, contactAnalysis);

    const report: TrustReport = {
      overallScore,
      priceAnalysis,
      duplicateAnalysis,
      textAnalysis,
      contactAnalysis,
      signals,
    };

    // Update listing in DB
    await this.listingsRepository.update(listing.id, {
      trustScore: overallScore,
      scamIndicators: signals,
    });

    this.logger.log(`Trust score for "${listing.title}": ${overallScore}/100 (${signals.length} signals)`);
    return report;
  }

  /**
   * Generate a trust report for display without re-running analysis.
   */
  async getTrustReport(listingId: string): Promise<TrustReport> {
    const listing = await this.listingsRepository.findOne({ where: { id: listingId } });
    if (!listing) return null;

    // Re-run analysis (lightweight — uses cached DB stats)
    return this.analyze(listing);
  }

  // ──────────────── PRICE ANOMALY ────────────────

  private async analyzePriceAnomaly(listing: Listing): Promise<TrustReport['priceAnalysis']> {
    if (!listing.priceWarm || !listing.locationName) {
      return { status: 'pass', listingPrice: 0, avgPrice: 0, detail: 'Insufficient data for price analysis' };
    }

    const city = listing.locationName.split(',')[0].trim();
    const price = Number(listing.priceWarm);

    // Get city-level price statistics from DB
    const stats = await this.listingsRepository
      .createQueryBuilder('l')
      .select('AVG(l.priceWarm)', 'avg')
      .addSelect('STDDEV(l.priceWarm)', 'stddev')
      .addSelect('COUNT(*)', 'count')
      .where("l.locationName ILIKE :city", { city: `${city}%` })
      .andWhere('l.priceWarm > 0')
      .getRawOne();

    const avg = parseFloat(stats?.avg || '0');
    const stddev = parseFloat(stats?.stddev || '0');
    const count = parseInt(stats?.count || '0');

    if (count < 5 || avg === 0) {
      return { status: 'pass', listingPrice: price, avgPrice: avg, detail: `Not enough listings in ${city} for comparison (${count} found)` };
    }

    // Flag if price is more than 2 standard deviations below average
    const lowerBound = avg - (2 * stddev);
    if (price < lowerBound && price < avg * 0.5) {
      return {
        status: 'fail',
        listingPrice: price,
        avgPrice: Math.round(avg),
        detail: `Price €${price} is suspiciously low — ${city} average is €${Math.round(avg)} (${Math.round((1 - price / avg) * 100)}% below average)`,
      };
    }

    if (price < avg * 0.65) {
      return {
        status: 'warn',
        listingPrice: price,
        avgPrice: Math.round(avg),
        detail: `Price €${price} is below average for ${city} (avg €${Math.round(avg)})`,
      };
    }

    return {
      status: 'pass',
      listingPrice: price,
      avgPrice: Math.round(avg),
      detail: `Price is within normal range for ${city}`,
    };
  }

  // ──────────────── DUPLICATE DETECTION ────────────────

  private async detectDuplicates(listing: Listing): Promise<TrustReport['duplicateAnalysis']> {
    if (!listing.descriptionSummary && !listing.title) {
      return { status: 'pass', duplicateCount: 0, detail: 'No description to compare' };
    }

    // Create a normalized hash of the listing content
    const normalized = this.normalizeText(listing.title + ' ' + (listing.descriptionSummary || ''));
    const hash = crypto.createHash('md5').update(normalized).digest('hex');

    // Find other listings with similar content (same hash approach)
    // We compare by checking for very similar titles + price + size combination
    const possibleDupes = await this.listingsRepository
      .createQueryBuilder('l')
      .where('l.id != :id', { id: listing.id })
      .andWhere('l.title = :title', { title: listing.title })
      .andWhere('l.priceWarm = :price', { price: listing.priceWarm })
      .andWhere('l.originalUrl != :url', { url: listing.originalUrl })
      .getCount();

    if (possibleDupes > 0) {
      return {
        status: 'fail',
        duplicateCount: possibleDupes,
        detail: `Found ${possibleDupes} identical listing(s) on other platforms — possible scam reposting`,
      };
    }

    // Also check for same description on different URLs
    const descDupes = await this.listingsRepository
      .createQueryBuilder('l')
      .where('l.id != :id', { id: listing.id })
      .andWhere('l.descriptionSummary = :desc', { desc: listing.descriptionSummary })
      .andWhere('l.descriptionSummary IS NOT NULL')
      .andWhere("l.descriptionSummary != ''")
      .andWhere('l.originalUrl != :url', { url: listing.originalUrl })
      .getCount();

    if (descDupes > 0) {
      return {
        status: 'warn',
        duplicateCount: descDupes,
        detail: `Same description found on ${descDupes} other listing(s)`,
      };
    }

    return { status: 'pass', duplicateCount: 0, detail: 'No duplicates found' };
  }

  // ──────────────── TEXT PATTERN ANALYSIS ────────────────

  private analyzeTextPatterns(listing: Listing): TrustReport['textAnalysis'] {
    const text = [
      listing.title,
      listing.descriptionSummary,
      listing.rawData?.description,
      listing.rawData?.contact,
    ].filter(Boolean).join(' ');

    const patternsFound: string[] = [];

    for (const { pattern, label } of SCAM_PATTERNS) {
      if (pattern.test(text)) {
        patternsFound.push(label);
      }
    }

    if (patternsFound.length >= 3) {
      return { status: 'fail', patternsFound, detail: `${patternsFound.length} scam language patterns detected` };
    }
    if (patternsFound.length > 0) {
      return { status: 'warn', patternsFound, detail: `${patternsFound.length} suspicious pattern(s) found` };
    }
    return { status: 'pass', patternsFound: [], detail: 'No scam language patterns detected' };
  }

  // ──────────────── CONTACT INFO ANALYSIS ────────────────

  private analyzeContactInfo(listing: Listing): TrustReport['contactAnalysis'] {
    const hasEmail = !!listing.landlordEmail;
    const hasPhone = !!listing.landlordPhone;
    const hasName = !!listing.landlordName;

    // Check for disposable email domains
    if (hasEmail) {
      const domain = listing.landlordEmail.split('@')[1]?.toLowerCase();
      if (domain && SUSPICIOUS_DOMAINS.includes(domain)) {
        return { status: 'fail', detail: `Landlord email uses disposable domain (${domain})` };
      }
    }

    if (!hasEmail && !hasPhone && !hasName) {
      return { status: 'warn', detail: 'No landlord contact information available' };
    }

    if (!hasEmail && !hasPhone) {
      return { status: 'warn', detail: 'Only landlord name provided — no direct contact method' };
    }

    return { status: 'pass', detail: 'Landlord contact information present' };
  }

  // ──────────────── SCORING ────────────────

  private calculateScore(
    aiScore: number,
    price: TrustReport['priceAnalysis'],
    duplicate: TrustReport['duplicateAnalysis'],
    text: TrustReport['textAnalysis'],
    contact: TrustReport['contactAnalysis'],
  ): number {
    // Start with AI's initial score (0-100), then apply penalties
    let score = aiScore || 80;

    // Price penalties
    if (price.status === 'fail') score -= 30;
    else if (price.status === 'warn') score -= 10;

    // Duplicate penalties
    if (duplicate.status === 'fail') score -= 25;
    else if (duplicate.status === 'warn') score -= 10;

    // Text pattern penalties
    if (text.status === 'fail') score -= 35;
    else if (text.status === 'warn') score -= 5 * text.patternsFound.length;

    // Contact penalties
    if (contact.status === 'fail') score -= 20;
    else if (contact.status === 'warn') score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ──────────────── HELPERS ────────────────

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9äöüß\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
