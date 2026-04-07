"use client"

import Link from "next/link"
import useSWR from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Plus, Eye } from "lucide-react"
import { format } from "date-fns"

interface PurchaseOrder {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  supplier: { companyName: string }
  createdBy: { name: string }
  items: { quantity: number; unitCost: number }[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PurchaseOrdersPage() {
  const { data, isLoading } = useSWR("/api/purchase-orders", fetcher)

  const orders: PurchaseOrder[] = data?.data || []

  const columns = [
    { header: "Order #", accessor: "orderNumber" as const },
    {
      header: "Supplier",
      accessor: (item: PurchaseOrder) => item.supplier.companyName,
    },
    {
      header: "Date",
      accessor: (item: PurchaseOrder) =>
        format(new Date(item.orderDate), "MMM d, yyyy"),
    },
    {
      header: "Items",
      accessor: (item: PurchaseOrder) => item.items.length,
    },
    {
      header: "Total",
      accessor: (item: PurchaseOrder) => {
        const total = item.items.reduce(
          (sum, i) => sum + i.quantity * Number(i.unitCost),
          0
        )
        return `$${total.toFixed(2)}`
      },
    },
    {
      header: "Status",
      accessor: (item: PurchaseOrder) => <StatusBadge status={item.status} />,
    },
    {
      header: "Created By",
      accessor: (item: PurchaseOrder) => item.createdBy.name,
    },
    {
      header: "Actions",
      accessor: (item: PurchaseOrder) => (
        <Link href={`/purchase-orders/${item.id}`}>
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
      title="Purchase Orders"
      description="Manage orders from suppliers"
      action={
        <Link href="/purchase-orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </Link>
      }
    >
      <DataTable
        columns={columns}
        data={orders}
        loading={isLoading}
        emptyMessage="No purchase orders found. Create your first order."
      />
    </PageWrapper>
  )
}
