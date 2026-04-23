"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { format } from "date-fns"

interface OrderItem {
  id: string
  orderNumber: string
  status: string
  orderDate: Date | string
  supplier?: { companyName: string }
  customerName?: string | null
}

interface RecentOrdersProps {
  title: string
  orders: OrderItem[]
  linkPrefix: string
  emptyMessage: string
}

export function RecentOrders({
  title,
  orders,
  linkPrefix,
  emptyMessage,
}: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`${linkPrefix}/${order.id}`}
                className="block p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-border/80 hover:shadow-sm transition-all duration-150 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.supplier?.companyName || order.customerName || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(order.orderDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
