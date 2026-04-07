import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  alert?: boolean
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  alert,
}: StatsCardProps) {
  return (
    <Card className={cn(alert && "border-destructive")}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold mt-1", alert && "text-destructive")}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-lg",
              alert ? "bg-destructive/10" : "bg-primary/10"
            )}
          >
            <Icon
              className={cn(
                "w-6 h-6",
                alert ? "text-destructive" : "text-primary"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
