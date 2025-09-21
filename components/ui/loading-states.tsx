"use client"

import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Spinner personalizado
export const Spinner = ({ size = "md", color = "blue" }: { 
  size?: "sm" | "md" | "lg" | "xl"
  color?: "blue" | "green" | "yellow" | "red" | "gray"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }
  
  const colorClasses = {
    blue: "border-blue-600",
    green: "border-green-600", 
    yellow: "border-yellow-600",
    red: "border-red-600",
    gray: "border-gray-600"
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`} />
  )
}

// Loading com mensagem personalizada
export const LoadingMessage = ({ 
  message = "Carregando...",
  submessage,
  icon,
  size = "md",
  color = "blue",
  className = ""
}: {
  message?: string
  submessage?: string
  icon?: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  color?: "blue" | "green" | "yellow" | "red" | "gray"
  className?: string
}) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="flex justify-center mb-4">
        {icon || <Spinner size={size} color={color} />}
      </div>
      <p className="text-gray-700 font-medium">{message}</p>
      {submessage && (
        <p className="text-sm text-gray-500 mt-2">{submessage}</p>
      )}
    </div>
  )
}

// Loading de página completa
export const PageLoading = ({ 
  message = "Carregando dados...",
  submessage,
  connectionStatus,
  onRetry
}: {
  message?: string
  submessage?: string
  connectionStatus?: 'connected' | 'checking' | 'slow' | 'disconnected'
  onRetry?: () => void
}) => {
  const getLoadingConfig = () => {
    switch (connectionStatus) {
      case 'checking':
        return {
          message: 'Verificando conectividade...',
          color: 'blue' as const,
          icon: '🔄'
        }
      case 'slow':
        return {
          message: 'Conexão lenta detectada...',
          submessage: 'O carregamento pode demorar um pouco mais.',
          color: 'yellow' as const,
          icon: '🐌'
        }
      case 'disconnected':
        return {
          message: 'Problemas de conectividade',
          submessage: 'Verificando cache local...',
          color: 'red' as const,
          icon: '📴'
        }
      default:
        return {
          message: message || 'Carregando dados...',
          submessage,
          color: 'blue' as const,
          icon: null
        }
    }
  }

  const config = getLoadingConfig()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card>
          <CardContent className="p-8">
            <LoadingMessage
              message={config.message}
              submessage={config.submessage}
              color={config.color}
              size="lg"
              icon={config.icon ? (
                <div className="text-4xl mb-2">{config.icon}</div>
              ) : undefined}
            />
            
            {connectionStatus === 'disconnected' && onRetry && (
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={onRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading para cards/seções
export const SectionLoading = ({ 
  title,
  rows = 3,
  className = ""
}: {
  title?: string
  rows?: number
  className?: string
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        {title && (
          <div className="mb-4">
            <Skeleton className="h-6 w-32" />
          </div>
        )}
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Loading para tabelas
export const TableLoading = ({ 
  columns = 5,
  rows = 8,
  title,
  className = ""
}: {
  columns?: number
  rows?: number
  title?: string
  className?: string
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        {title && (
          <div className="mb-6">
            <Skeleton className="h-7 w-48" />
          </div>
        )}
        
        {/* Header da tabela */}
        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        
        {/* Linhas da tabela */}
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Loading para formulários
export const FormLoading = ({ 
  fields = 4,
  title,
  className = ""
}: {
  fields?: number
  title?: string
  className?: string
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        {title && (
          <div className="mb-6">
            <Skeleton className="h-7 w-40" />
          </div>
        )}
        
        <div className="space-y-6">
          {[...Array(fields)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          
          <div className="flex justify-end space-x-3 mt-8">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading para dashboard/cards de métricas
export const MetricsLoading = ({ 
  cards = 4,
  className = ""
}: {
  cards?: number
  className?: string
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(cards, 4)} gap-6 ${className}`}>
      {[...Array(cards)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Loading para gráficos
export const ChartLoading = ({ 
  title,
  height = "h-64",
  className = ""
}: {
  title?: string
  height?: string
  className?: string
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        {title && (
          <div className="mb-4">
            <Skeleton className="h-6 w-32" />
          </div>
        )}
        <div className={`bg-gray-100 rounded-lg ${height} flex items-center justify-center`}>
          <div className="text-center">
            <Spinner size="lg" color="gray" />
            <p className="text-gray-500 mt-2 text-sm">Carregando gráfico...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading overlay para modais
export const ModalLoading = ({ 
  message = "Processando...",
  isVisible = true
}: {
  message?: string
  isVisible?: boolean
}) => {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
      <LoadingMessage message={message} size="lg" />
    </div>
  )
}

// Loading para listas/feeds
export const ListLoading = ({ 
  items = 5,
  showAvatar = false,
  className = ""
}: {
  items?: number
  showAvatar?: boolean
  className?: string
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}