"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR, { mutate } from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  unitPrice: number
  quantityInStock: number
  reorderLevel: number
  supplierProducts?: { supplier: { id: string; companyName: string } }[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ProductsPage() {
  const { data, isLoading } = useSWR("/api/products", fetcher)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const products: Product[] = data?.data || []

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" })
      const result = await res.json()

      if (result.success) {
        toast.success("Product deleted successfully")
        mutate("/api/products")
      } else {
        toast.error(result.error || "Failed to delete product")
      }
    } catch {
      toast.error("Failed to delete product")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const columns = [
    { header: "Name", accessor: "name" as const },
    { header: "SKU", accessor: "sku" as const },
    { header: "Category", accessor: "category" as const },
    {
      header: "Suppliers",
      accessor: (item: Product) => {
        const suppliers = item.supplierProducts?.map((sp) => sp.supplier.companyName) || []
        if (suppliers.length === 0) {
          return <span className="text-muted-foreground italic text-sm">None configured</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {suppliers.map((name) => (
              <Badge key={name} variant="secondary" className="text-xs font-normal">
                {name}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      header: "Unit Price",
      accessor: (item: Product) => `$${Number(item.unitPrice).toFixed(2)}`,
    },
    {
      header: "Stock",
      accessor: (item: Product) => {
        const isLowStock = item.quantityInStock <= item.reorderLevel
        return (
          <div className="flex items-center gap-2">
            <span className={cn(isLowStock && "text-destructive font-medium")}>
              {item.quantityInStock}
            </span>
            {isLowStock && (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            )}
          </div>
        )
      },
    },
    {
      header: "Reorder Level",
      accessor: "reorderLevel" as const,
    },
    {
      header: "Actions",
      accessor: (item: Product) => (
        <div className="flex items-center gap-2">
          <Link href={`/products/${item.id}/edit`}>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteId(item.id)
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ]

  return (
    <PageWrapper
      title="Products"
      description="Manage your product inventory"
      action={
        <Link href="/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      }
    >
      {/* Low stock alert */}
      {products.some((p) => p.quantityInStock <= p.reorderLevel) && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">Low Stock Alert</p>
            <p className="text-sm text-muted-foreground">
              Some products are at or below their reorder level
            </p>
          </div>
          <Badge variant="destructive" className="ml-auto">
            {products.filter((p) => p.quantityInStock <= p.reorderLevel).length}{" "}
            items
          </Badge>
        </div>
      )}

      <DataTable
        columns={columns}
        data={products}
        loading={isLoading}
        emptyMessage="No products found. Add your first product."
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}
