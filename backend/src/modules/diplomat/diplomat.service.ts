import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiService } from '../ai/ai.service';
import { ListingsService } from '../listings/listings.service';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationMethod } from '../applications/application.entity';

@Injectable()
export class DiplomatService {
  private readonly logger = new Logger(DiplomatService.name);

  constructor(
    private aiService: AiService,
    private listingsService: ListingsService,
    private applicationsService: ApplicationsService,
    @InjectQueue('applications') private applicationQueue: Queue,
  ) {}

  async findExistingApplication(userId: string, listingId: string): Promise<boolean> {
    const existing = await this.applicationsService.findExisting(userId, listingId);
    if (existing) return true;

    const jobs = await this.applicationQueue.getJobs(['completed', 'waiting', 'active', 'delayed']);
    return jobs.some(
      (job) => job.data.userId === userId && job.data.listingId === listingId,
    );
  }

  async queueApplication(user: { id: string; firstName?: string; lastName?: string; profileData?: any }, listingId: string) {
    this.logger.log(`Queueing application for user ${user.id} to listing ${listingId}`);
    
    // Update existing application status to SENT if it exists
    const existing = await this.applicationsService.findExisting(user.id, listingId);
    if (existing) {
      await this.applicationsService.updateStatus(existing.id, user.id, ({} as any).SENT || 'sent');
    }

    return this.applicationQueue.add('apply', {
      userId: user.id,
      listingId,
      userData: {
        firstName: user.firstName,
        lastName: user.lastName,
        profileData: user.profileData,
      },
    });
  }

  /**
   * Preview: generates the German application letter without queueing.
   * This lets the user read, edit, and then decide to send.
   */
  async previewApplication(
    user: { id: string; firstName?: string; lastName?: string; profileData?: any },
    listingId: string,
  ): Promise<{ letter: string; listingTitle: string; applicationId: string }> {
    const listing = await this.listingsService.findOne(listingId);
    const letter = await this.generateApplicationMessage(user, listing);
    
    // Persist the application
    const application = await this.applicationsService.create({
      userId: user.id,
      listingId,
      letterContent: letter,
      method: ApplicationMethod.EMAIL, // Default, can be changed if copied
    });

    return { 
      letter, 
      listingTitle: listing?.title || 'Unknown listing',
      applicationId: application.id
    };
  }

  async generateApplicationMessage(
    userData: { firstName?: string; lastName?: string; profileData?: any },
    listingData: any,
  ): Promise<string> {
    const profile = userData.profileData || {};
    
    const payload = `
      APPLICANT PROFILE:
      - Name: ${userData.firstName || ''} ${userData.lastName || ''}
      - Occupation: ${profile.occupation || 'Not specified'}
      - Monthly Income: ${profile.monthlyIncome || 'Not specified'}
      - Schufa Status: ${profile.schufaStatus || 'Not specified'}
      - Desired Move-in Date: ${profile.moveInDate || 'Flexible'}
      - Personal Introduction: ${profile.introText || 'Not provided'}
      - Has WBS (housing certificate): ${profile.hasWBS ? 'Yes' : 'No / Not specified'}
Prefix: '
      LISTING DETAILS:
      - Title: ${listingData?.title || 'Unknown'}
      - Warm Rent: ${listingData?.priceWarm || listingData?.priceCold || 'N/A'} EUR
      - Location: ${listingData?.locationName || listingData?.address || 'N/A'}
      - Size: ${listingData?.size || 'N/A'} m²
      - Rooms: ${listingData?.rooms || 'N/A'}
      - Description: ${listingData?.descriptionSummary || 'N/A'}
      - Features: ${listingData?.features?.join(', ') || 'None listed'}
    `;

    try {
      const prompt = `
        Du bist "Der Diplomat" — ein erfahrener Assistent, der überzeugende 
        Mietbewerbungen auf Deutsch verfasst. Dein Ziel ist es, den Vermieter dazu zu bringen, 
        den Bewerber zu einer Besichtigung einzuladen.

        Schreibe anhand des BEWERBERPROFILS und der WOHNUNGSDETAILS unten eine professionelle, 
        höfliche und überzeugende Bewerbung auf Deutsch.

        STILRICHTLINIEN:
        - Formelle Anrede: "Sehr geehrte Damen und Herren" oder "Sehr geehrte/r Vermieter/in"
        - Erwähne spezifische Details der Wohnung (Lage, Merkmale, Größe) um zu zeigen, 
          dass sich der Bewerber wirklich für DIESE Wohnung interessiert
        - Baue Beruf, Einkommensbereich und Umzugsdatum natürlich in den Text ein
        - Erwähne Schufa-Auskunft positiv, wenn verfügbar ("Eine aktuelle Schufa-Auskunft kann ich gerne vorlegen")
        - Beende mit "Mit freundlichen Grüßen" und dem Namen des Bewerbers
        - Maximal 250 Wörter
        - KEIN Betreff, KEINE Adresszeile — nur den reinen Fließtext der Bewerbung
        - Schreibe natürlich und authentisch, nicht roboterhaft

        DATEN:
        ${payload}

        Gib NUR den fertigen Bewerbungstext zurück, bereit zum Versenden.
      `;

      this.logger.log(`Generating German application for: ${listingData?.title}`);
      const message = await this.aiService.generateText(prompt);
      return message;
    } catch (err) {
      this.logger.error('Failed to generate application message', err.stack);
      return 'Bewerbung konnte nicht generiert werden. Bitte versuchen Sie es erneut.';
    }
  }
}
