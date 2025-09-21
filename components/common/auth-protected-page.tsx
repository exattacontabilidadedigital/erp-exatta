"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface AuthProtectedPageProps {
  children: ReactNode
  /** Página para redirecionar se não há empresa configurada */
  redirectTo?: string
  /** Mensagem customizada quando empresa não está configurada */
  noCompanyMessage?: string
  /** Se deve mostrar loading durante autenticação */
  showLoading?: boolean
}

export function AuthProtectedPage({
  children,
  redirectTo = '/empresa',
  noCompanyMessage = 'Configure sua empresa antes de continuar.',
  showLoading = true
}: AuthProtectedPageProps) {
  const { userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false)

  useEffect(() => {
    // Marcar que já verificamos pelo menos uma vez
    if (!authLoading) {
      setHasCheckedOnce(true)
    }
  }, [authLoading])

  // Se já verificou uma vez e tem dados, não mostrar loading novamente
  if (hasCheckedOnce && userData?.empresa_id) {
    return <>{children}</>
  }

  // Loading de autenticação apenas na primeira verificação
  if (authLoading && showLoading && !hasCheckedOnce) {
    console.log('🔐 Verificando autenticação...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da empresa...</p>
        </div>
      </div>
    )
  }

  // Não tem empresa configurada
  if (!userData?.empresa_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="rounded-full h-16 w-16 border-2 border-yellow-600 mx-auto mb-4 flex items-center justify-center">
            <span className="text-yellow-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Empresa não configurada
          </h2>
          <p className="text-gray-600 mb-6">
            {noCompanyMessage}
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => router.push(redirectTo)} 
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configurar Empresa
            </button>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Renderiza o conteúdo protegido
  return <>{children}</>
}

// Hook customizado para verificar se empresa está configurada
export function useCompanyAuth() {
  const { userData, loading } = useAuth()
  
  return {
    hasCompany: !!userData?.empresa_id,
    companyId: userData?.empresa_id,
    isLoading: loading,
    userData
  }
}

// HOC para proteger páginas
export function withCompanyAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthProtectedPageProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthProtectedPage {...options}>
        <Component {...props} />
      </AuthProtectedPage>
    )
  }
}