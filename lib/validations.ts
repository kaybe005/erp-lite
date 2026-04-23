import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  unitPrice: z.number().positive("Unit price must be positive"),
  quantityInStock: z.number().int().min(0, "Quantity cannot be negative"),
  reorderLevel: z.number().int().min(0, "Reorder level cannot be negative"),
})

export const supplierSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitCost: z.number().positive("Unit cost must be positive"),
})

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
})

export const salesOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
})

export const salesOrderSchema = z.object({
  customerName: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1, "At least one item is required"),
})

export const supplierProductSyncSchema = z.object({
  supplierIds: z.array(z.string()).default([]),
})

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["ADMIN", "STAFF"]),
  isActive: z.boolean(),
})

export const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type SupplierProductSyncInput = z.infer<typeof supplierProductSyncSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProductInput = z.infer<typeof productSchema>
export type SupplierInput = z.infer<typeof supplierSchema>
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>
export type SalesOrderInput = z.infer<typeof salesOrderSchema>
export type UserInput = z.infer<typeof userSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
