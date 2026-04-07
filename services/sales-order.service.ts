import { prisma } from "@/lib/db"
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/errors"
import { aggregateItemQuantities, generateOrderNumber } from "@/lib/order-utils"
import { SalesOrderInput } from "@/lib/validations"
import { SalesOrderStatus } from "@prisma/client"

const salesOrderInclude = {
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

export class SalesOrderService {
  static async getAll() {
    return prisma.salesOrder.findMany({
      include: salesOrderInclude,
      orderBy: { createdAt: "desc" },
    })
  }

  static async getById(id: string) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: salesOrderInclude,
    })
  }

  static async create(data: SalesOrderInput, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const createdBy = await tx.user.findUnique({
        where: { id: createdById },
        select: { id: true, isActive: true },
      })

      if (!createdBy || !createdBy.isActive) {
        throw new BadRequestError("Cannot create a sales order with an inactive user")
      }

      const requestedQuantities = aggregateItemQuantities(data.items)
      const productIds = [...requestedQuantities.keys()]
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          quantityInStock: true,
        },
      })

      if (products.length !== productIds.length) {
        throw new NotFoundError("One or more products were not found")
      }

      const productsById = new Map(products.map((product) => [product.id, product]))

      for (const [productId, requestedQuantity] of requestedQuantities.entries()) {
        const product = productsById.get(productId)

        if (!product) {
          throw new NotFoundError("One or more products were not found")
        }

        if (product.quantityInStock < requestedQuantity) {
          throw new BadRequestError(
            `Insufficient stock for ${product.name}. Available: ${product.quantityInStock}, Requested: ${requestedQuantity}`
          )
        }

        const updatedProduct = await tx.product.updateMany({
          where: {
            id: productId,
            quantityInStock: {
              gte: requestedQuantity,
            },
          },
          data: {
            quantityInStock: {
              decrement: requestedQuantity,
            },
          },
        })

        if (updatedProduct.count !== 1) {
          const latestProduct = await tx.product.findUnique({
            where: { id: productId },
            select: {
              name: true,
              quantityInStock: true,
            },
          })

          throw new BadRequestError(
            `Insufficient stock for ${latestProduct?.name ?? "product"}. Available: ${latestProduct?.quantityInStock ?? 0}, Requested: ${requestedQuantity}`
          )
        }
      }

      return tx.salesOrder.create({
        data: {
          orderNumber: generateOrderNumber("SO"),
          customerName: data.customerName || null,
          createdById,
          notes: data.notes || null,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: salesOrderInclude,
      })
    })
  }

  static async updateStatus(id: string, status: SalesOrderStatus) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
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
        throw new NotFoundError("Sales order not found")
      }

      if (status === order.status) {
        return tx.salesOrder.findUnique({
          where: { id },
          include: salesOrderInclude,
        })
      }

      if (order.status === "CANCELLED") {
        throw new BadRequestError("Cannot update a cancelled sales order")
      }

      if (status === "CANCELLED") {
        const updatedOrder = await tx.salesOrder.updateMany({
          where: {
            id,
            status: "CONFIRMED",
          },
          data: {
            status: "CANCELLED",
          },
        })

        if (updatedOrder.count !== 1) {
          throw new ConflictError(
            "Sales order status changed. Refresh and try again."
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
      }

      return tx.salesOrder.findUnique({
        where: { id },
        include: salesOrderInclude,
      })
    })
  }

  static async getRecent(limit: number = 5) {
    return prisma.salesOrder.findMany({
      take: limit,
      include: salesOrderInclude,
      orderBy: { createdAt: "desc" },
    })
  }
}
