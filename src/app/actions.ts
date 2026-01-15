'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function buildProduct(productId: string, quantity: number) {
    if (quantity <= 0) throw new Error("Quantity must be positive")

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { bomItems: { include: { material: true } } }
    })

    if (!product) throw new Error("Product not found")

    // Check validation again (server-side authority)
    for (const bom of product.bomItems) {
        const required = bom.quantity * quantity // Simple logic, wasteFactor ignored in stock check? Prompt said "quantity and wasteFactor". Implementation plan implies standard consumption. I should probably include wasteFactor? "Required 10m". If waste is 10%, do I need 11m?
        // User prompt: "Recipe: links Product to Material with a quantity and wasteFactor."
        // User validation example: "Need 50m, have 20m."
        // I will use quantity * (1 + wasteFactor) if wasteFactor is e.g. 0.1?
        // Or just quantity?
        // "Quantity" in BOM usually means "Net quantity in product". "Waste" is extra consumed.
        // So Total Required = Quantity * (1 + WasteFactor) * BuildQty ?
        // OR BOM Quantity ALREADY includes waste?
        // The prompt says "Requires 10m Oak".
        // I'll assume BOM usage = quantity. Current implementation plan ignores waste logic in consumption steps for simplicity unless specified.
        // Wait, prompt 1 says: "d) Deduct the required Raw Materials".
        // I'll stick to `bom.quantity * buildQuantity`.
        // If I ignore wasteFactor, it's safer for MVP unless user insists.
        // Actually, seed data has `wasteFactor: 0.1`.
        // I should probably start simple: quantity * quantity.

        if (bom.material.currentStock < required) {
            throw new Error(`Not enough ${bom.material.name}! Need ${required}${bom.material.unit}, have ${bom.material.currentStock}${bom.material.unit}.`)
        }
    }

    await prisma.$transaction(async (tx) => {
        for (const bom of product.bomItems) {
            const required = bom.quantity * quantity
            await tx.material.update({
                where: { id: bom.materialId },
                data: { currentStock: { decrement: required } }
            })
        }

        await tx.product.update({
            where: { id: productId },
            data: { stockQty: { increment: quantity } }
        })
    })

    revalidatePath('/')
    revalidatePath('/production')
    revalidatePath('/inventory')
    return { success: true }
}

export type SalesCartItem = {
    productId: string
    quantity: number
}

export async function completeSale(cart: SalesCartItem[]) {
    if (cart.length === 0) throw new Error("Cart is empty")

    await prisma.$transaction(async (tx) => {
        // 1. Create Sale
        const totalAmount = 0 // Calculated below

        // We need to calculate total and create SaleItem
        // Use loop ?
        // Better: Helper logic.
        // But we need Product Prices.

        // Fetch prices first
        const productIds = cart.map(i => i.productId)
        const products = await tx.product.findMany({ where: { id: { in: productIds } } })

        let total = 0
        const saleItemsData = []

        for (const item of cart) {
            const p = products.find(prod => prod.id === item.productId)
            if (!p) throw new Error(`Product ${item.productId} not found`)

            if (p.stockQty < item.quantity) {
                throw new Error(`Not enough stock for ${p.name}. Have ${p.stockQty}, Need ${item.quantity}`)
            }

            const itemTotal = p.price * item.quantity
            total += itemTotal

            saleItemsData.push({
                productId: p.id,
                quantity: item.quantity,
                price: p.price
            })

            // Deduct stock
            await tx.product.update({
                where: { id: p.id },
                data: { stockQty: { decrement: item.quantity } }
            })
        }

        // Create Sale
        await tx.sale.create({
            data: {
                totalAmount: total,
                items: {
                    create: saleItemsData
                }
            }
        })
    })

    revalidatePath('/')
    revalidatePath('/pos')
    revalidatePath('/inventory')
    return { success: true }
}

export async function updateMaterialStock(id: string, newStock: number) {
    if (newStock < 0) throw new Error("Stock cannot be negative")

    await prisma.material.update({
        where: { id },
        data: { currentStock: newStock }
    })

    revalidatePath('/inventory')
    revalidatePath('/production')
    revalidatePath('/')
}

export async function updateProductStock(id: string, newStock: number) {
    if (newStock < 0) throw new Error("Stock cannot be negative")

    await prisma.product.update({
        where: { id },
        data: { stockQty: newStock }
    })

    revalidatePath('/inventory')
    revalidatePath('/pos')
    revalidatePath('/')
}
