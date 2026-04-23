import { prisma } from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns"

interface MonthlyPoint {
  month: string
  revenue: number
  costs: number
  profit: number
}

interface TopProduct {
  name: string
  sku: string
  revenue: number
  quantity: number
}

export class AnalyticsService {
  /** Monthly revenue vs cost for the last N months */
  static async getMonthlyTrend(months = 6): Promise<MonthlyPoint[]> {
    const now = new Date()

    const results = await Promise.all(
      Array.from({ length: months }, (_, i) => {
        const date = subMonths(now, months - 1 - i)
        const start = startOfMonth(date)
        const end = endOfMonth(date)
        const label = format(date, "MMM")

        return Promise.all([
          // Revenue: sum of quantity * unitPrice for confirmed sales orders
          prisma.salesOrderItem.aggregate({
            where: {
              salesOrder: {
                orderDate: { gte: start, lte: end },
                status: "CONFIRMED",
              },
            },
            _sum: { quantity: true },
          }).then(async (agg) => {
            // We need sum(quantity * unitPrice) — use raw SQL for efficiency
            const rows = await prisma.$queryRaw<{ total: string }[]>`
              SELECT COALESCE(SUM(soi.quantity * soi."unitPrice"), 0) as total
              FROM sales_order_items soi
              JOIN sales_orders so ON so.id = soi."salesOrderId"
              WHERE so."orderDate" >= ${start} AND so."orderDate" <= ${end}
                AND so.status = 'CONFIRMED'
            `
            return Number(rows[0]?.total ?? 0)
          }),
          // Costs: sum of quantity * unitCost for received/pending purchase orders
          prisma.$queryRaw<{ total: string }[]>`
            SELECT COALESCE(SUM(poi.quantity * poi."unitCost"), 0) as total
            FROM purchase_order_items poi
            JOIN purchase_orders po ON po.id = poi."purchaseOrderId"
            WHERE po."orderDate" >= ${start} AND po."orderDate" <= ${end}
              AND po.status != 'CANCELLED'
          `.then((rows) => Number(rows[0]?.total ?? 0)),
        ]).then(([revenue, costs]) => ({
          month: label,
          revenue,
          costs,
          profit: revenue - costs,
        }))
      })
    )

    return results
  }

  /** Top 5 products by revenue */
  static async getTopProducts(): Promise<TopProduct[]> {
    const rows = await prisma.$queryRaw<
      { name: string; sku: string; revenue: string; quantity: string }[]
    >`
      SELECT
        p.name,
        p.sku,
        COALESCE(SUM(soi.quantity * soi."unitPrice"), 0) AS revenue,
        COALESCE(SUM(soi.quantity), 0)                  AS quantity
      FROM products p
      LEFT JOIN sales_order_items soi ON soi."productId" = p.id
      LEFT JOIN sales_orders so ON so.id = soi."salesOrderId" AND so.status = 'CONFIRMED'
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue DESC
      LIMIT 5
    `
    return rows.map((r) => ({
      name: r.name,
      sku: r.sku,
      revenue: Number(r.revenue),
      quantity: Number(r.quantity),
    }))
  }

  /** Summary KPIs */
  static async getSummary() {
    const thirtyDaysAgo = subMonths(new Date(), 1)
    const sixtyDaysAgo = subMonths(new Date(), 2)

    const [
      totalRevenue,
      prevMonthRevenue,
      totalCosts,
      pendingPOs,
      confirmedSOs,
      lowStock,
    ] = await Promise.all([
      // This month revenue
      prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM(soi.quantity * soi."unitPrice"), 0) as total
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi."salesOrderId"
        WHERE so."orderDate" >= ${thirtyDaysAgo}
          AND so.status = 'CONFIRMED'
      `.then((r) => Number(r[0]?.total ?? 0)),

      // Previous month revenue
      prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM(soi.quantity * soi."unitPrice"), 0) as total
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi."salesOrderId"
        WHERE so."orderDate" >= ${sixtyDaysAgo}
          AND so."orderDate" < ${thirtyDaysAgo}
          AND so.status = 'CONFIRMED'
      `.then((r) => Number(r[0]?.total ?? 0)),

      // This month costs
      prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM(poi.quantity * poi."unitCost"), 0) as total
        FROM purchase_order_items poi
        JOIN purchase_orders po ON po.id = poi."purchaseOrderId"
        WHERE po."orderDate" >= ${thirtyDaysAgo}
          AND po.status != 'CANCELLED'
      `.then((r) => Number(r[0]?.total ?? 0)),

      prisma.purchaseOrder.count({ where: { status: "PENDING" } }),
      prisma.salesOrder.count({ where: { status: "CONFIRMED" } }),
      prisma.$queryRaw<{ count: string }[]>`
        SELECT COUNT(*) as count FROM products WHERE "quantityInStock" <= "reorderLevel"
      `.then((r) => Number(r[0]?.count ?? 0)),
    ])

    const revenueTrend =
      prevMonthRevenue > 0
        ? Math.round(((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
        : 0

    return {
      monthlyRevenue: totalRevenue,
      monthlyCosts: totalCosts,
      grossProfit: totalRevenue - totalCosts,
      revenueTrend,
      pendingPOs,
      confirmedSOs,
      lowStock,
    }
  }
}
