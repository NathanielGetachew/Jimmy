import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, DollarSign, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const materials = await prisma.material.findMany()
  const products = await prisma.product.findMany()

  const rawValue = materials.reduce((acc, m) => acc + (m.costPerUnit * m.currentStock), 0)
  const productValue = products.reduce((acc, p) => acc + (p.price * p.stockQty), 0)

  const lowStockMaterials = materials.filter(m => m.currentStock < m.minStockLevel)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raw Material Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${rawValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Based on cost per unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Finished Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${productValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Based on selling price
            </p>
          </CardContent>
        </Card>

        <Card className={lowStockMaterials.length > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertCircle className={`h-4 w-4 ${lowStockMaterials.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockMaterials.length} Alert(s)</div>
            {lowStockMaterials.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {lowStockMaterials.slice(0, 3).map(m => m.name).join(', ')}
                {lowStockMaterials.length > 3 && '...'}
              </p>
            )}
            {lowStockMaterials.length === 0 && (
              <p className="text-xs text-muted-foreground">All levels healthy</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
