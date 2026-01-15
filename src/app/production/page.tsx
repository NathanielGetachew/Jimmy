import { prisma } from "@/lib/prisma"
import { ProductionForm } from "@/components/production-form"

export const dynamic = 'force-dynamic'

export default async function ProductionPage() {
    const products = await prisma.product.findMany({
        include: {
            bomItems: {
                include: {
                    material: true
                }
            }
        }
    })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Production Hub</h1>
            <p className="text-muted-foreground">Select a product to manufacture. Stock will be deducted automatically.</p>

            <div className="flex justify-center mt-10">
                <ProductionForm products={products} />
            </div>
        </div>
    )
}
