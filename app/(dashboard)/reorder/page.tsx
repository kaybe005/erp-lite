"use client"

import Link from "next/link"
import useSWR from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ShoppingCart, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface SupplierInfo {
  id: string
  companyName: string
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  category: string
  quantityInStock: number
  reorderLevel: number
  supplierProducts: { supplier: SupplierInfo }[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ReorderPage() {
  const { data, isLoading } = useSWR("/api/products/low-stock", fetcher)
  const products: LowStockProduct[] = data?.data || []

  const columns = [
    {
      header: "Product",
      accessor: (item: LowStockProduct) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.sku}</p>
        </div>
      ),
    },
    { header: "Category", accessor: "category" as const },
    {
      header: "Current Stock",
      accessor: (item: LowStockProduct) => (
        <span className="font-semibold text-destructive">{item.quantityInStock}</span>
      ),
    },
    {
      header: "Reorder Level",
      accessor: (item: LowStockProduct) => (
        <span>{item.reorderLevel}</span>
      ),
    },
    {
      header: "Shortage",
      accessor: (item: LowStockProduct) => {
        const shortage = item.reorderLevel - item.quantityInStock
        return (
          <Badge variant="destructive" className="font-mono">
            -{shortage}
          </Badge>
        )
      },
    },
    {
      header: "Valid Suppliers",
      accessor: (item: LowStockProduct) => {
        const suppliers = item.supplierProducts.map((sp) => sp.supplier)
        if (suppliers.length === 0) {
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <span className="italic">No suppliers configured</span>
              <Link href={`/products/${item.id}/edit`}>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </Link>
            </div>
          )
        }
        return (
          <div className="flex flex-wrap gap-1">
            {suppliers.map((s) => (
              <Badge key={s.id} variant="secondary" className="text-xs font-normal">
                {s.companyName}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      header: "Action",
      accessor: (item: LowStockProduct) => {
        const hasSuppliers = item.supplierProducts.length > 0
        return (
          <Link
            href={
              hasSuppliers
                ? `/purchase-orders/new?productId=${item.id}`
                : `/products/${item.id}/edit`
            }
          >
            <Button
              size="sm"
              variant={hasSuppliers ? "default" : "outline"}
              className={cn(!hasSuppliers && "text-muted-foreground")}
            >
              {hasSuppliers ? (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  Create PO
                </>
              ) : (
                <>
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Link Supplier
                </>
              )}
            </Button>
          </Link>
        )
      },
      className: "w-36",
    },
  ]

  return (
    <PageWrapper
      title="Reorder List"
      description="Products at or below their minimum stock threshold"
    >
      {!isLoading && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-1">All stock levels are healthy</h3>
          <p className="text-sm text-muted-foreground">
            No products are currently at or below their reorder threshold.
          </p>
        </div>
      ) : (
        <>
          {!isLoading && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-destructive">
                  {products.length} product{products.length !== 1 ? "s" : ""} need
                  {products.length === 1 ? "s" : ""} reordering
                </p>
                <p className="text-sm text-muted-foreground">
                  Stock is at or below the configured reorder level
                </p>
              </div>
            </div>
          )}
          <DataTable
            columns={columns}
            data={products}
            loading={isLoading}
            emptyMessage="No products need reordering."
          />
        </>
      )}
    </PageWrapper>
  )
}
