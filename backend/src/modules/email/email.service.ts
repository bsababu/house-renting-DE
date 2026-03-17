import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP transport configured: ${host}:${port}`);
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  async sendApplicationEmail(
    to: string,
    subject: string,
    body: string,
    fromName?: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    const fromAddress = this.configService.get<string>('SMTP_FROM', 'noreply@housingde.app');
    const from = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;

    if (!this.transporter) {
      this.logger.warn(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
      this.logger.warn(`[SIMULATED EMAIL] Body:\n${body.substring(0, 200)}...`);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });

      this.logger.log(`Email sent: ${info.messageId} → ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return { success: false };
    }
  }

  async sendNewListingAlert(
    to: string,
    userName: string,
    listing: any,
  ): Promise<{ success: boolean; messageId?: string }> {
    const subject = `🏠 New Match: ${listing.title} in ${listing.locationName}`;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const url = `${frontendUrl}/listings/${listing.id}`;
    
    const body = `
      Hello ${userName},

      Great news! A new listing matches your alert criteria:

      Title: ${listing.title}
      Price: €${listing.priceWarm} (Warm)
      Location: ${listing.locationName}
      Size: ${listing.size} m²

      View listing details: ${url}

      Happy hunting!
      The HousingDE Team
    `.trim();

    return this.sendApplicationEmail(to, subject, body, 'HousingDE Alerts');
  }
}
