import { prisma } from "@/lib/db"
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/errors"
import { aggregateItemQuantities, generateOrderNumber } from "@/lib/order-utils"
import { PurchaseOrderInput } from "@/lib/validations"
import { PurchaseOrderStatus } from "@prisma/client"

const purchaseOrderInclude = {
  supplier: {
    select: { id: true, companyName: true },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, sku: true },
      },
    },
  },
} as const

export class PurchaseOrderService {
  static async getAll() {
    return prisma.purchaseOrder.findMany({
      include: purchaseOrderInclude,
      orderBy: { createdAt: "desc" },
    })
  }

  static async getById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: purchaseOrderInclude,
    })
  }

  static async create(data: PurchaseOrderInput, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const [supplier, createdBy] = await Promise.all([
        tx.supplier.findUnique({
          where: { id: data.supplierId },
          select: { id: true },
        }),
        tx.user.findUnique({
          where: { id: createdById },
          select: { id: true, isActive: true },
        }),
      ])

      if (!supplier) {
        throw new NotFoundError("Supplier not found")
      }

      if (!createdBy || !createdBy.isActive) {
        throw new BadRequestError("Cannot create a purchase order with an inactive user")
      }

      const productIds = [...new Set(data.items.map((item) => item.productId))]
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })

      if (products.length !== productIds.length) {
        throw new NotFoundError("One or more products were not found")
      }

      // Enforce supplier-product relationships: every product must be linked to the supplier
      const supplierLinks = await tx.supplierProduct.findMany({
        where: {
          supplierId: data.supplierId,
          productId: { in: productIds },
        },
        select: { productId: true },
      })
      const linkedProductIds = new Set(supplierLinks.map((l) => l.productId))

      for (const product of products) {
        if (!linkedProductIds.has(product.id)) {
          throw new BadRequestError(
            `Product "${product.name}" is not linked to the selected supplier. ` +
              `Please configure the supplier-product relationship in the Products section before creating this order.`
          )
        }
      }

      return tx.purchaseOrder.create({
        data: {
          orderNumber: generateOrderNumber("PO"),
          supplierId: data.supplierId,
          createdById,
          notes: data.notes || null,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
            })),
          },
        },
        include: purchaseOrderInclude,
      })
    })
  }

  static async updateStatus(id: string, status: PurchaseOrderStatus) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      })

      if (!order) {
        throw new NotFoundError("Purchase order not found")
      }

      if (status === order.status) {
        return tx.purchaseOrder.findUnique({
          where: { id },
          include: purchaseOrderInclude,
        })
      }

      if (order.status === "RECEIVED") {
        throw new BadRequestError("Cannot update a received purchase order")
      }

      if (order.status === "CANCELLED") {
        throw new BadRequestError("Cannot update a cancelled purchase order")
      }

      if (status === "RECEIVED") {
        const updatedOrder = await tx.purchaseOrder.updateMany({
          where: {
            id,
            status: "PENDING",
          },
          data: {
            status: "RECEIVED",
            receivedDate: new Date(),
          },
        })

        if (updatedOrder.count !== 1) {
          throw new ConflictError(
            "Purchase order status changed. Refresh and try again."
          )
        }

        const quantitiesByProduct = aggregateItemQuantities(order.items)

        for (const [productId, quantity] of quantitiesByProduct.entries()) {
          await tx.product.update({
            where: { id: productId },
            data: {
              quantityInStock: {
                increment: quantity,
              },
            },
          })
        }
      } else if (status === "CANCELLED") {
        const updatedOrder = await tx.purchaseOrder.updateMany({
          where: {
            id,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
          },
        })

        if (updatedOrder.count !== 1) {
          throw new ConflictError(
            "Purchase order status changed. Refresh and try again."
          )
        }
      }

      return tx.purchaseOrder.findUnique({
        where: { id },
        include: purchaseOrderInclude,
      })
    })
  }

  static async getRecent(limit: number = 5) {
    return prisma.purchaseOrder.findMany({
      take: limit,
      include: purchaseOrderInclude,
      orderBy: { createdAt: "desc" },
    })
  }
}
