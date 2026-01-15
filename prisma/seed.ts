import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // 1. Raw Materials
  const oak = await prisma.material.create({
    data: {
      name: 'Oak Timber',
      unit: 'Meters',
      costPerUnit: 5.0,
      currentStock: 100.0, // Initial stock
      minStockLevel: 20.0,
    }
  })

  const varnish = await prisma.material.create({
    data: {
      name: 'Varnish',
      unit: 'Liters',
      costPerUnit: 12.0,
      currentStock: 50.0,
      minStockLevel: 5.0,
    }
  })

  const velvet = await prisma.material.create({
    data: {
      name: 'Velvet',
      unit: 'Meters',
      costPerUnit: 20.0,
      currentStock: 50.0,
      minStockLevel: 10.0,
    }
  })

  const screws = await prisma.material.create({
    data: {
      name: 'Screws',
      unit: 'Box',
      costPerUnit: 2.0,
      currentStock: 200.0,
      minStockLevel: 20.0,
    }
  })

  // 2. Products & BOM
  // Nordic Dining Table (10m Oak, 0.5L Varnish)
  const diningTable = await prisma.product.create({
    data: {
      name: 'Nordic Dining Table',
      sku: 'NDT-001',
      price: 350.0,
      stockQty: 5,
      bomItems: {
        create: [
          {
            materialId: oak.id,
            quantity: 10.0,
            wasteFactor: 0.1, // 10% waste
          },
          {
            materialId: varnish.id,
            quantity: 0.5,
            wasteFactor: 0.0,
          }
        ]
      }
    }
  })

  // Velvet Armchair (5m Velvet, 2m Oak)
  const armchair = await prisma.product.create({
    data: {
      name: 'Velvet Armchair',
      sku: 'VAC-001',
      price: 150.0,
      stockQty: 8,
      bomItems: {
        create: [
          {
            materialId: velvet.id,
            quantity: 5.0,
            wasteFactor: 0.05,
          },
          {
            materialId: oak.id,
            quantity: 2.0,
            wasteFactor: 0.1,
          }
        ]
      }
    }
  })

  console.log('Seeding completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
