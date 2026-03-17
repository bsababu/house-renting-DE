import { Controller, Post, Body, UseGuards, Req, Headers, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('create-checkout-session')
    async createCheckout(@Req() req) {
        return this.paymentsService.createCheckoutSession(req.user.userId, req.user.email);
    }

    @Post('webhook')
    async webhook(
        @Headers('stripe-signature') sig: string,
        @Req() req: any
    ) {
        if (!sig) throw new BadRequestException('Missing signature');
        // Raw body is required for Stripe signature verification
        return this.paymentsService.handleWebhook(sig, req.rawBody);
    }
}
