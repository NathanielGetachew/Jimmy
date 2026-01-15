"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateMaterialStock, updateProductStock } from "@/app/actions"
import { toast } from "sonner"
import { Pencil, Save, X } from "lucide-react"

type Material = {
    id: string
    name: string
    unit: string
    costPerUnit: number
    currentStock: number
    minStockLevel: number
}

type Product = {
    id: string
    name: string
    sku: string
    price: number
    stockQty: number
}

function StockEditor({
    id,
    currentVal,
    onSave
}: {
    id: string
    currentVal: number
    onSave: (id: string, val: number) => Promise<void>
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [val, setVal] = useState(currentVal)
    const [isPending, setIsPending] = useState(false)

    const handleSave = async () => {
        setIsPending(true)
        try {
            if (val < 0) throw new Error("Negative stock not allowed")
            await onSave(id, val)
            toast.success("Stock updated")
            setIsEditing(false)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsPending(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    value={val}
                    onChange={(e) => setVal(parseFloat(e.target.value))}
                    className="w-24 h-8"
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isPending}>
                    <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => { setIsEditing(false); setVal(currentVal) }}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 group">
            <span>{currentVal}</span>
            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3 w-3" />
            </Button>
        </div>
    )
}

export function InventoryTables({ materials, products }: { materials: Material[], products: Product[] }) {
    return (
        <Tabs defaultValue="materials" className="w-full">
            <TabsList>
                <TabsTrigger value="materials">Raw Materials</TabsTrigger>
                <TabsTrigger value="products">Finished Goods</TabsTrigger>
            </TabsList>

            <TabsContent value="materials">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Cost/Unit</TableHead>
                                <TableHead>Min Stock</TableHead>
                                <TableHead>Current Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.name}</TableCell>
                                    <TableCell>{m.unit}</TableCell>
                                    <TableCell>${m.costPerUnit}</TableCell>
                                    <TableCell>{m.minStockLevel}</TableCell>
                                    <TableCell>
                                        <StockEditor
                                            id={m.id}
                                            currentVal={m.currentStock}
                                            onSave={async (id, val) => { await updateMaterialStock(id, val) }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="products">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock Qty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.sku}</TableCell>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell>${p.price}</TableCell>
                                    <TableCell>
                                        <StockEditor
                                            id={p.id}
                                            currentVal={p.stockQty}
                                            onSave={async (id, val) => { await updateProductStock(id, val) }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
        </Tabs>
    )
}
