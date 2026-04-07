"use client"

import Link from "next/link"
import useSWR from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Plus, Eye } from "lucide-react"
import { format } from "date-fns"

interface SalesOrder {
  id: string
  orderNumber: string
  customerName: string | null
  status: string
  orderDate: string
  createdBy: { name: string }
  items: { quantity: number; unitPrice: number }[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SalesOrdersPage() {
  const { data, isLoading } = useSWR("/api/sales-orders", fetcher)

  const orders: SalesOrder[] = data?.data || []

  const columns = [
    { header: "Order #", accessor: "orderNumber" as const },
    {
      header: "Customer",
      accessor: (item: SalesOrder) => item.customerName || "Walk-in Customer",
    },
    {
      header: "Date",
      accessor: (item: SalesOrder) =>
        format(new Date(item.orderDate), "MMM d, yyyy"),
    },
    {
      header: "Items",
      accessor: (item: SalesOrder) => item.items.length,
    },
    {
      header: "Total",
      accessor: (item: SalesOrder) => {
        const total = item.items.reduce(
          (sum, i) => sum + i.quantity * Number(i.unitPrice),
          0
        )
        return `$${total.toFixed(2)}`
      },
    },
    {
      header: "Status",
      accessor: (item: SalesOrder) => <StatusBadge status={item.status} />,
    },
    {
      header: "Created By",
      accessor: (item: SalesOrder) => item.createdBy.name,
    },
    {
      header: "Actions",
      accessor: (item: SalesOrder) => (
        <Link href={`/sales-orders/${item.id}`}>
          <Button variant="ghost" size="icon">
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      ),
      className: "w-16",
    },
  ]

  return (
    <PageWrapper
      title="Sales Orders"
      description="Manage customer orders"
      action={
        <Link href="/sales-orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </Link>
      }
    >
      <DataTable
        columns={columns}
        data={orders}
        loading={isLoading}
        emptyMessage="No sales orders found. Create your first sale."
      />
    </PageWrapper>
  )
}
