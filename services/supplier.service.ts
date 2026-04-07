import { prisma } from "@/lib/db"
import { BadRequestError, NotFoundError } from "@/lib/errors"
import { SupplierInput } from "@/lib/validations"

export class SupplierService {
  static async getAll() {
    return prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  static async getById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
    })
  }

  static async create(data: SupplierInput) {
    return prisma.supplier.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      },
    })
  }

  static async update(id: string, data: Partial<SupplierInput>) {
    const supplier = await this.getById(id)
    if (!supplier) {
      throw new NotFoundError("Supplier not found")
    }

    return prisma.supplier.update({
      where: { id },
      data: {
        ...(data.companyName && { companyName: data.companyName }),
        ...(data.contactName && { contactName: data.contactName }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null }),
      },
    })
  }

  static async delete(id: string) {
    const supplier = await this.getById(id)
    if (!supplier) {
      throw new NotFoundError("Supplier not found")
    }

    // Check if supplier has purchase orders
    const orders = await prisma.purchaseOrder.count({
      where: { supplierId: id },
    })

    if (orders > 0) {
      throw new BadRequestError("Cannot delete supplier with existing purchase orders")
    }

    return prisma.supplier.delete({
      where: { id },
    })
  }
}
