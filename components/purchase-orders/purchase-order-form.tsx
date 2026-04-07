"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { purchaseOrderSchema, PurchaseOrderInput } from "@/lib/validations"
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
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Product {
  id: string
  name: string
  sku: string
  unitPrice: number
}

interface Supplier {
  id: string
  companyName: string
}

export function PurchaseOrderForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: productsData } = useSWR("/api/products", fetcher)
  const { data: suppliersData } = useSWR("/api/suppliers", fetcher)

  const products: Product[] = productsData?.data || []
  const suppliers: Supplier[] = suppliersData?.data || []

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitCost: 0 }],
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
      setValue(`items.${index}.unitCost`, Number(product.unitPrice))
    }
  }

  const total = watchItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0),
    0
  )

  async function onSubmit(data: PurchaseOrderInput) {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (result.success) {
        toast.success("Purchase order created successfully")
        mutate("/api/purchase-orders")
        router.push("/purchase-orders")
      } else {
        toast.error(result.error || "Failed to create purchase order")
      }
    } catch {
      toast.error("Failed to create purchase order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <FieldLabel>Supplier</FieldLabel>
              <Select
                onValueChange={(value) => setValue("supplierId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <FieldError>{errors.supplierId.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes (Optional)</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Additional notes for this order"
                {...register("notes")}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-4 items-end p-4 rounded-lg border border-border"
              >
                <div className="col-span-12 md:col-span-5">
                  <FieldLabel>Product</FieldLabel>
                  <Select
                    onValueChange={(value) => handleProductSelect(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
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
                  <FieldLabel htmlFor={`items.${index}.unitCost`}>
                    Unit Cost ($)
                  </FieldLabel>
                  <Input
                    id={`items.${index}.unitCost`}
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`items.${index}.unitCost`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.items?.[index]?.unitCost && (
                    <FieldError>
                      {errors.items[index]?.unitCost?.message}
                    </FieldError>
                  )}
                </div>

                <div className="col-span-8 md:col-span-2 text-right">
                  <FieldLabel>Subtotal</FieldLabel>
                  <p className="font-medium py-2">
                    ${((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitCost || 0)).toFixed(2)}
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
            ))}

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
            "Create Purchase Order"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/purchase-orders")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
