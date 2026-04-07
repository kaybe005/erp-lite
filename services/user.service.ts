import { prisma } from "@/lib/db"
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors"
import { UserInput, CreateUserInput } from "@/lib/validations"
import bcrypt from "bcryptjs"

export class UserService {
  private static async ensureAnotherActiveAdminExists(excludedUserId: string) {
    const otherActiveAdmins = await prisma.user.count({
      where: {
        id: { not: excludedUserId },
        role: "ADMIN",
        isActive: true,
      },
    })

    if (otherActiveAdmins === 0) {
      throw new BadRequestError("Cannot remove or deactivate the last active admin")
    }
  }

  static async getAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  static async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  static async getByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })
  }

  static async create(data: CreateUserInput) {
    const normalizedEmail = data.email.trim().toLowerCase()
    const existingUser = await this.getByEmail(normalizedEmail)
    if (existingUser) {
      throw new ConflictError("Email already exists")
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    return prisma.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        passwordHash,
        role: data.role,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  static async update(id: string, data: Partial<UserInput>) {
    const user = await this.getById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    const normalizedEmail = data.email?.trim().toLowerCase()

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingUser = await this.getByEmail(normalizedEmail)
      if (existingUser) {
        throw new ConflictError("Email already exists")
      }
    }

    const nextRole = data.role ?? user.role
    const nextIsActive = data.isActive ?? user.isActive

    if (user.role === "ADMIN" && user.isActive && (nextRole !== "ADMIN" || !nextIsActive)) {
      await this.ensureAnotherActiveAdminExists(id)
    }

    const updateData: Record<string, unknown> = {}
    
    if (data.name) updateData.name = data.name
    if (normalizedEmail) updateData.email = normalizedEmail
    if (data.role) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12)
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  static async delete(id: string) {
    const user = await this.getById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    if (user.role === "ADMIN" && user.isActive) {
      await this.ensureAnotherActiveAdminExists(id)
    }

    // Check if user has created orders
    const purchaseOrders = await prisma.purchaseOrder.count({
      where: { createdById: id },
    })

    const salesOrders = await prisma.salesOrder.count({
      where: { createdById: id },
    })

    if (purchaseOrders > 0 || salesOrders > 0) {
      throw new BadRequestError(
        "Cannot delete user with existing orders. Deactivate instead."
      )
    }

    return prisma.user.delete({
      where: { id },
    })
  }
}
