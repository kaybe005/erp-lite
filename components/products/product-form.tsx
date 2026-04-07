"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, ProductInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { mutate } from "swr"

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
  }
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

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

  async function onSubmit(data: ProductInput) {
    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (result.success) {
        toast.success(
          isEditing ? "Product updated successfully" : "Product created successfully"
        )
        mutate("/api/products")
        router.push("/products")
      } else {
        toast.error(result.error || "Failed to save product")
      }
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
