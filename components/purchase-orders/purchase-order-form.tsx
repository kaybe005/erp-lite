"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { AlertTriangle, Plus, Trash2, Settings } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

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
  const searchParams = useSearchParams()
  const prefilledProductId = searchParams.get("productId")

  const [isSubmitting, setIsSubmitting] = useState(false)

  // When initiated from reorder list with a specific product:
  // fetch only the suppliers linked to that product.
  // Otherwise, fetch suppliers linked to the currently-selected supplier's products.
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")

  // --- Supplier options ---
  // If productId pre-fill: fetch suppliers valid for that product
  const { data: productSuppliersData } = useSWR<{ success: boolean; data: Supplier[] }>(
    prefilledProductId ? `/api/products/${prefilledProductId}/suppliers` : null,
    fetcher
  )

  // If no pre-fill: fetch all suppliers (user picks supplier first, then products are filtered)
  const { data: allSuppliersData } = useSWR<{ success: boolean; data: Supplier[] }>(
    !prefilledProductId ? "/api/suppliers" : null,
    fetcher
  )

  const suppliers: Supplier[] = prefilledProductId
    ? (productSuppliersData?.data ?? [])
    : (allSuppliersData?.data ?? [])

  const suppliersLoading =
    prefilledProductId ? !productSuppliersData : !allSuppliersData

  // --- Product options ---
  // If productId pre-fill: the product is fixed, no dropdown needed
  const { data: prefilledProductData } = useSWR<{ success: boolean; data: Product }>(
    prefilledProductId ? `/api/products/${prefilledProductId}` : null,
    fetcher
  )

  // If supplier selected and no pre-fill: fetch products linked to that supplier
  const { data: supplierProductsData } = useSWR<{ success: boolean; data: Product[] }>(
    !prefilledProductId && selectedSupplierId
      ? `/api/suppliers/${selectedSupplierId}/products`
      : null,
    fetcher
  )

  const availableProducts: Product[] = !prefilledProductId && selectedSupplierId
    ? (supplierProductsData?.data ?? [])
    : []

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

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  })

  const watchItems = watch("items")

  // Pre-fill the first item using `update` (not setValue) so field array
  // state and validation are both updated correctly.
  useEffect(() => {
    if (prefilledProductData?.data) {
      const p = prefilledProductData.data
      update(0, {
        productId: p.id,
        quantity: 1,
        unitCost: Number(p.unitPrice),
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledProductData?.data])

  function handleSupplierSelect(supplierId: string) {
    setSelectedSupplierId(supplierId)
    setValue("supplierId", supplierId)
    // Only clear item selections in normal flow — do NOT clear the
    // pre-filled product when coming from the reorder list.
    if (!prefilledProductId) {
      fields.forEach((_, index) => {
        setValue(`items.${index}.productId`, "")
        setValue(`items.${index}.unitCost`, 0)
      })
    }
  }

  function handleProductSelect(index: number, productId: string) {
    const product = availableProducts.find((p) => p.id === productId)
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

  const prefilledProduct = prefilledProductData?.data

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Pre-fill context banner */}
      {prefilledProductId && prefilledProduct && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Ordering from Reorder List
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
            Product pre-filled:{" "}
            <strong>
              {prefilledProduct.name} ({prefilledProduct.sku})
            </strong>
            . Only suppliers linked to this product are shown below.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <FieldLabel>Supplier</FieldLabel>
              {suppliersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Spinner className="w-4 h-4" /> Loading suppliers…
                </div>
              ) : suppliers.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {prefilledProductId
                      ? "No suppliers are linked to this product. "
                      : "No suppliers found. "}
                    <Link
                      href={
                        prefilledProductId
                          ? `/products/${prefilledProductId}/edit`
                          : "/suppliers/new"
                      }
                      className="underline font-medium"
                    >
                      {prefilledProductId ? "Edit the product" : "Add a supplier"}
                    </Link>{" "}
                    to configure supplier links before creating a purchase order.
                  </span>
                </div>
              ) : (
                <Select onValueChange={handleSupplierSelect}>
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
              )}
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
          {/* Only allow adding items when not pre-filled (or supplier is set) */}
          {!prefilledProductId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selectedSupplierId}
              onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )}
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

                  {/* Pre-filled product: show as read-only text, not a dropdown */}
                  {prefilledProductId && index === 0 && prefilledProduct ? (
                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-sm">
                      {prefilledProduct.name} ({prefilledProduct.sku})
                    </div>
                  ) : !prefilledProductId && selectedSupplierId ? (
                    // Normal flow: supplier selected, show linked products only
                    availableProducts.length === 0 ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-2.5 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>
                          No products linked to this supplier.{" "}
                          <Link href="/products" className="underline font-medium">
                            Edit a product
                          </Link>{" "}
                          to add this supplier.
                        </span>
                      </div>
                    ) : (
                      <Select
                        onValueChange={(value) => handleProductSelect(index, value)}
                        value={watchItems[index]?.productId || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  ) : (
                    // No supplier selected yet
                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
                      Select a supplier first
                    </div>
                  )}

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
                    ${(
                      (watchItems[index]?.quantity || 0) *
                      (watchItems[index]?.unitCost || 0)
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="col-span-4 md:col-span-1 flex justify-end">
                  {fields.length > 1 && !prefilledProductId && (
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
