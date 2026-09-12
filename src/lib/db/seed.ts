import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { towns } from "./schema";

const gambianTowns = [
  // Banjul Division
  { name: "Banjul", region: "Banjul", latitude: 13.4549, longitude: -16.579 },
  // Kanifing Municipal Council
  {
    name: "Serrekunda",
    region: "Kanifing",
    latitude: 13.4381,
    longitude: -16.6778,
  },
  {
    name: "Bakau",
    region: "Kanifing",
    latitude: 13.4778,
    longitude: -16.6818,
  },
  {
    name: "Fajara",
    region: "Kanifing",
    latitude: 13.4754,
    longitude: -16.7116,
  },
  {
    name: "Kotu",
    region: "Kanifing",
    latitude: 13.4562,
    longitude: -16.7037,
  },
  {
    name: "Kololi",
    region: "Kanifing",
    latitude: 13.4591,
    longitude: -16.732,
  },
  {
    name: "Latrikunda",
    region: "Kanifing",
    latitude: 13.4392,
    longitude: -16.6601,
  },
  {
    name: "Tallinding",
    region: "Kanifing",
    latitude: 13.4401,
    longitude: -16.6471,
  },
  {
    name: "Bundung",
    region: "Kanifing",
    latitude: 13.4465,
    longitude: -16.6584,
  },
  {
    name: "Kanifing",
    region: "Kanifing",
    latitude: 13.4503,
    longitude: -16.6553,
  },
  // West Coast Region
  {
    name: "Brikama",
    region: "West Coast",
    latitude: 13.2714,
    longitude: -16.6506,
  },
  {
    name: "Gunjur",
    region: "West Coast",
    latitude: 13.2021,
    longitude: -16.7337,
  },
  {
    name: "Sanyang",
    region: "West Coast",
    latitude: 13.212,
    longitude: -16.7713,
  },
  {
    name: "Kartong",
    region: "West Coast",
    latitude: 13.0725,
    longitude: -16.7597,
  },
  {
    name: "Tanji",
    region: "West Coast",
    latitude: 13.3508,
    longitude: -16.7757,
  },
  {
    name: "Brufut",
    region: "West Coast",
    latitude: 13.3971,
    longitude: -16.7557,
  },
  {
    name: "Yundum",
    region: "West Coast",
    latitude: 13.3509,
    longitude: -16.6819,
  },
  {
    name: "Lamin",
    region: "West Coast",
    latitude: 13.3904,
    longitude: -16.6314,
  },
  {
    name: "Sukuta",
    region: "West Coast",
    latitude: 13.4089,
    longitude: -16.7082,
  },
  {
    name: "Brusubi",
    region: "West Coast",
    latitude: 13.4153,
    longitude: -16.7386,
  },
  // North Bank Region
  {
    name: "Barra",
    region: "North Bank",
    latitude: 13.4878,
    longitude: -16.5462,
  },
  {
    name: "Kerewan",
    region: "North Bank",
    latitude: 13.4959,
    longitude: -16.0965,
  },
  {
    name: "Farafenni",
    region: "North Bank",
    latitude: 13.5668,
    longitude: -15.6,
  },
  {
    name: "Essau",
    region: "North Bank",
    latitude: 13.4847,
    longitude: -16.5349,
  },
  // Lower River Region
  {
    name: "Soma",
    region: "Lower River",
    latitude: 13.4333,
    longitude: -15.5333,
  },
  {
    name: "Mansa Konko",
    region: "Lower River",
    latitude: 13.4429,
    longitude: -15.5363,
  },
  {
    name: "Bureng",
    region: "Lower River",
    latitude: 13.4756,
    longitude: -15.6919,
  },
  // Central River Region
  {
    name: "Janjanbureh",
    region: "Central River",
    latitude: 13.5379,
    longitude: -14.7684,
  },
  {
    name: "Kuntaur",
    region: "Central River",
    latitude: 13.6628,
    longitude: -14.8869,
  },
  {
    name: "Kaur",
    region: "Central River",
    latitude: 13.6911,
    longitude: -15.325,
  },
  {
    name: "Bansang",
    region: "Central River",
    latitude: 13.4333,
    longitude: -14.65,
  },
  // Upper River Region
  {
    name: "Basse Santa Su",
    region: "Upper River",
    latitude: 13.3127,
    longitude: -14.2127,
  },
  {
    name: "Fatoto",
    region: "Upper River",
    latitude: 13.3656,
    longitude: -13.763,
  },
  {
    name: "Koina",
    region: "Upper River",
    latitude: 13.27,
    longitude: -14.06,
  },
  {
    name: "Gambissara",
    region: "Upper River",
    latitude: 13.3586,
    longitude: -13.891,
  },
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Seeding towns...");

  for (const town of gambianTowns) {
    await db
      .insert(towns)
      .values({
        name: town.name,
        region: town.region,
        latitude: town.latitude.toString(),
        longitude: town.longitude.toString(),
      })
      .onConflictDoNothing();
  }

  console.log(`Seeded ${gambianTowns.length} towns.`);

  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
