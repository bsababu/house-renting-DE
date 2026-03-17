import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

@Injectable()
export class PaymentsService {
    private stripe: Stripe;
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
            apiVersion: '2023-10-16' as any,
        });
    }

    async createCheckoutSession(userId: string, email: string) {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'HousingDE Pro Search',
                            description: 'Unlimited AI applications and advanced scam protection',
                        },
                        unit_amount: 1900, // €19.00
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/profile?success=true`,
            cancel_url: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/pricing?canceled=true`,
            customer_email: email,
            client_reference_id: userId,
        });

        return { url: session.url };
    }

    async handleWebhook(sig: string, payload: Buffer) {
        const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, sig, endpointSecret || '');
        } catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new Error('Webhook Error');
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;
            
            if (userId) {
                this.logger.log(`Payment successful for user ${userId}. Upgrading to PREMIUM.`);
                await this.usersService.updateRole(userId, UserRole.PREMIUM);
            }
        }

        return { received: true };
    }
}
