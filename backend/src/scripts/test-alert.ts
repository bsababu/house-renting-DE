import { DataSource } from 'typeorm';
import { Alert } from '../modules/alerts/alert.entity';
import { Listing, ListingType, ListingStatus } from '../modules/listings/listing.entity';
import { User, UserRole } from '../modules/users/user.entity';
import { AlertsService } from '../modules/alerts/alerts.service';
import { EmailService } from '../modules/email/email.service';
import { UsersService } from '../modules/users/users.service';

/**
 * Test script for Email Alerts flow.
 * 
 * Usage:
 *   npx ts-node src/scripts/test-alert.ts
 */

async function testAlerts() {
    console.log('🧪 Testing Email Alerts flow...\n');

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'housing_db',
        entities: [Alert, Listing, User],
        synchronize: false,
    });

    await dataSource.initialize();
    
    // 1. Manually instantiate services (simplified for testing)
    const alertRepo = dataSource.getRepository(Alert);
    const userRepo = dataSource.getRepository(User);
    const emailService = new EmailService({ get: () => null } as any); // Simulated SMTP
    const userService = new UsersService(userRepo);
    const alertsService = new AlertsService(alertRepo, null as any, userService, emailService);

    // 2. Find or create a test user
    let user = await userRepo.findOneBy({ email: 'alert-test@example.com' });
    if (!user) {
        user = userRepo.create({
            email: 'alert-test@example.com',
            passwordHash: 'test',
            role: UserRole.USER,
            firstName: 'Tester',
            lastName: 'Alertson'
        });
        user = await userRepo.save(user);
    }

    // 3. Create an alert for Hamburg
    let alert = await alertRepo.findOneBy({ userId: user.id, name: 'Hamburg Test Alert' });
    if (!alert) {
        alert = alertRepo.create({
            userId: user.id,
            name: 'Hamburg Test Alert',
            filters: { city: 'Hamburg', maxPrice: 1000 },
            enabled: true,
            autoApply: false,
        });
        alert = await alertRepo.save(alert);
    }

    // 4. Create a matching listing
    const listing: Listing = {
        id: 'test-listing-id',
        title: 'Matching Hamburg Flat',
        priceWarm: 850,
        locationName: 'Hamburg, Eimsbüttel',
        size: 50,
        rooms: 2,
        // ... rest of listing props
    } as any;

    console.log(`Checking listing: ${listing.title} for city: Hamburg`);
    
    // 5. Trigger alert check
    await alertsService.checkListing(listing);

    console.log('\n✅ Alert check triggered. Check backend logs for [SIMULATED EMAIL].');
    
    await dataSource.destroy();
}

testAlerts().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
