import { prisma } from "@/lib/prisma"
import { InventoryTables } from "@/components/inventory-tables"

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
    const materials = await prisma.material.findMany({ orderBy: { name: 'asc' } })
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <InventoryTables materials={materials} products={products} />
        </div>
    )
}
