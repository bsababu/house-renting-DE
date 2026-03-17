import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { User } from '../users/user.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private getModelName(): string {
    return this.configService.get<string>('GEMINI_MODEL');
  }

  async parseListing(rawText: string) {
    if (!this.genAI) {
      this.logger.warn('Google AI API Key missing, returning MOCK parse for flow testing');
      return {
        title: "Mock Apartment: " + (rawText.substring(0, 30) || "Unknown"),
        price: 800 + Math.floor(Math.random() * 500),
        extraCosts: 150,
        warmRent: 1000,
        size: 45,
        rooms: 2,
        location: "Berlin",
        address: "Teststr. 123",
        availableFrom: "Immediately",
        features: ["Balcony", "Kitchen"],
        descriptionSummary: "This is a mock listing for testing because the AI key is missing.",
        isScamLikely: false,
        scamReason: "",
        trustScore: 85,
        scamIndicators: [],
      };
    }

    try {
      const modelName = this.getModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are an expert real estate data extractor and scam detector for the German housing market.
        Parse the following raw text/HTML from a property listing and return a valid JSON object.
        
        REQUIRED FIELDS:
        - title: string
        - price: number (cold rent in EUR)
        - extraCosts: number (Nebenkosten in EUR)
        - warmRent: number (warm rent = price + extraCosts)
        - size: number (in m²)
        - rooms: number
        - location: string (city name)
        - address: string (full address if available)
        - availableFrom: string
        - features: string[] (e.g. ["Balcony", "Elevator", "Garden"])
        - descriptionSummary: string (2-3 sentence summary)
        - isScamLikely: boolean
        - scamReason: string (brief reason if scam)
        - trustScore: number (0-100, where 100 = completely trustworthy)
        - scamIndicators: array of objects, each with:
          - type: string (one of: "price_anomaly", "fake_images", "missing_address", "upfront_payment", "suspicious_contact", "too_good", "vague_description", "foreign_payment", "pressure_tactics", "no_viewing")
          - severity: string ("low", "medium", "high")
          - explanation: string (1 sentence why this is suspicious)

        OPTIONAL FIELDS (return null if not available):
        - landlordName: string
        - landlordEmail: string
        - landlordPhone: string
        - landlordWebsite: string
        - listingType: string (one of: "private", "wg", "studio", "house")
        - anmeldungPossible: boolean

        TRUST SCORE GUIDELINES:
        - 90-100: Legitimate listing with complete details, realistic pricing, verifiable landlord
        - 70-89: Likely legitimate but missing some details or slightly unusual
        - 50-69: Suspicious — multiple yellow flags (vague description, no address, unusual pricing)
        - 30-49: Likely scam — several red flags present
        - 0-29: Almost certainly a scam — demands upfront payment, fake photos, unrealistic price

        If the listing appears completely normal, return an empty scamIndicators array and trustScore 85-95.

        RAW TEXT:
        ${rawText}

        Return ONLY the JSON object.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      // Fix: Ensure images is an array if AI hallucinates strictly
      if (!parsed.images) parsed.images = [];
      return parsed;
    } catch (err) {
      this.logger.error('Failed to parse listing with AI', err.stack);
      throw new Error(`AI listing parse failed: ${err.message}`);
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.genAI) {
      this.logger.warn('Google AI API Key missing, returning MOCK message for flow testing');
      return "Dear Sir or Madam,\n\nI am very interested in your listing. I would love to schedule a viewing at your earliest convenience.\n\nBest regards,\nTest User";
    }
    try {
      const modelName = this.getModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      this.logger.error('AI text generation failed', err.stack);
      throw new Error(`AI text generation failed: ${err.message}`);
    }
  }

  /**
   * Extract structured search filters from a natural language query.
   * User says: "I need a 2-room apartment in Berlin under 1200 euros with a balcony"
   * AI returns: { city: "Berlin", maxPrice: 1200, minRooms: 2, maxRooms: 2, features: "balcony", listingType: "private" }
   */
  async extractSearchIntent(userQuery: string): Promise<any> {
    if (!this.genAI) {
      this.logger.warn('Google AI API Key missing, returning MOCK search intent');
      return {
        city: 'Berlin',
        maxPrice: 1200,
        minRooms: 2,
        listingType: 'private',
      };
    }

    try {
      const modelName = this.getModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are a search intent extraction engine for a German housing rental platform.
        Today's date is: ${new Date().toISOString().split('T')[0]}.
        Parse the user's natural language query and extract structured search filters.

        RETURN a valid JSON object with ONLY these fields (omit any that aren't mentioned):
        - city: string (German city name, e.g. "Berlin", "Munich", "Hamburg")
        - district: string (specific neighborhood, e.g. "Mitte", "Schwabing", "Altona")
        - minPrice: number (minimum rent in EUR)
        - maxPrice: number (maximum rent in EUR)
        - minRooms: number
        - maxRooms: number
        - minSize: number (in m²)
        - maxSize: number (in m²)
        - listingType: string (one of: "private", "wg", "studio")
        - features: string (comma-separated features like "balcony,elevator,parking")
        - anmeldungRequired: boolean (if user mentions needing Anmeldung)
        - moveInDate: string (ISO 8601 date YYYY-MM-DD, calculated from user's "next month" etc.)

        RULES:
        - If user says "next month", calculate the 1st of the next month relative to current date.
        - If user mentions "WG" or "shared apartment" → listingType = "wg"
        - If user mentions "own apartment", "private", "house", "flat" → listingType = "private"
        - If user mentions "studio" or "1-Zimmer" → listingType = "studio"
        - Convert German city names to proper German spelling (München → Munich is OK, but keep German names)
        - "warm" rent = total rent, "cold/kalt" rent = base rent without utilities
        - Return ONLY the JSON object, no additional text.

        USER QUERY: "${userQuery}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      this.logger.log(`Extracted search intent: ${JSON.stringify(parsed)}`);
      return parsed;
    } catch (err) {
      this.logger.error('Failed to extract search intent', err.stack);
      throw new Error(`AI search intent extraction failed: ${err.message}`);
    }
  }

  async synthesizeSearchUrls(userQuery: string): Promise<Record<string, string>> {
    if (!this.genAI) {
      this.logger.warn('Google AI API Key missing, returning MOCK URLs');
      return {
        immobilienscout24: `https://www.immobilienscout24.de/Suche/de/berlin/berlin/wohnung-mieten`,
        kleinanzeigen: `https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/c203`,
      };
    }

    try {
      const modelName = this.getModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are a German Real Estate Navigation Expert. 
        Current Date: ${new Date().toISOString().split('T')[0]}.
        User Intent: "${userQuery}"

        Generate the optimal search URLs for the following platforms based on the user's location and price intent.
        
        REQUIRED PLATFORMS:
        - immobilienscout24
        - kleinanzeigen
        - wg-gesucht

        URL FORMAT RULES:
        1. ImmoScout24: https://www.immobilienscout24.de/Suche/de/{{city}}/{{district_slug}}/wohnung-mieten?price=-{{maxPrice}}
           - If district is unknown, use: https://www.immobilienscout24.de/Suche/de/{{city}}/wohnung-mieten
           - District slugs must be precise (e.g., "prenzlauer-berg", "friedrichshain-kreuzberg").
        2. Kleinanzeigen: https://www.kleinanzeigen.de/s-wohnung-mieten/{{city}}/{{district}}/k0c203
        3. WG-Gesucht: Just provide a search string for now if URL is complex, otherwise: https://www.wg-gesucht.de/angebot-lesen.html

        RETURN a valid JSON object where keys are platform names and values are the synthesized URLs.
        Example: { "immobilienscout24": "...", "kleinanzeigen": "..." }
        Return ONLY the JSON.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));

      this.logger.log(`Synthesized discovery URLs for query "${userQuery}": ${JSON.stringify(parsed)}`);
      return parsed;
    } catch (err) {
      this.logger.error('Failed to synthesize search URLs', err.stack);
      return {};
    }
  }

  async chatWithContext(
    userMessage: string,
    history: { role: string; content: string }[],
    context?: string,
    user?: User
  ): Promise<string> {
    try {
      if (!this.genAI) {
        this.logger.error('GoogleGenerativeAI not initialized. Checking API key...');
        const key = this.configService.get<string>('GOOGLE_AI_API_KEY');
        this.logger.error(`API Key present: ${!!key}`);
        return "I'm currently in offline mode (API Key missing), but I can see you said: " + userMessage;
      }

      const modelName = this.getModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });

      let userContext = "";
      if (user) {
          userContext = `
          User Profile:
          - Name: ${user.firstName || ''} ${user.lastName || ''}
          - Occupation: ${user.profileData?.occupation || 'N/A'}
          - Income: ${user.profileData?.monthlyIncome || 'N/A'}
          - Schufa: ${user.profileData?.schufaStatus || 'N/A'}
          - Move-in Date: ${user.profileData?.moveInDate || 'N/A'}
          - Intro: ${user.profileData?.introText || 'N/A'}
          `;
      }

      // Construct the prompt with context
      const systemPrompt = `
        You are HousingDE's expert AI Housing Advisor — the most knowledgeable assistant 
        for finding rental apartments in Germany. You combine deep expertise in German rental law, 
        relocation logistics, and local neighborhood knowledge.

        ${userContext}

        Context from relevant listings:
        ${context || 'No specific listing context available.'}
        
        YOUR EXPERTISE AREAS:

        📜 GERMAN RENTAL LAW (Mietrecht):
        - Notice periods: 3 months for tenants, up to 9 months for landlords depending on tenancy length
        - Security deposit (Kaution): max 3x cold rent, must be held in a separate savings account
        - Rent increases: max 20% over 3 years (15% in tight markets), must follow local Mietspiegel
        - Tenant rights: landlord cannot enter without 24h notice, repairs are landlord's responsibility
        - Lease termination: Eigenbedarf (landlord personal use) is the most common legal reason

        💳 SCHUFA (Credit Score):
        - What it is: German credit scoring system, score ranges from 0-100 (97.5+ is excellent)
        - How to get it: Request free copy once per year at meineschufa.de ("Datenkopie nach Art. 15 DS-GVO")
        - Paid version: BonitätsAuskunft costs ~€29.95 and is landlord-friendly
        - Why it matters: almost every landlord requires it — no Schufa = almost impossible to rent

        📍 ANMELDUNG (Registration):
        - Required within 14 days of moving in
        - Done at local Bürgeramt (citizen's office) — book appointment online
        - Need: Wohnungsgeberbestätigung (landlord confirmation form), passport, Meldeschein form
        - Without Anmeldung: can't open bank account, get insurance, or register for taxes

        🏠 WBS (Wohnberechtigungsschein):
        - Social housing certificate for income-eligible tenants
        - Income limits vary by city and household size
        - Berlin example: single person ~€12,000-16,800/year net, couple ~€18,000-25,200/year
        - Applied for at local Wohnungsamt, valid for 1-2 years

        💰 MIETPREISBREMSE (Rent Brake):
        - Active in Berlin, Munich, Hamburg, Frankfurt, and other designated areas
        - New rent may not exceed 10% above the local Mietspiegel (rent index)
        - Exceptions: new construction (after Oct 1, 2014), comprehensive renovation
        - Tenants can demand excess rent back retroactively

        📊 TYPICAL MONTHLY COSTS IN GERMANY:
        - GEZ (broadcasting fee): €18.36/month per household
        - Internet: €25-40/month
        - Electricity: €35-50/month for 1-person, €60-80 for 2-person
        - Liability insurance (Haftpflichtversicherung): €5-10/month — highly recommended
        - Nebenkosten (utilities): typically €2-3 per m² on top of cold rent

        INSTRUCTIONS:
        - ALWAYS respond in the same language the user writes in (German → German, English → English, etc.)
        - Be warm, encouraging, and practical — finding a home in Germany is stressful
        - For listing-specific questions, use the context above
        - If the user asks to DRAFT an application, write a formal German Bewerbungsschreiben using their profile data
        - Cite specific laws, amounts, and processes — users trust precision
        - If unsure about a legal edge case, advise consulting a Mieterverein (tenant association)
        - Format responses in Markdown for readability
      `;

      // Convert history to Gemini format
      const chat = model.startChat({
          history: [
              {
                  role: 'user',
                  parts: [{ text: systemPrompt }],
              },
              {
                  role: 'model',
                  parts: [{ text: "Understood. I am ready to help as an expert Housing Advisor." }],
              },
              ...history.map(msg => ({
                  role: msg.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: msg.content }]
              }))
          ]
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('AI chat failed', error);
      if (error.response) {
          this.logger.error('Gemini Error Response:', JSON.stringify(error.response));
      }
      return "I'm sorry, I couldn't generate a response at this moment. Please try again.";
    }
  }

  async analyzeDiscoveryBatch(platform: string, listings: any[]): Promise<any[]> {
    if (!this.genAI) {
      this.logger.warn('Google AI API Key missing, skipping batch analysis');
      return listings.map(l => ({ ...l, isScam: false, trustScore: 70 }));
    }

    try {
      const modelName = this.getModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are a Security Auditor for the German Rental Market.
        Analyze the following listings found on "${platform}":
        ${JSON.stringify(listings.map(l => ({ title: l.title, url: l.url })), null, 2)}

        TASK:
        Identify scams by looking for:
        - Prices too good to be true.
        - Suspicious titles or descriptions.
        - Known scam patterns in German rentals.

        RETURN a JSON array of objects, one for each input listing.
        Each object MUST have:
        - url: string (the original URL)
        - isScam: boolean
        - trustScore: number (0-100)
        - redFlags: string[]
        - extractedData: { price: number, rooms: number, size: number }
        
        Return ONLY the JSON array.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const jsonStr = text.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);

      return parsed.map((item, index) => ({
        ...listings[index],
        ...item
      }));
    } catch (err) {
      this.logger.error('Failed to analyze discovery batch', err.stack);
      return listings.map(l => ({ ...l, isScam: false, trustScore: 50 }));
    }
  }
}
