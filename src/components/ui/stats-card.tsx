
import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  variant?: 'blue' | 'red' | 'green' | 'purple' | 'gray'
  className?: string
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'blue':
      return {
        container: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
        icon: 'text-blue-600',
        value: 'text-blue-800',
        title: 'text-blue-600'
      }
    case 'red':
      return {
        container: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
        icon: 'text-red-600',
        value: 'text-red-800',
        title: 'text-red-600'
      }
    case 'green':
      return {
        container: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
        icon: 'text-green-600',
        value: 'text-green-800',
        title: 'text-green-600'
      }
    case 'purple':
      return {
        container: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
        icon: 'text-purple-600',
        value: 'text-purple-800',
        title: 'text-purple-600'
      }
    default:
      return {
        container: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
        icon: 'text-gray-600',
        value: 'text-gray-800',
        title: 'text-gray-600'
      }
  }
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, icon: Icon, variant = "gray", className, ...props }, ref) => {
    const styles = getVariantStyles(variant)
    
    return (
      <Card 
        ref={ref} 
        className={cn(styles.container, className)}
        {...props}
      >
        <CardContent className="flex items-center p-6">
          <Icon className={cn("h-8 w-8 mr-3", styles.icon)} />
          <div>
            <div className={cn("text-2xl font-bold", styles.value)}>{value}</div>
            <div className={cn("text-sm", styles.title)}>{title}</div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

StatsCard.displayName = "StatsCard"

export { StatsCard }
