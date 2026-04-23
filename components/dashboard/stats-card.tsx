import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  alert?: boolean
  color?: "default" | "success" | "warning" | "danger" | "blue" | "purple"
}

const colorMap = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  purple: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  alert,
  color = "default",
}: StatsCardProps) {
  const iconColorClass = alert ? colorMap.danger : colorMap[color]

  return (
    <Card className={cn(
      "card-hover overflow-hidden",
      alert && "border-destructive/50"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 truncate">
              {title}
            </p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              alert && "text-destructive"
            )}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
                {trend.label && <span className="text-muted-foreground font-normal">{trend.label}</span>}
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl shrink-0", iconColorClass)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
