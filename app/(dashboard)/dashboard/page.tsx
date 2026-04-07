"use client"

import useSWR from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { Spinner } from "@/components/ui/spinner"
import {
  Package,
  Truck,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard", fetcher)

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

  return (
    <PageWrapper title="Dashboard" description="Overview of your business">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
        />
        <StatsCard
          title="Total Suppliers"
          value={stats?.totalSuppliers || 0}
          icon={Truck}
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
        />
        <StatsCard
          title="Sales Orders"
          value={stats?.totalSalesOrders || 0}
          icon={ClipboardList}
        />
      </div>

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
    </PageWrapper>
  )
}
