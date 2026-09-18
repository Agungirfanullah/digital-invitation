import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Phase 0 seed: reference/catalog data only (Templates, Plans).
 *
 * User, Event, Guest, RSVP, Wish and Gallery fixtures are intentionally
 * NOT seeded yet — those features don't exist until Phase 1+, and
 * fabricating that activity data ahead of the real workflows would look
 * like fake functionality. Expand this script alongside the roadmap phase
 * that introduces each entity (see docs/ROADMAP.md, docs/DATABASE.md §38).
 */
async function main() {
  const templates = [
    { name: "Minimal Elegant", slug: "minimal-elegant", category: "wedding" },
    { name: "Modern Editorial", slug: "modern-editorial", category: "wedding" },
    { name: "Floral Romance", slug: "floral-romance", category: "wedding" },
    { name: "Dark Luxury", slug: "dark-luxury", category: "wedding" },
    { name: "Traditional Nusantara", slug: "traditional-nusantara", category: "wedding" },
    { name: "Soft Romantic", slug: "soft-romantic", category: "wedding" },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: {},
      create: {
        name: template.name,
        slug: template.slug,
        category: template.category,
        isActive: true,
        isPremium: false,
      },
    });
  }

  const plans = [
    {
      name: "Free",
      slug: "free",
      price: "0",
      billingInterval: "MONTHLY" as const,
      features: { premiumTemplates: false, qrCheckIn: false, analytics: false, gift: false },
      limits: { maxEvents: 1, maxGuests: 30 },
    },
    {
      name: "Premium",
      slug: "premium",
      price: "99000",
      billingInterval: "MONTHLY" as const,
      features: {
        premiumTemplates: true,
        qrCheckIn: true,
        analytics: true,
        gift: true,
        customSlug: true,
        removeBranding: true,
      },
      limits: { maxEvents: 3, maxGuests: 500 },
    },
    {
      name: "Business",
      slug: "business",
      price: "299000",
      billingInterval: "MONTHLY" as const,
      features: {
        premiumTemplates: true,
        qrCheckIn: true,
        analytics: true,
        gift: true,
        customSlug: true,
        removeBranding: true,
        multipleEvents: true,
        teamMembers: true,
      },
      limits: { maxEvents: 20, maxGuests: 3000 },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: {
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        billingInterval: plan.billingInterval,
        features: plan.features,
        limits: plan.limits,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${templates.length} templates and ${plans.length} plans.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
