
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'house_renting',
    synchronize: false,
  });

  await AppDataSource.initialize();
  console.log("--- DEEP DIVE CHECK ---");
  
  // 1. Check Raw Data Structure
  const oneListing = await AppDataSource.query(`
    SELECT id, "rawData" FROM listings LIMIT 1
  `);
  if (oneListing.length > 0) {
      console.log("Sample RawData:", JSON.stringify(oneListing[0].rawData, null, 2));
  }

  // 2. Check the "Cheap WGs" specifics
  const cheapWgs = await AppDataSource.query(`
    SELECT id, title, "locationName", "priceWarm", "listingType"
    FROM listings 
    WHERE "listingType" = 'wg' AND "priceWarm" <= 650
  `);
  
  console.log(`\nFound ${cheapWgs.length} Cheap WGs:`);
  cheapWgs.forEach(l => {
      console.log(`[${l.listingType}] ${l.title} | Loc: ${l.locationName} | Price: ${l.priceWarm}`);
  });
  
  await AppDataSource.destroy();
}

check().catch(console.error);
