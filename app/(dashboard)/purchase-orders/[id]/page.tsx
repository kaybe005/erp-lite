"use client"

import { use } from "react"
import Link from "next/link"
import useSWR, { mutate } from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading } = useSWR(`/api/purchase-orders/${id}`, fetcher)
  const [updating, setUpdating] = useState(false)

  async function updateStatus(status: "RECEIVED" | "CANCELLED") {
    setUpdating(true)
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const result = await res.json()

      if (result.success) {
        toast.success(
          status === "RECEIVED"
            ? "Order marked as received. Stock has been updated."
            : "Order cancelled"
        )
        mutate(`/api/purchase-orders/${id}`)
        mutate("/api/purchase-orders")
        mutate("/api/products")
        mutate("/api/dashboard")
      } else {
        toast.error(result.error || "Failed to update order")
      }
    } catch {
      toast.error("Failed to update order")
    } finally {
      setUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <PageWrapper title="Purchase Order">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      </PageWrapper>
    )
  }

  const order = data?.data

  if (!order) {
    return (
      <PageWrapper title="Purchase Order">
        <div className="text-center text-muted-foreground">Order not found</div>
      </PageWrapper>
    )
  }

  const total = order.items.reduce(
    (sum: number, item: { quantity: number; unitCost: number }) =>
      sum + item.quantity * Number(item.unitCost),
    0
  )

  return (
    <PageWrapper
      title={`Purchase Order ${order.orderNumber}`}
      description={`Order from ${order.supplier.companyName}`}
    >
      <Link href="/purchase-orders">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map(
                    (item: {
                      id: string
                      product: { name: string; sku: string }
                      quantity: number
                      unitCost: number
                    }) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.product.sku}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(item.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.quantity * Number(item.unitCost)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4 pt-4 border-t border-border">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={order.status} className="mt-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {format(new Date(order.orderDate), "MMMM d, yyyy")}
                </p>
              </div>
              {order.receivedDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Received Date</p>
                  <p className="font-medium">
                    {format(new Date(order.receivedDate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{order.createdBy.name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{order.supplier.companyName}</p>
            </CardContent>
          </Card>

          {order.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={updating}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Received
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Receive Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the order as received and add the items
                        to your inventory. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => updateStatus("RECEIVED")}
                      >
                        Confirm Receipt
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={updating}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this order? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Go Back</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => updateStatus("CANCELLED")}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
