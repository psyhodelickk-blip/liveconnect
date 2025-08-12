// prisma/seed.js  (SQL upsert, ne zavisi od prisma.giftCatalog)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const gifts = [
  { code: "heart",   name: "Heart",   price: 5,   iconUrl: "https://i.imgur.com/0Z8oQ.png" },
  { code: "rose",    name: "Rose",    price: 10,  iconUrl: "https://i.imgur.com/9kAQn.png" },
  { code: "diamond", name: "Diamond", price: 50,  iconUrl: "https://i.imgur.com/wF8rS.png" },
  { code: "rocket",  name: "Rocket",  price: 100, iconUrl: "https://i.imgur.com/6Jr2g.png" },
];

async function upsertGift(g) {
  // INSERT ... ON CONFLICT (code) DO UPDATE
  await prisma.$executeRaw`
    INSERT INTO "GiftCatalog" ("code","name","price","iconUrl","isActive")
    VALUES (${g.code}, ${g.name}, ${g.price}, ${g.iconUrl}, true)
    ON CONFLICT ("code") DO UPDATE
    SET "name"=EXCLUDED."name",
        "price"=EXCLUDED."price",
        "iconUrl"=EXCLUDED."iconUrl",
        "isActive"=true;
  `;
}

async function main() {
  for (const g of gifts) {
    await upsertGift(g);
  }
  console.log("✅ Gift catalog seeded");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
