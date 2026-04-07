"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR, { mutate } from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Supplier {
  id: string
  companyName: string
  contactName: string
  email: string | null
  phone: string | null
  address: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SuppliersPage() {
  const { data, isLoading } = useSWR("/api/suppliers", fetcher)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const suppliers: Supplier[] = data?.data || []

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/suppliers/${deleteId}`, { method: "DELETE" })
      const result = await res.json()

      if (result.success) {
        toast.success("Supplier deleted successfully")
        mutate("/api/suppliers")
      } else {
        toast.error(result.error || "Failed to delete supplier")
      }
    } catch {
      toast.error("Failed to delete supplier")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const columns = [
    { header: "Company Name", accessor: "companyName" as const },
    { header: "Contact Name", accessor: "contactName" as const },
    {
      header: "Email",
      accessor: (item: Supplier) => item.email || "-",
    },
    {
      header: "Phone",
      accessor: (item: Supplier) => item.phone || "-",
    },
    {
      header: "Actions",
      accessor: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <Link href={`/suppliers/${item.id}/edit`}>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteId(item.id)
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ]

  return (
    <PageWrapper
      title="Suppliers"
      description="Manage your suppliers and vendors"
      action={
        <Link href="/suppliers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </Link>
      }
    >
      <DataTable
        columns={columns}
        data={suppliers}
        loading={isLoading}
        emptyMessage="No suppliers found. Add your first supplier."
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplier? This action cannot
              be undone. Suppliers with existing purchase orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}
