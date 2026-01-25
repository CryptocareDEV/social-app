import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const categories = [
    { key: "reflection", label: "Reflection" },
    { key: "question", label: "Question" },
    { key: "story", label: "Story" },
    { key: "community", label: "Community" },
    { key: "local", label: "Local Life" },
    { key: "climate", label: "Climate" },
    { key: "technology", label: "Technology" },
    { key: "art", label: "Art" },
    { key: "grief", label: "Grief" },
    { key: "healing", label: "Healing" },
    { key: "learning", label: "Learning" },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { key: cat.key },
      update: {
        label: cat.label,
      },
      create: {
        key: cat.key,
        label: cat.label,
      },
    })
  }

  console.log("✅ Categories seeded successfully")
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
