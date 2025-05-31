
import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Target, CheckCircle, AlertCircle } from "lucide-react"

interface PracticeCardProps {
  title: string
  description: string
  level?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  estimatedTime?: number
  priority?: 'high' | 'normal' | 'low'
  completed?: boolean
  score?: number
  recommended?: boolean
  reason?: string
  onAction: () => void
  actionLabel?: string
  variant?: 'default' | 'ai' | 'topic' | 'completed'
  className?: string
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'bg-green-100 text-green-700 border-green-200'
    case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'Hard': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'normal': return <Target className="h-4 w-4 text-blue-500" />
    case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
    default: return <Target className="h-4 w-4 text-gray-500" />
  }
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'ai':
      return 'border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg'
    case 'topic':
      return 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md'
    case 'completed':
      return 'border-green-200 bg-gradient-to-br from-green-50 to-white'
    default:
      return 'border-gray-200 bg-white hover:shadow-md'
  }
}

const PracticeCard = React.forwardRef<HTMLDivElement, PracticeCardProps>(
  ({ 
    title, 
    description, 
    level, 
    difficulty, 
    estimatedTime, 
    priority, 
    completed, 
    score, 
    recommended, 
    reason,
    onAction, 
    actionLabel = "Start Practice",
    variant = "default",
    className,
    ...props 
  }, ref) => {
    return (
      <Card 
        ref={ref} 
        className={cn(
          "transition-all duration-200",
          getVariantStyles(variant),
          className
        )}
        {...props}
      >
        <CardHeader className="p-6 pb-3">
          <div className="flex items-center justify-between mb-2">
            {level && (
              <Badge variant="secondary" className="bg-white/80 text-gray-700 border">
                {level}
              </Badge>
            )}
            <div className="flex items-center space-x-2">
              {priority && getPriorityIcon(priority)}
              {difficulty && (
                <Badge className={getDifficultyColor(difficulty)}>
                  {difficulty}
                </Badge>
              )}
              {completed && score !== undefined && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {score}%
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-gray-600 leading-relaxed">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="p-6 pt-0 space-y-4">
          {reason && (
            <div className="text-xs bg-blue-50 text-blue-600 p-3 rounded-lg border border-blue-100">
              {reason}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {estimatedTime && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {estimatedTime} minutes
              </div>
            )}
            
            <Button 
              onClick={onAction}
              size="sm"
              className={cn(
                "ml-auto",
                variant === 'ai' && "bg-purple-600 hover:bg-purple-700",
                variant === 'topic' && priority === 'high' && "bg-red-600 hover:bg-red-700",
                completed && "hover:bg-green-50 border-green-200"
              )}
              variant={completed ? "outline" : "default"}
            >
              {actionLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
)

PracticeCard.displayName = "PracticeCard"

export { PracticeCard }
