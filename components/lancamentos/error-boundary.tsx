"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ops! Algo deu errado</AlertTitle>
            <AlertDescription className="mt-2">
              Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte se o problema persistir.
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button onClick={() => window.location.reload()} size="sm">
                Recarregar Página
              </Button>
            </div>
          </Alert>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-gray-100 rounded">
              <summary className="cursor-pointer font-medium">Detalhes do Erro (Desenvolvimento)</summary>
              <pre className="mt-2 text-sm overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
