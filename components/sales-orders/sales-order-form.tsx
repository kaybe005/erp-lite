"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { salesOrderSchema, SalesOrderInput } from "@/lib/validations"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Product {
  id: string
  name: string
  sku: string
  unitPrice: number
  quantityInStock: number
}

export function SalesOrderForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: productsData } = useSWR("/api/products", fetcher)
  const products: Product[] = productsData?.data || []

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalesOrderInput>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      customerName: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  const watchItems = watch("items")

  function handleProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.id === productId)
    if (product) {
      setValue(`items.${index}.productId`, productId)
      setValue(`items.${index}.unitPrice`, Number(product.unitPrice))
    }
  }

  function getSelectedProduct(productId: string) {
    return products.find((p) => p.id === productId)
  }

  const total = watchItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  )

  async function onSubmit(data: SalesOrderInput) {
    // Validate stock before submitting
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId)
      if (product && item.quantity > product.quantityInStock) {
        toast.error(
          `Insufficient stock for ${product.name}. Available: ${product.quantityInStock}`
        )
        return
      }
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (result.success) {
        toast.success("Sales order created successfully")
        mutate("/api/sales-orders")
        mutate("/api/products")
        mutate("/api/dashboard")
        router.push("/sales-orders")
      } else {
        toast.error(result.error || "Failed to create sales order")
      }
    } catch {
      toast.error("Failed to create sales order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="customerName">
                Customer Name (Optional)
              </FieldLabel>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                {...register("customerName")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes (Optional)</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Additional notes for this order"
                {...register("notes")}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const selectedProduct = getSelectedProduct(
                watchItems[index]?.productId
              )
              const requestedQty = watchItems[index]?.quantity || 0
              const isInsufficientStock =
                selectedProduct && requestedQty > selectedProduct.quantityInStock

              return (
                <div
                  key={field.id}
                  className="p-4 rounded-lg border border-border space-y-4"
                >
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <FieldLabel>Product</FieldLabel>
                      <Select
                        onValueChange={(value) =>
                          handleProductSelect(index, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center gap-2">
                                <span>{product.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  Stock: {product.quantityInStock}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.items?.[index]?.productId && (
                        <FieldError>
                          {errors.items[index]?.productId?.message}
                        </FieldError>
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <FieldLabel htmlFor={`items.${index}.quantity`}>
                        Quantity
                      </FieldLabel>
                      <Input
                        id={`items.${index}.quantity`}
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <FieldError>
                          {errors.items[index]?.quantity?.message}
                        </FieldError>
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <FieldLabel htmlFor={`items.${index}.unitPrice`}>
                        Unit Price ($)
                      </FieldLabel>
                      <Input
                        id={`items.${index}.unitPrice`}
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <FieldError>
                          {errors.items[index]?.unitPrice?.message}
                        </FieldError>
                      )}
                    </div>

                    <div className="col-span-8 md:col-span-2 text-right">
                      <FieldLabel>Subtotal</FieldLabel>
                      <p className="font-medium py-2">
                        $
                        {(
                          (watchItems[index]?.quantity || 0) *
                          (watchItems[index]?.unitPrice || 0)
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div className="col-span-4 md:col-span-1 flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {isInsufficientStock && (
                    <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        Insufficient stock. Available:{" "}
                        {selectedProduct?.quantityInStock}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            {errors.items?.root && (
              <FieldError>{errors.items.root.message}</FieldError>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">${total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Creating...
            </>
          ) : (
            "Create Sales Order"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/sales-orders")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
