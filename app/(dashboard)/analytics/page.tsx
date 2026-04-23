"use client"

import useSWR from "swr"
import { useTheme } from "next-themes"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  Package,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCurrency(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value.toFixed(0)}`
}

const SKELETON_HEIGHTS = [55, 80, 65, 90, 45, 70]

function ChartSkeleton() {
  return (
    <div className="h-64 flex items-end gap-2 px-4 pb-4">
      {SKELETON_HEIGHTS.map((h, i) => (
        <Skeleton key={i} className="flex-1 shimmer" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

type ChartColors = typeof CHART_COLORS.light

// Custom tooltip — uses explicit color values so it renders correctly in both themes
function CustomTooltip({ active, payload, label, colors }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  colors?: ChartColors
}) {
  if (!active || !payload?.length) return null
  const bg = colors?.tooltip ?? "#fff"
  const border = colors?.tooltipBorder ?? "#e5e7eb"
  const text = colors?.tooltipText ?? "#111827"
  const muted = colors?.tooltipMuted ?? "#6b7280"
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, color: text }}
      className="rounded-lg p-3 shadow-lg text-sm">
      <p style={{ color: text }} className="font-semibold mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: muted }} className="capitalize">{entry.name}:</span>
          <span style={{ color: text }} className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// Theme-aware chart colors — recharts reads these as SVG attributes,
// so CSS custom properties don't work; we pass resolved hex values instead.
const CHART_COLORS = {
  light: {
    revenue: "#10b981",   // emerald-500
    costs:   "#f59e0b",   // amber-500
    profit:  "#6366f1",   // indigo-500
    bar:     "#3b82f6",   // blue-500
    grid:    "#e5e7eb",   // gray-200
    axis:    "#9ca3af",   // gray-400
    tooltip: "#ffffff",
    tooltipBorder: "#e5e7eb",
    tooltipText: "#111827",
    tooltipMuted: "#6b7280",
  },
  dark: {
    revenue: "#34d399",   // emerald-400
    costs:   "#fbbf24",   // amber-400
    profit:  "#818cf8",   // indigo-400
    bar:     "#60a5fa",   // blue-400
    grid:    "#374151",   // gray-700
    axis:    "#6b7280",   // gray-500
    tooltip: "#1f2937",
    tooltipBorder: "#374151",
    tooltipText: "#f9fafb",
    tooltipMuted: "#9ca3af",
  },
}

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme()
  const C = resolvedTheme === "dark" ? CHART_COLORS.dark : CHART_COLORS.light

  const { data, isLoading } = useSWR("/api/analytics", fetcher)
  const analytics = data?.data

  const summary = analytics?.summary
  const trend = analytics?.trend ?? []
  const topProducts = analytics?.topProducts ?? []

  return (
    <PageWrapper title="Analytics" description="Revenue, costs & inventory insights">
      <div className="space-y-6 page-enter">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 shimmer" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatsCard
                title="Revenue (30d)"
                value={formatCurrency(summary?.monthlyRevenue ?? 0)}
                icon={DollarSign}
                color="success"
                trend={summary?.revenueTrend != null ? {
                  value: Math.abs(summary.revenueTrend),
                  isPositive: summary.revenueTrend >= 0,
                  label: "vs last month"
                } : undefined}
              />
              <StatsCard
                title="Costs (30d)"
                value={formatCurrency(summary?.monthlyCosts ?? 0)}
                icon={TrendingUp}
                color="warning"
              />
              <StatsCard
                title="Gross Profit (30d)"
                value={formatCurrency(summary?.grossProfit ?? 0)}
                icon={DollarSign}
                color={(summary?.grossProfit ?? 0) >= 0 ? "blue" : "danger"}
              />
              <StatsCard
                title="Low Stock Items"
                value={summary?.lowStock ?? 0}
                icon={AlertTriangle}
                alert={(summary?.lowStock ?? 0) > 0}
              />
            </>
          )}
        </div>

        {/* Revenue vs Costs Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Costs</CardTitle>
            <CardDescription>Last 6 months — confirmed sales and purchase orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : trend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No order data yet. Create some sales and purchase orders to see trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.revenue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.revenue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.costs} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.costs} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.profit} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.profit} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: C.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: C.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCurrency}
                    width={56}
                  />
                  <Tooltip content={<CustomTooltip colors={C} />} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                    formatter={(value) => (
                      <span style={{ color: C.tooltipText, textTransform: "capitalize" }}>{value}</span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={C.revenue}
                    strokeWidth={2}
                    fill="url(#gradRevenue)"
                    dot={{ r: 3, fill: C.revenue, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="costs"
                    stroke={C.costs}
                    strokeWidth={2}
                    fill="url(#gradCosts)"
                    dot={{ r: 3, fill: C.costs, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={C.profit}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    fill="url(#gradProfit)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>All-time, confirmed sales orders</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton />
              ) : topProducts.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No sales data yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const max = Math.max(...topProducts.map((p: { revenue: number }) => p.revenue), 1)
                    return topProducts.map((product: { name: string; sku: string; revenue: number; quantity: number }, i: number) => (
                      <div key={product.sku} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-semibold tabular-nums w-4 text-muted-foreground shrink-0">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate leading-tight">{product.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-semibold tabular-nums">{formatCurrency(product.revenue)}</p>
                            <p className="text-xs text-muted-foreground">{product.quantity} units</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${(product.revenue / max) * 100}%`,
                              background: C.bar,
                              opacity: 1 - i * 0.12,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Counts */}
          <Card>
            <CardHeader>
              <CardTitle>Order Overview</CardTitle>
              <CardDescription>Current status snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 shimmer rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <ShoppingCart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pending Purchase Orders</p>
                        <p className="text-xs text-muted-foreground">Awaiting receipt</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{summary?.pendingPOs ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Confirmed Sales Orders</p>
                        <p className="text-xs text-muted-foreground">Active orders</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{summary?.confirmedSOs ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${(summary?.lowStock ?? 0) > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
                        <Package className={`w-4 h-4 ${(summary?.lowStock ?? 0) > 0 ? "text-destructive" : "text-primary"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Products Below Reorder Level</p>
                        <p className="text-xs text-muted-foreground">
                          {(summary?.lowStock ?? 0) > 0 ? "Reorder recommended" : "All levels healthy"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${(summary?.lowStock ?? 0) > 0 ? "text-destructive" : ""}`}>
                      {summary?.lowStock ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
