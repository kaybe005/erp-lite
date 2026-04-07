import { prisma } from "@/lib/db"
import { PurchaseOrderService } from "./purchase-order.service"
import { SalesOrderService } from "./sales-order.service"

export class DashboardService {
  static async getStats() {
    const [
      totalProducts,
      totalSuppliers,
      lowStockProducts,
      totalPurchaseOrders,
      totalSalesOrders,
      recentPurchaseOrders,
      recentSalesOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.supplier.count(),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM products 
        WHERE "quantityInStock" <= "reorderLevel"
      `.then((result) => Number(result[0]?.count || 0)),
      prisma.purchaseOrder.count(),
      prisma.salesOrder.count(),
      PurchaseOrderService.getRecent(5),
      SalesOrderService.getRecent(5),
    ])

    return {
      totalProducts,
      totalSuppliers,
      lowStockProducts,
      totalPurchaseOrders,
      totalSalesOrders,
      recentPurchaseOrders,
      recentSalesOrders,
    }
  }

  static async getLowStockProducts() {
    return prisma.$queryRaw`
      SELECT * FROM products 
      WHERE "quantityInStock" <= "reorderLevel"
      ORDER BY "quantityInStock" ASC
    `
  }
}
