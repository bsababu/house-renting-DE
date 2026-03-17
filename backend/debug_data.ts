
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ListingsService } from './src/modules/listings/listings.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const listingsService = app.get(ListingsService);
  
  console.log("--- DEBUGGING DATA QUALITY ---");
  
  // Cast to any to access internal repository if needed, or just use public search
  const service = listingsService as any;
  
  const sample = await service.search({ limit: 10 });
  console.log(`Total listings found in broad search: ${sample.total}`);
  
  if (sample.listings.length > 0) {
      console.log("\nSample Listing Data:");
      sample.listings.forEach((l: any) => {
          console.log(`ID: ${l.id}`);
          console.log(`Title: ${l.title}`);
          console.log(`Type: ${l.listingType}`);
          console.log(`Price Warm: ${l.priceWarm} (Cold: ${l.priceCold})`);
          console.log(`Available From: ${l.availableFrom} (Raw: ${l.rawData?.availableFrom || 'N/A'})`);
          console.log(`Original URL: ${l.originalUrl}`);
          console.log("--------------------------------");
      });
  } else {
      console.log("No listings found in DB.");
  }
  
  const wgSearch = await service.search({ listingType: 'wg', maxPrice: 650 });
  console.log(`\nWG Search (max 650) found: ${wgSearch.total}`);

  await app.close();
}
bootstrap();
