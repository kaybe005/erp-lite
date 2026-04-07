import { prisma } from "@/lib/db"
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors"
import { ProductInput } from "@/lib/validations"

export class ProductService {
  static async getAll() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  static async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    })
  }

  static async getBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
    })
  }

  static async create(data: ProductInput) {
    const existingSku = await this.getBySku(data.sku)
    if (existingSku) {
      throw new ConflictError("SKU already exists")
    }

    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        description: data.description || null,
        unitPrice: data.unitPrice,
        quantityInStock: data.quantityInStock,
        reorderLevel: data.reorderLevel,
      },
    })
  }

  static async update(id: string, data: Partial<ProductInput>) {
    const product = await this.getById(id)
    if (!product) {
      throw new NotFoundError("Product not found")
    }

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await this.getBySku(data.sku)
      if (existingSku) {
        throw new ConflictError("SKU already exists")
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sku && { sku: data.sku }),
        ...(data.category && { category: data.category }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(data.quantityInStock !== undefined && { quantityInStock: data.quantityInStock }),
        ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
      },
    })
  }

  static async delete(id: string) {
    const product = await this.getById(id)
    if (!product) {
      throw new NotFoundError("Product not found")
    }

    const [purchaseOrderItems, salesOrderItems] = await Promise.all([
      prisma.purchaseOrderItem.count({
        where: { productId: id },
      }),
      prisma.salesOrderItem.count({
        where: { productId: id },
      }),
    ])

    if (purchaseOrderItems > 0 || salesOrderItems > 0) {
      throw new BadRequestError(
        "Cannot delete product with existing purchase or sales order history"
      )
    }

    return prisma.product.delete({
      where: { id },
    })
  }

  static async getLowStock() {
    return prisma.product.findMany({
      where: {
        quantityInStock: {
          lte: prisma.product.fields.reorderLevel,
        },
      },
    })
  }

  static async updateStock(id: string, quantity: number) {
    const product = await this.getById(id)
    if (!product) {
      throw new NotFoundError("Product not found")
    }

    const newQuantity = product.quantityInStock + quantity
    if (newQuantity < 0) {
      throw new BadRequestError("Insufficient stock")
    }

    return prisma.product.update({
      where: { id },
      data: { quantityInStock: newQuantity },
    })
  }
}
