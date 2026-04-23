"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, ProductInput } from "@/lib/validations"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { mutate } from "swr"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Supplier {
  id: string
  companyName: string
}

interface ProductFormProps {
  product?: {
    id: string
    name: string
    sku: string
    category: string
    description: string | null
    unitPrice: number
    quantityInStock: number
    reorderLevel: number
    supplierProducts?: { supplier: { id: string; companyName: string } }[]
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  // All available suppliers
  const { data: suppliersData } = useSWR<{ success: boolean; data: Supplier[] }>(
    "/api/suppliers",
    fetcher
  )
  const allSuppliers: Supplier[] = suppliersData?.data || []

  // Track selected supplier IDs — pre-populate from existing links when editing
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(() => {
    if (product?.supplierProducts) {
      return product.supplierProducts.map((sp) => sp.supplier.id)
    }
    return []
  })

  // If edit page loads and supplierProducts weren't pre-fetched, sync once data arrives
  useEffect(() => {
    if (product?.supplierProducts) {
      setSelectedSupplierIds(product.supplierProducts.map((sp) => sp.supplier.id))
    }
  }, [product?.supplierProducts])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category,
          description: product.description || "",
          unitPrice: Number(product.unitPrice),
          quantityInStock: product.quantityInStock,
          reorderLevel: product.reorderLevel,
        }
      : {
          name: "",
          sku: "",
          category: "",
          description: "",
          unitPrice: 0,
          quantityInStock: 0,
          reorderLevel: 10,
        },
  })

  function toggleSupplier(supplierId: string) {
    setSelectedSupplierIds((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  async function onSubmit(data: ProductInput) {
    try {
      // Step 1: Save the product
      const url = isEditing ? `/api/products/${product.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Failed to save product")
        return
      }

      // Step 2: Sync supplier links
      const productId = isEditing ? product.id : result.data.id
      const linkRes = await fetch(`/api/products/${productId}/suppliers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierIds: selectedSupplierIds }),
      })

      const linkResult = await linkRes.json()
      if (!linkResult.success) {
        toast.error("Product saved but failed to update supplier links")
        return
      }

      toast.success(
        isEditing ? "Product updated successfully" : "Product created successfully"
      )
      mutate("/api/products")
      router.push("/products")
    } catch {
      toast.error("Failed to save product")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Product" : "New Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Product Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  {...register("name")}
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="sku">SKU</FieldLabel>
                <Input id="sku" placeholder="e.g., PRD-001" {...register("sku")} />
                {errors.sku && <FieldError>{errors.sku.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Input
                  id="category"
                  placeholder="e.g., Electronics"
                  {...register("category")}
                />
                {errors.category && (
                  <FieldError>{errors.category.message}</FieldError>
                )}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="unitPrice">Unit Price ($)</FieldLabel>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("unitPrice", { valueAsNumber: true })}
                />
                {errors.unitPrice && (
                  <FieldError>{errors.unitPrice.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="quantityInStock">Quantity in Stock</FieldLabel>
                <Input
                  id="quantityInStock"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("quantityInStock", { valueAsNumber: true })}
                />
                {errors.quantityInStock && (
                  <FieldError>{errors.quantityInStock.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="reorderLevel">Reorder Level</FieldLabel>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  placeholder="10"
                  {...register("reorderLevel", { valueAsNumber: true })}
                />
                {errors.reorderLevel && (
                  <FieldError>{errors.reorderLevel.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </div>

          <Field>
            <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
            <Textarea
              id="description"
              placeholder="Enter product description"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <FieldError>{errors.description.message}</FieldError>
            )}
          </Field>

          {/* Linked Suppliers */}
          <Field>
            <FieldLabel>Linked Suppliers</FieldLabel>
            <p className="text-sm text-muted-foreground mb-3">
              Select which suppliers can provide this product. Only linked suppliers
              will be available when creating a purchase order for this product.
            </p>
            {allSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No suppliers found. Add suppliers first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allSuppliers.map((supplier) => {
                  const isSelected = selectedSupplierIds.includes(supplier.id)
                  return (
                    <button
                      key={supplier.id}
                      type="button"
                      onClick={() => toggleSupplier(supplier.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                      )}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />
                      )}
                      {supplier.companyName}
                    </button>
                  )
                })}
              </div>
            )}
            {selectedSupplierIds.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                No suppliers linked — this product cannot be ordered via Purchase Orders until at least one supplier is linked.
              </p>
            )}
          </Field>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/products")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
