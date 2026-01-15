"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area" 
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { completeSale, SalesCartItem } from "@/app/actions"
import { Plus, Minus, ShoppingCart, Trash2 } from "lucide-react"

type Product = {
    id: string
    name: string
    price: number
    stockQty: number
}

export function PointOfSale({ products }: { products: Product[] }) {
    const [cart, setCart] = useState<SalesCartItem[]>([])
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const addToCart = (product: Product) => {
        if (product.stockQty <= 0) {
            toast.error("Out of stock")
            return
        }
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id)
            if (existing) {
                // Check stock limit in cart
                if (existing.quantity >= product.stockQty) {
                    toast.error("Max stock reached")
                    return prev
                }
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { productId: product.id, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId))
    }

    const adjustQty = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.productId === productId) {
                    const newQty = item.quantity + delta
                    if (newQty <= 0) return item // Don't remove, or maybe do?
                    // Validate stock
                    const prod = products.find(p => p.id === productId)
                    if (prod && newQty > prod.stockQty) {
                        toast.error("Not enough stock")
                        return item
                    }
                    return { ...item, quantity: newQty }
                }
                return item
            })
        })
    }

    const totalAmount = cart.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId)
        return acc + (product ? product.price * item.quantity : 0)
    }, 0)

    const handleCheckout = async () => {
        setIsCheckingOut(true)
        try {
            await completeSale(cart)
            toast.success("Sale completed successfully")
            setCart([])
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsCheckingOut(false)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
            {/* Product Grid */}
            <div className="flex-1 flex flex-col gap-4">
                <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="cursor-pointer hover:border-primary transition-colors flex flex-col justify-between" onClick={() => addToCart(product)}>
                            <CardHeader className="p-4">
                                <CardTitle className="text-base truncate" title={product.name}>{product.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-2xl font-bold">${product.price}</div>
                                <div className={product.stockQty > 0 ? "text-green-600 text-sm" : "text-red-500 text-sm font-bold"}>
                                    Stock: {product.stockQty}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <Card className="w-full lg:w-96 flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Current Sale
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            Cart is empty
                        </div>
                    ) : (
                        cart.map(item => {
                            const product = products.find(p => p.id === item.productId)
                            if (!product) return null
                            return (
                                <div key={item.productId} className="flex justify-between items-center bg-muted/40 p-2 rounded">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{product.name}</div>
                                        <div className="text-xs text-muted-foreground">${product.price} x {item.quantity}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustQty(item.productId, -1)} disabled={item.quantity <= 1}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustQty(item.productId, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => removeFromCart(item.productId)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </CardContent>
                <Separator />
                <CardFooter className="flex flex-col gap-4 p-4 bg-muted/20">
                    <div className="flex justify-between w-full text-lg font-bold">
                        <span>Total:</span>
                        <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <Button className="w-full" size="lg" disabled={cart.length === 0 || isCheckingOut} onClick={handleCheckout}>
                        {isCheckingOut ? "Processing..." : "Complete Sale"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
