"use client"

import { useState, useMemo } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { buildProduct } from "@/app/actions"
import { AlertCircle } from "lucide-react"

type Material = {
    id: string
    name: string
    currentStock: number
    unit: string
}

type BomItem = {
    quantity: number
    material: Material
}

type Product = {
    id: string
    name: string
    bomItems: BomItem[]
}

export function ProductionForm({ products }: { products: Product[] }) {
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [quantity, setQuantity] = useState<number>(1)
    const [isPending, setIsPending] = useState(false)

    const selectedProduct = useMemo(() =>
        products.find(p => p.id === selectedProductId),
        [products, selectedProductId])

    const validationError = useMemo(() => {
        if (!selectedProduct) return null
        if (quantity <= 0) return "Quantity must be positive"

        for (const bom of selectedProduct.bomItems) {
            const required = bom.quantity * quantity
            if (bom.material.currentStock < required) {
                return `Not enough ${bom.material.name}! Need ${required}${bom.material.unit}, have ${bom.material.currentStock}${bom.material.unit}.`
            }
        }
        return null
    }, [selectedProduct, quantity])

    async function handleSubmit() {
        if (!selectedProduct) return
        if (validationError) {
            toast.error(validationError)
            return
        }

        setIsPending(true)
        try {
            await buildProduct(selectedProduct.id, quantity)
            toast.success(`Successfully built ${quantity} ${selectedProduct.name}(s)`)
            // Reset logic if you want
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Production Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="product">Select Product</Label>
                    <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                        <SelectTrigger id="product">
                            <SelectValue placeholder="Select a product..." />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity to Build</Label>
                    <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    />
                </div>

                {selectedProduct && (
                    <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                        <h4 className="font-semibold">Required Materials:</h4>
                        <ul className="list-disc list-inside">
                            {selectedProduct.bomItems.map((bom, idx) => {
                                const req = bom.quantity * quantity
                                const hasStock = bom.material.currentStock >= req
                                return (
                                    <li key={idx} className={hasStock ? "text-green-600" : "text-red-600 font-bold"}>
                                        {bom.material.name}: {req}{bom.material.unit} (Stock: {bom.material.currentStock}{bom.material.unit})
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}

                {validationError && (
                    <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {validationError}
                    </div>
                )}

                <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!selectedProduct || !!validationError || isPending}
                >
                    {isPending ? "Processing..." : "Build Product"}
                </Button>
            </CardContent>
        </Card>
    )
}
