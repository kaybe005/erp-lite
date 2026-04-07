import { Role, PurchaseOrderStatus, SalesOrderStatus } from "@prisma/client"

export type { Role, PurchaseOrderStatus, SalesOrderStatus }

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DashboardStats {
  totalProducts: number
  totalSuppliers: number
  lowStockProducts: number
  totalPurchaseOrders: number
  totalSalesOrders: number
  recentPurchaseOrders: PurchaseOrderWithDetails[]
  recentSalesOrders: SalesOrderWithDetails[]
}

export interface ProductFormData {
  name: string
  sku: string
  category: string
  description?: string
  unitPrice: number
  quantityInStock: number
  reorderLevel: number
}

export interface SupplierFormData {
  companyName: string
  contactName: string
  email?: string
  phone?: string
  address?: string
}

export interface PurchaseOrderFormData {
  supplierId: string
  notes?: string
  items: {
    productId: string
    quantity: number
    unitCost: number
  }[]
}

export interface SalesOrderFormData {
  customerName?: string
  notes?: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
  }[]
}

export interface UserFormData {
  name: string
  email: string
  password?: string
  role: Role
  isActive: boolean
}

export interface PurchaseOrderWithDetails {
  id: string
  orderNumber: string
  status: PurchaseOrderStatus
  orderDate: Date
  receivedDate: Date | null
  notes: string | null
  createdAt: Date
  supplier: {
    id: string
    companyName: string
  }
  createdBy: {
    id: string
    name: string
  }
  items: {
    id: string
    quantity: number
    unitCost: number
    product: {
      id: string
      name: string
      sku: string
    }
  }[]
}

export interface SalesOrderWithDetails {
  id: string
  orderNumber: string
  customerName: string | null
  status: SalesOrderStatus
  orderDate: Date
  notes: string | null
  createdAt: Date
  createdBy: {
    id: string
    name: string
  }
  items: {
    id: string
    quantity: number
    unitPrice: number
    product: {
      id: string
      name: string
      sku: string
    }
  }[]
}
