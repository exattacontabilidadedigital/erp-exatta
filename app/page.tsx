"use client"

import { FinancialSummary } from "@/components/dashboard/financial-summary"
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLoadingWrapper } from "@/components/common/page-loading-wrapper"
import { useToast } from "@/contexts/toast-context"

export default function DashboardPage() {
  const { user, userData, empresaData, loading, connectionStatus } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Função para carregar dados do dashboard
  const loadDashboardData = async () => {
    // Simular carregamento de dados do dashboard
    // Aqui você faria as chamadas reais para APIs
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simula delay

    const dashboardInfo = {
      financialSummary: {
        saldoTotal: 125430.50,
        receitasMes: 45230.00,
        despesasMes: 32180.00,
        lucroLiquido: 13050.00
      },
      transactions: [],
      alerts: [],
      charts: {}
    }

    setDashboardData(dashboardInfo)
    return dashboardInfo
  }

  const handleLoadError = (error: any) => {
    toast({
      title: "Erro ao carregar dashboard",
      description: error.message || "Erro desconhecido",
      variant: "destructive"
    })
  }

  // Loading progressivo - só mostra loading se não tem dados básicos
  if (loading && (!userData || !empresaData)) {
    const getLoadingMessage = () => {
      switch (connectionStatus) {
        case 'checking':
          return 'Verificando conectividade...'
        case 'slow':
          return 'Conexão lenta detectada - carregando...'
        case 'disconnected':
          return 'Problemas de conectividade - tentando novamente...'
        default:
          return 'Carregando dados da empresa...'
      }
    }

    const getLoadingColor = () => {
      switch (connectionStatus) {
        case 'slow':
          return 'border-yellow-600'
        case 'disconnected':
          return 'border-red-600'
        default:
          return 'border-blue-600'
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${getLoadingColor()}`}></div>
          <p className="text-gray-600">{getLoadingMessage()}</p>
          {connectionStatus === 'slow' && (
            <p className="text-sm text-yellow-600 mt-2">
              Sua conexão está lenta. O sistema pode demorar um pouco mais para carregar.
            </p>
          )}
          {connectionStatus === 'disconnected' && (
            <p className="text-sm text-red-600 mt-2">
              Problemas de conectividade detectados. Verificando cache local...
            </p>
          )}
        </div>
      </div>
    )
  }

  // Se não tem usuário ou dados, mas não está carregando, mostrar estado offline
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-2 border-red-600 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-xl">📴</span>
          </div>
          <p className="text-gray-600">Sistema em modo offline</p>
          <p className="text-sm text-red-600 mt-2">
            Não foi possível conectar com o servidor. Verifique sua conexão.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!user || !userData) {
    return null
  }

  // Se tem usuário mas não tem empresa (modo degradado)
  const isModoDegradado = userData && !empresaData

  return (
    <DashboardLoadingWrapper
      pageKey="dashboard-principal"
      loadData={loadDashboardData}
      pageTitle="Dashboard"
      onError={handleLoadError}
      loadingProps={{
        metrics: { cards: 4 },
        table: { columns: 5, rows: 6 }
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isModoDegradado ? (
                    <span className="flex items-center gap-2">
                      Sistema ERP <span className="text-yellow-600 text-sm">(Modo Offline)</span>
                    </span>
                  ) : (
                    empresaData?.nome_fantasia || empresaData?.razao_social || 'Empresa'
                  )}
                </h1>
                <p className="text-gray-600">
                  {isModoDegradado ? (
                    'Dados da empresa indisponíveis - modo offline'
                  ) : (
                    `CNPJ: ${empresaData?.cnpj || 'N/A'} • ${empresaData?.cidade || 'N/A'}, ${empresaData?.estado || 'N/A'}`
                  )}
                </p>
                {connectionStatus === 'disconnected' && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ Conexão perdida - dados podem estar desatualizados
                  </p>
                )}
                {connectionStatus === 'slow' && (
                  <p className="text-sm text-yellow-600 mt-1">
                    🐌 Conexão lenta - alguns recursos podem ser limitados
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Bem-vindo,</p>
                <p className="font-semibold text-gray-900">{userData.nome}</p>
                <p className="text-sm text-gray-600 capitalize">{userData.role}</p>
                {connectionStatus !== 'connected' && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      connectionStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
                      connectionStatus === 'slow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {connectionStatus === 'disconnected' ? '📴 Offline' :
                       connectionStatus === 'slow' ? '🐌 Lento' :
                       '🔄 Verificando'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Busca e Novo Lançamento */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                placeholder="Buscar transações..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
            </div>
            <a href="/lancamentos" className="w-full md:w-auto">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center w-full md:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Lançamento
              </button>
            </a>
          </div>

          {/* Resumo Financeiro */}
          <FinancialSummary />

          {/* Gráficos e Alertas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CashFlowChart />
            </div>
            <div>
              <AlertsPanel />
            </div>
          </div>

          {/* Transações Recentes */}
          <RecentTransactions />
        </main>
      </div>
    </DashboardLoadingWrapper>
  )
}