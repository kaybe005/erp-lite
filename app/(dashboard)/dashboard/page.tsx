"use client"

import useSWR from "swr"
import Link from "next/link"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  Truck,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
  Lightbulb,
  ArrowRight,
  TrendingDown,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard", fetcher)
  const { data: lowStockData } = useSWR("/api/products/low-stock", fetcher)

  if (isLoading) {
    return (
      <PageWrapper title="Dashboard" description="Overview of your business">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      </PageWrapper>
    )
  }

  const stats = data?.data
  const lowStockItems = lowStockData?.data ?? []

  // Rule-based inventory insights
  const insights: { message: string; severity: "warning" | "info" | "danger" }[] = []

  if (stats?.lowStockProducts > 0) {
    insights.push({
      message: `${stats.lowStockProducts} product${stats.lowStockProducts > 1 ? "s are" : " is"} below reorder level and ${stats.lowStockProducts > 1 ? "need" : "needs"} restocking.`,
      severity: stats.lowStockProducts > 3 ? "danger" : "warning",
    })
  }

  const noSupplierProducts = lowStockItems.filter(
    (p: { supplierProducts?: unknown[] }) => !p.supplierProducts || (p.supplierProducts as unknown[]).length === 0
  )
  if (noSupplierProducts.length > 0) {
    insights.push({
      message: `${noSupplierProducts.length} low-stock product${noSupplierProducts.length > 1 ? "s have" : " has"} no linked suppliers — you can't reorder ${noSupplierProducts.length > 1 ? "them" : "it"} yet.`,
      severity: "danger",
    })
  }

  if (stats?.totalSuppliers === 0) {
    insights.push({
      message: "No suppliers configured. Add a supplier before creating purchase orders.",
      severity: "warning",
    })
  }

  if (stats?.lowStockProducts === 0 && stats?.totalProducts > 0) {
    insights.push({
      message: "All product stock levels are healthy — no immediate action needed.",
      severity: "info",
    })
  }

  const severityColors = {
    danger: "border-l-destructive bg-destructive/5 dark:bg-destructive/10",
    warning: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
    info: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
  }
  const severityTextColors = {
    danger: "text-destructive",
    warning: "text-amber-700 dark:text-amber-400",
    info: "text-emerald-700 dark:text-emerald-400",
  }

  return (
    <PageWrapper title="Dashboard" description="Overview of your business">
      <div className="space-y-6 page-enter">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={Package}
            color="blue"
          />
          <StatsCard
            title="Total Suppliers"
            value={stats?.totalSuppliers || 0}
            icon={Truck}
            color="purple"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats?.lowStockProducts || 0}
            icon={AlertTriangle}
            alert={stats?.lowStockProducts > 0}
          />
          <StatsCard
            title="Purchase Orders"
            value={stats?.totalPurchaseOrders || 0}
            icon={ShoppingCart}
            color="default"
          />
          <StatsCard
            title="Sales Orders"
            value={stats?.totalSalesOrders || 0}
            icon={ClipboardList}
            color="success"
          />
        </div>

        {/* Inventory Insights */}
        {insights.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-base">Inventory Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${severityColors[insight.severity]}`}
                >
                  {insight.severity === "danger" ? (
                    <TrendingDown className={`w-4 h-4 mt-0.5 shrink-0 ${severityTextColors[insight.severity]}`} />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${severityTextColors[insight.severity]}`} />
                  )}
                  <p className={`text-sm ${severityTextColors[insight.severity]}`}>{insight.message}</p>
                </div>
              ))}
              {stats?.lowStockProducts > 0 && (
                <div className="pt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/reorder" className="gap-1.5">
                      View Reorder List
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders
            title="Recent Purchase Orders"
            orders={stats?.recentPurchaseOrders || []}
            linkPrefix="/purchase-orders"
            emptyMessage="No purchase orders yet"
          />
          <RecentOrders
            title="Recent Sales Orders"
            orders={stats?.recentSalesOrders || []}
            linkPrefix="/sales-orders"
            emptyMessage="No sales orders yet"
          />
        </div>
      </div>
    </PageWrapper>
  )
}
