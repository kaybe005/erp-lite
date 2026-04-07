"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { format } from "date-fns"
import { UserForm } from "@/components/users/user-form"

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "STAFF"
  isActive: boolean
  createdAt: string
}

interface UsersPageClientProps {
  currentUserId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function UsersPageClient({ currentUserId }: UsersPageClientProps) {
  const { data, isLoading } = useSWR("/api/users", fetcher)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const users: User[] = data?.data || []

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: "DELETE" })
      const result = await res.json()

      if (result.success) {
        toast.success("User deleted successfully")
        mutate("/api/users")
      } else {
        toast.error(result.error || "Failed to delete user")
      }
    } catch {
      toast.error("Failed to delete user")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const columns = [
    { header: "Name", accessor: "name" as const },
    { header: "Email", accessor: "email" as const },
    {
      header: "Role",
      accessor: (item: User) => <StatusBadge status={item.role} />,
    },
    {
      header: "Status",
      accessor: (item: User) => (
        <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      header: "Created",
      accessor: (item: User) => format(new Date(item.createdAt), "MMM d, yyyy"),
    },
    {
      header: "Actions",
      accessor: (item: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setEditUser(item)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {item.id !== currentUserId && (
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
          )}
        </div>
      ),
      className: "w-24",
    },
  ]

  return (
    <PageWrapper
      title="User Management"
      description="Manage users and their roles"
      action={
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm onSuccess={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        emptyMessage="No users found."
      />

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserForm user={editUser} onSuccess={() => setEditUser(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone. Users with existing orders cannot be deleted.
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
