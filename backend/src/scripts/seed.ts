import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/user.entity';
import { Listing, ListingStatus, ListingType } from '../modules/listings/listing.entity';

/**
 * Seed script — populates the database with test users and realistic German listings.
 *
 * Usage:
 *   DB_SYNC=true npx ts-node src/seed.ts
 *
 * This will:
 *   1. Create a dummy tenant  (tenant@test.com  / test1234)
 *   2. Create a dummy landlord (landlord@test.com / test1234)
 *   3. Insert 15 realistic listings across Hamburg and Berlin
 */

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=800&auto=format&fit=crop`;

const LISTINGS_DATA: Partial<Listing>[] = [
  // ── Hamburg ───────────────────────────────────────────────
  {
    title: 'Helle 2-Zimmer-Wohnung in Eimsbüttel',
    priceWarm: 850,
    priceCold: 680,
    deposit: 1360,
    size: 52,
    rooms: 2,
    address: 'Osterstraße 42, 20259 Hamburg',
    locationName: 'Eimsbüttel, Hamburg',
    descriptionSummary: 'Schöne, helle 2-Zimmer-Wohnung im Herzen von Eimsbüttel. Altbau mit hohen Decken, Dielenboden und Balkon zum Innenhof. Gute ÖPNV-Anbindung.',
    originalUrl: 'https://seed.example.com/hamburg-eimsbuettel-1',
    platform: 'WG-Gesucht',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.ACTIVE,
    trustScore: 92,
    features: ['Balkon', 'Altbau', 'Dielenboden', 'Einbauküche'],
    images: [UNSPLASH('1502672260266-1c1ef2d93688')],
    landlordName: 'Stefan Müller',
    landlordEmail: 'landlord@test.com',
    latitude: 53.5728,
    longitude: 9.9527,
    anmeldungPossible: true,
  },
  {
    title: 'Gemütliche 3-Zimmer-Altbau in Ottensen',
    priceWarm: 1250,
    priceCold: 980,
    deposit: 1960,
    size: 78,
    rooms: 3,
    address: 'Bahrenfelder Straße 88, 22765 Hamburg',
    locationName: 'Ottensen, Hamburg',
    descriptionSummary: 'Großzügige Altbauwohnung in der beliebten Bahrenfelder Straße. 3 Zimmer, Wohnküche, Stuck an den Decken.',
    originalUrl: 'https://seed.example.com/hamburg-ottensen-2',
    platform: 'ImmoScout24',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.VERIFIED,
    trustScore: 95,
    features: ['Stuck', 'Wohnküche', 'Keller', 'Dachboden'],
    images: [UNSPLASH('1560448204-e02f11c3d0e2')],
    landlordName: 'Maria Schneider',
    landlordEmail: 'landlord@test.com',
    latitude: 53.5514,
    longitude: 9.9212,
    anmeldungPossible: true,
  },
  {
    title: 'Stilvolle 1-Zimmer-Wohnung Schanze',
    priceWarm: 690,
    priceCold: 540,
    deposit: 1080,
    size: 32,
    rooms: 1,
    address: 'Schulterblatt 15, 20357 Hamburg',
    locationName: 'Sternschanze, Hamburg',
    descriptionSummary: 'Kleine aber feine Wohnung im Schanzenviertel. Perfekt für Studenten oder Berufseinsteiger. U-Bahn direkt vor der Tür.',
    originalUrl: 'https://seed.example.com/hamburg-schanze-3',
    platform: 'Kleinanzeigen',
    listingType: ListingType.STUDIO,
    status: ListingStatus.ACTIVE,
    trustScore: 78,
    features: ['Möbliert', 'U-Bahn-Nähe', 'Waschmaschine'],
    images: [UNSPLASH('1522708323590-d24dbb6b0267')],
    landlordName: 'Petra Hoffmann',
    landlordEmail: 'landlord@test.com',
    latitude: 53.5623,
    longitude: 9.9636,
    anmeldungPossible: true,
  },
  {
    title: 'Modernes Apartment Hafencity',
    priceWarm: 1480,
    priceCold: 1200,
    deposit: 2400,
    size: 55,
    rooms: 2,
    address: 'Am Sandtorkai 27, 20457 Hamburg',
    locationName: 'HafenCity, Hamburg',
    descriptionSummary: 'Neubau-Apartment in der HafenCity mit Elbblick. Hochwertige Ausstattung, Fußbodenheizung, Tiefgarage.',
    originalUrl: 'https://seed.example.com/hamburg-hafencity-4',
    platform: 'Immowelt',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.VERIFIED,
    trustScore: 97,
    features: ['Neubau', 'Elbblick', 'Tiefgarage', 'Fußbodenheizung', 'Aufzug'],
    images: [UNSPLASH('1600596542815-ffad4c1539a9')],
    landlordName: 'Klaus Richter',
    landlordEmail: 'landlord@test.com',
    latitude: 53.5413,
    longitude: 9.9961,
    anmeldungPossible: true,
  },
  {
    title: 'WG-Zimmer in Winterhude',
    priceWarm: 480,
    priceCold: 380,
    deposit: 760,
    size: 18,
    rooms: 1,
    address: 'Mühlenkamp 22, 22303 Hamburg',
    locationName: 'Winterhude, Hamburg',
    descriptionSummary: 'Zimmer in 3er-WG. Gemeinsame Küche und Bad. Ruhige Lage am Goldbekkanal, trotzdem zentral.',
    originalUrl: 'https://seed.example.com/hamburg-winterhude-5',
    platform: 'WG-Gesucht',
    listingType: ListingType.WG,
    status: ListingStatus.ACTIVE,
    trustScore: 85,
    features: ['WG', 'Zentral', 'Waschmaschine'],
    images: [UNSPLASH('1600585154340-be6161a56a0c')],
    landlordName: 'Lena Braun',
    landlordEmail: 'landlord@test.com',
    latitude: 53.5856,
    longitude: 10.0022,
    anmeldungPossible: true,
  },
  // ── Berlin ────────────────────────────────────────────────
  {
    title: 'Charming 2-Zimmer in Prenzlauer Berg',
    priceWarm: 920,
    priceCold: 720,
    deposit: 1440,
    size: 58,
    rooms: 2,
    address: 'Kastanienallee 77, 10435 Berlin',
    locationName: 'Prenzlauer Berg, Berlin',
    descriptionSummary: 'Altbauperle in der Kastanienallee. 2 Zimmer, hohe Decken, Dielenboden. Perfekte Lage für Cafes und Shopping.',
    originalUrl: 'https://seed.example.com/berlin-pberg-6',
    platform: 'WG-Gesucht',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.ACTIVE,
    trustScore: 90,
    features: ['Altbau', 'Dielenboden', 'Balkon'],
    images: [UNSPLASH('1600047509807-ba8f99d2cdde')],
    landlordName: 'Anna Weber',
    landlordEmail: 'landlord@test.com',
    latitude: 52.5387,
    longitude: 13.4134,
    anmeldungPossible: true,
  },
  {
    title: 'Großzügige 3-Zimmer Kreuzberg',
    priceWarm: 1100,
    priceCold: 850,
    deposit: 1700,
    size: 85,
    rooms: 3,
    address: 'Oranienstraße 34, 10999 Berlin',
    locationName: 'Kreuzberg, Berlin',
    descriptionSummary: 'Geräumige Wohnung im lebendigen Kreuzberg. 3 Zimmer mit Wohnküche, Badewanne und Abstellraum.',
    originalUrl: 'https://seed.example.com/berlin-kreuzberg-7',
    platform: 'ImmoScout24',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.VERIFIED,
    trustScore: 93,
    features: ['Wohnküche', 'Badewanne', 'Keller', 'Hinterhof'],
    images: [UNSPLASH('1600566753376-12c8ab7c5a1e')],
    landlordName: 'Thomas Fischer',
    landlordEmail: 'landlord@test.com',
    latitude: 52.4992,
    longitude: 13.4218,
    anmeldungPossible: true,
  },
  {
    title: 'Studio-Apartment Berlin Mitte',
    priceWarm: 780,
    priceCold: 620,
    deposit: 1240,
    size: 28,
    rooms: 1,
    address: 'Torstraße 88, 10119 Berlin',
    locationName: 'Mitte, Berlin',
    descriptionSummary: 'Kompaktes Studio in bester Lage. Frisch renoviert, Einbauküche, perfekte ÖPNV-Anbindung.',
    originalUrl: 'https://seed.example.com/berlin-mitte-8',
    platform: 'Kleinanzeigen',
    listingType: ListingType.STUDIO,
    status: ListingStatus.ACTIVE,
    trustScore: 82,
    features: ['Renoviert', 'Einbauküche', 'Zentral'],
    images: [UNSPLASH('1600573472591-ee602bea1f59')],
    landlordName: 'Michael Koch',
    landlordEmail: 'landlord@test.com',
    latitude: 52.5284,
    longitude: 13.3977,
    anmeldungPossible: true,
  },
  {
    title: 'Familienfreundliche 4-Zimmer Charlottenburg',
    priceWarm: 1650,
    priceCold: 1350,
    deposit: 2700,
    size: 105,
    rooms: 4,
    address: 'Kantstraße 55, 10625 Berlin',
    locationName: 'Charlottenburg, Berlin',
    descriptionSummary: 'Geräumige Familienwohnung in ruhiger Charlottenburger Seitenstraße. 4 Zimmer, 2 Bäder, großer Balkon.',
    originalUrl: 'https://seed.example.com/berlin-charlottenburg-9',
    platform: 'Immowelt',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.VERIFIED,
    trustScore: 96,
    features: ['2 Bäder', 'Balkon', 'Parkett', 'Aufzug', 'Keller'],
    images: [UNSPLASH('1600210492486-724fe5c67fb0')],
    landlordName: 'Christine Bauer',
    landlordEmail: 'landlord@test.com',
    latitude: 52.5074,
    longitude: 13.3125,
    anmeldungPossible: true,
  },
  {
    title: 'Loft-Wohnung in Friedrichshain',
    priceWarm: 1050,
    priceCold: 820,
    deposit: 1640,
    size: 65,
    rooms: 2,
    address: 'Simon-Dach-Straße 12, 10245 Berlin',
    locationName: 'Friedrichshain, Berlin',
    descriptionSummary: 'Loftartige Wohnung im angesagten Friedrichshain. Offener Grundriss, große Fenster, Industriecharme.',
    originalUrl: 'https://seed.example.com/berlin-friedrichshain-10',
    platform: 'WG-Gesucht',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.ACTIVE,
    trustScore: 88,
    features: ['Loft', 'Industrie', 'Hohe Decken'],
    images: [UNSPLASH('1600607687939-ce8a6c25118c')],
    landlordName: 'David Schulz',
    landlordEmail: 'landlord@test.com',
    latitude: 52.5072,
    longitude: 13.4537,
    anmeldungPossible: true,
  },
  // ── Munich ────────────────────────────────────────────────
  {
    title: 'Helle 2-Zimmer in Schwabing',
    priceWarm: 1350,
    priceCold: 1050,
    deposit: 2100,
    size: 55,
    rooms: 2,
    address: 'Leopoldstraße 120, 80802 München',
    locationName: 'Schwabing, Munich',
    descriptionSummary: 'Lichtdurchflutete Wohnung an der Leopoldstraße. Parkett, modernes Bad, Gemeinschaftsgarten.',
    originalUrl: 'https://seed.example.com/munich-schwabing-11',
    platform: 'ImmoScout24',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.ACTIVE,
    trustScore: 91,
    features: ['Parkett', 'Garten', 'Fahrradkeller'],
    images: [UNSPLASH('1600585154526-990dced4db0d')],
    landlordName: 'Barbara Hartmann',
    landlordEmail: 'landlord@test.com',
    latitude: 48.1632,
    longitude: 11.5860,
    anmeldungPossible: true,
  },
  {
    title: 'Neubau 3-Zimmer Maxvorstadt',
    priceWarm: 1800,
    priceCold: 1450,
    deposit: 2900,
    size: 82,
    rooms: 3,
    address: 'Türkenstraße 45, 80799 München',
    locationName: 'Maxvorstadt, Munich',
    descriptionSummary: 'Erstbezug! Moderner Neubau nahe der Uni. Smart-Home, Fußbodenheizung, Loggia mit Blick auf Frauenkirche.',
    originalUrl: 'https://seed.example.com/munich-maxvorstadt-12',
    platform: 'Immowelt',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.VERIFIED,
    trustScore: 98,
    features: ['Erstbezug', 'Smart-Home', 'Fußbodenheizung', 'Loggia'],
    images: [UNSPLASH('1600566753190-17f0baa2a6c3')],
    landlordName: 'Werner Zimmermann',
    landlordEmail: 'landlord@test.com',
    latitude: 48.1510,
    longitude: 11.5747,
    anmeldungPossible: true,
  },
  // ── Frankfurt ─────────────────────────────────────────────
  {
    title: 'Stilvolles Apartment Sachsenhausen',
    priceWarm: 980,
    priceCold: 790,
    deposit: 1580,
    size: 45,
    rooms: 2,
    address: 'Schweizer Straße 38, 60594 Frankfurt',
    locationName: 'Sachsenhausen, Frankfurt',
    descriptionSummary: 'Charmantes Apartment im Apfelweinviertel. Altbau, Dielenboden, ruhige Lage. 5 Min. zum Main.',
    originalUrl: 'https://seed.example.com/frankfurt-sachsenhausen-13',
    platform: 'ImmoScout24',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.ACTIVE,
    trustScore: 87,
    features: ['Altbau', 'Dielenboden', 'Main-Nähe'],
    images: [UNSPLASH('1600596542815-ffad4c1539a9')],
    landlordName: 'Ursula Meyer',
    landlordEmail: 'landlord@test.com',
    latitude: 50.1009,
    longitude: 8.6921,
    anmeldungPossible: true,
  },
  {
    title: 'WG-Zimmer Nordend-Ost',
    priceWarm: 520,
    priceCold: 420,
    deposit: 840,
    size: 16,
    rooms: 1,
    address: 'Berger Straße 190, 60385 Frankfurt',
    locationName: 'Nordend, Frankfurt',
    descriptionSummary: 'Zimmer in netter 3er-WG. Berger Straße — Cafés, Bars und Märkte direkt vor der Tür.',
    originalUrl: 'https://seed.example.com/frankfurt-nordend-14',
    platform: 'WG-Gesucht',
    listingType: ListingType.WG,
    status: ListingStatus.ACTIVE,
    trustScore: 80,
    features: ['WG', 'Zentral', 'Möbliert'],
    images: [UNSPLASH('1600585154340-be6161a56a0c')],
    landlordName: 'Martin Schwarz',
    landlordEmail: 'landlord@test.com',
    latitude: 50.1236,
    longitude: 8.6925,
    anmeldungPossible: true,
  },
  // ── Düsseldorf ────────────────────────────────────────────
  {
    title: 'Moderne 2-Zimmer in Bilk',
    priceWarm: 870,
    priceCold: 700,
    deposit: 1400,
    size: 48,
    rooms: 2,
    address: 'Bilker Allee 60, 40219 Düsseldorf',
    locationName: 'Bilk, Düsseldorf',
    descriptionSummary: 'Frisch sanierte Wohnung nahe der Heinrich-Heine-Universität. Neue Küche, neues Bad, Laminat.',
    originalUrl: 'https://seed.example.com/duesseldorf-bilk-15',
    platform: 'Kleinanzeigen',
    listingType: ListingType.PRIVATE,
    status: ListingStatus.ACTIVE,
    trustScore: 84,
    features: ['Saniert', 'Uni-Nähe', 'Einbauküche'],
    images: [UNSPLASH('1600047509807-ba8f99d2cdde')],
    landlordName: 'Sandra Wolf',
    landlordEmail: 'landlord@test.com',
    latitude: 51.2092,
    longitude: 6.7756,
    anmeldungPossible: true,
  },
];

async function seed() {
  console.log('🌱 Starting seed...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'housing_db',
    entities: [User, Listing],
    synchronize: true, // Ensure tables exist
  });

  await dataSource.initialize();
  console.log('✅ Database connected\n');

  const userRepo = dataSource.getRepository(User);
  const listingRepo = dataSource.getRepository(Listing);

  // ── 1. Create dummy tenant ─────────────────────────────────
  const existingTenant = await userRepo.findOneBy({ email: 'tenant@test.com' });
  if (!existingTenant) {
    const tenant = userRepo.create({
      email: 'tenant@test.com',
      passwordHash: await bcrypt.hash('test1234', 10),
      role: UserRole.USER,
      firstName: 'Alex',
      lastName: 'Mustermann',
      profileData: {
        monthlyIncome: '3200€ netto',
        occupation: 'Software Engineer at TechCorp GmbH',
        schufaStatus: 'Excellent (Score: 97)',
        moveInDate: '2026-04-01',
        introText: 'Ich bin ein ruhiger und zuverlässiger Mieter. Nichtraucher, keine Haustiere. Suche eine langfristige Wohnung in Hamburg oder Berlin. Ich arbeite als Software-Entwickler und bin finanziell stabil.',
        hasWBS: false,
        preferredCity: 'Hamburg',
      },
    });
    await userRepo.save(tenant);
    console.log('👤 Created tenant: tenant@test.com / test1234');
  } else {
    console.log('👤 Tenant already exists (tenant@test.com)');
  }

  // ── 2. Create dummy landlord ───────────────────────────────
  const existingLandlord = await userRepo.findOneBy({ email: 'landlord@test.com' });
  if (!existingLandlord) {
    const landlord = userRepo.create({
      email: 'landlord@test.com',
      passwordHash: await bcrypt.hash('test1234', 10),
      role: UserRole.USER,
      firstName: 'Stefan',
      lastName: 'Müller',
      profileData: {
        occupation: 'Property Manager',
      },
    });
    await userRepo.save(landlord);
    console.log('🏠 Created landlord: landlord@test.com / test1234');
  } else {
    console.log('🏠 Landlord already exists (landlord@test.com)');
  }

  // ── 3. Insert listings ────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const data of LISTINGS_DATA) {
    const existing = await listingRepo.findOneBy({ originalUrl: data.originalUrl });
    if (existing) {
      skipped++;
      continue;
    }

    const listing = listingRepo.create(data);
    await listingRepo.save(listing);
    created++;
  }

  console.log(`\n📊 Listings: ${created} created, ${skipped} already existed`);

  // ── Summary ──────────────────────────────────────────────
  const totalUsers = await userRepo.count();
  const totalListings = await listingRepo.count();
  console.log(`\n✅ Seed complete!`);
  console.log(`   Users:    ${totalUsers}`);
  console.log(`   Listings: ${totalListings}`);
  console.log(`\n🔑 Test credentials:`);
  console.log(`   Tenant:   tenant@test.com   / test1234`);
  console.log(`   Landlord: landlord@test.com  / test1234`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
