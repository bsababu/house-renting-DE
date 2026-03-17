import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { DiplomatService } from './diplomat.service';
import { ListingsService } from '../listings/listings.service';
import { EmailService } from '../email/email.service';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationStatus } from '../applications/application.entity';

@Processor('applications')
export class ApplicationProcessor extends WorkerHost {
  private readonly logger = new Logger(ApplicationProcessor.name);

  constructor(
    private diplomatService: DiplomatService,
    private listingsService: ListingsService,
    private emailService: EmailService,
    private applicationsService: ApplicationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing application job ${job.id} for user ${job.data.userId}...`);
    
    const { userId, listingId, userData } = job.data;
    
    // Fetch listing details
    const listing = await this.listingsService.findOne(listingId);
    if (!listing) {
      this.logger.error(`Listing ${listingId} not found for job ${job.id}`);
      return { status: 'FAILED', reason: 'Listing not found' };
    }

    // Generate AI-powered application message using safe userData from queue
    const message = await this.diplomatService.generateApplicationMessage(userData, listing);
    
    // Update application in DB if exists
    const existingApp = await this.applicationsService.findExisting(userId, listingId);

    // Determine recipient email
    const recipientEmail = listing.landlordEmail;
    const applicantName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Applicant';
    const subject = `Application: ${listing.title} — ${applicantName}`;

    if (recipientEmail) {
      // Send real email via SMTP
      const emailResult = await this.emailService.sendApplicationEmail(
        recipientEmail,
        subject,
        message,
        applicantName,
      );
      
      const newStatus = emailResult.success ? ApplicationStatus.SENT : ApplicationStatus.REJECTED;
      
      if (existingApp) {
        await this.applicationsService.updateStatus(existingApp.id, userId, newStatus);
      }

      this.logger.log(`--------------------------------------------------`);
      this.logger.log(`APPLICATION ${emailResult.success ? 'SENT' : 'FAILED'} via EMAIL`);
      this.logger.log(`To: ${recipientEmail}`);
      this.logger.log(`Listing: ${listing.title} (${listing.originalUrl})`);
      this.logger.log(`Message ID: ${emailResult.messageId || 'N/A'}`);
      this.logger.log(`--------------------------------------------------`);

      return { 
        status: emailResult.success ? 'SENT' : 'FAILED', 
        message, 
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString(),
      };
    } else {
      // No landlord email — log the message (simulated)
      if (existingApp) {
        await this.applicationsService.updateStatus(existingApp.id, userId, ApplicationStatus.GENERATED);
      }

      this.logger.log(`--------------------------------------------------`);
      this.logger.log(`APPLICATION GENERATED (No landlord email available)`);
      this.logger.log(`Listing: ${listing.title} (${listing.originalUrl})`);
      this.logger.log(`Message Preview: ${message.substring(0, 150)}...`);
      this.logger.log(`--------------------------------------------------`);

      return { 
        status: 'GENERATED', 
        message, 
        note: 'No landlord email available — message saved for manual sending',
        sentAt: new Date().toISOString(),
      };
    }
  }
}
