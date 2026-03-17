
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ListingsService } from './src/modules/listings/listings.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const listingsService = app.get(ListingsService);
  
  // @ts-ignore - accessing private repository for quick check or using public method if available
  // Actually ListingsService has a repository we can't easily access from here unless public.
  // But we can use search()
  
  const result = await listingsService.search({ listingType: 'wg', limit: 100 });
  console.log(`Found ${result.total} WG listings.`);
  
  await app.close();
}
bootstrap();
