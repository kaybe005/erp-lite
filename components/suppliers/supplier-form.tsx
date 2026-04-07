"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supplierSchema, SupplierInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { mutate } from "swr"

interface SupplierFormProps {
  supplier?: {
    id: string
    companyName: string
    contactName: string
    email: string | null
    phone: string | null
    address: string | null
  }
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter()
  const isEditing = !!supplier

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          companyName: supplier.companyName,
          contactName: supplier.contactName,
          email: supplier.email || "",
          phone: supplier.phone || "",
          address: supplier.address || "",
        }
      : {
          companyName: "",
          contactName: "",
          email: "",
          phone: "",
          address: "",
        },
  })

  async function onSubmit(data: SupplierInput) {
    try {
      const url = isEditing ? `/api/suppliers/${supplier.id}` : "/api/suppliers"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (result.success) {
        toast.success(
          isEditing ? "Supplier updated successfully" : "Supplier created successfully"
        )
        mutate("/api/suppliers")
        router.push("/suppliers")
      } else {
        toast.error(result.error || "Failed to save supplier")
      }
    } catch {
      toast.error("Failed to save supplier")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Supplier" : "New Supplier"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <FieldError>{errors.companyName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="contactName">Contact Name</FieldLabel>
                <Input
                  id="contactName"
                  placeholder="Enter contact person name"
                  {...register("contactName")}
                />
                {errors.contactName && (
                  <FieldError>{errors.contactName.message}</FieldError>
                )}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email (Optional)</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="supplier@example.com"
                  {...register("email")}
                />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Phone (Optional)</FieldLabel>
                <Input
                  id="phone"
                  placeholder="e.g., +1 234 567 8900"
                  {...register("phone")}
                />
                {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
              </Field>
            </FieldGroup>
          </div>

          <Field>
            <FieldLabel htmlFor="address">Address (Optional)</FieldLabel>
            <Textarea
              id="address"
              placeholder="Enter supplier address"
              rows={3}
              {...register("address")}
            />
            {errors.address && <FieldError>{errors.address.message}</FieldError>}
          </Field>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Supplier"
              ) : (
                "Create Supplier"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/suppliers")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
