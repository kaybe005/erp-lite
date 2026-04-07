import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusStyles: Record<string, string> = {
  // Purchase Order Statuses
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  RECEIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  // Sales Order Statuses
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  // User Statuses
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  // Role
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  STAFF: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusStyles[status] || "bg-gray-100 text-gray-800",
        className
      )}
    >
      {status}
    </span>
  )
}
