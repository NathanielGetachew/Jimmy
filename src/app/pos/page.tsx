import { prisma } from "@/lib/prisma"
import { PointOfSale } from "@/components/point-of-sale"

export const dynamic = 'force-dynamic'

export default async function POSPage() {
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">Showroom POS</h1>
            <PointOfSale products={products} />
        </div>
    )
}
