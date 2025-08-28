"use client"

import { FinancialSummary } from "@/components/dashboard/financial-summary"
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, userData, empresaData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da empresa...</p>
        </div>
      </div>
    )
  }

  if (!user || !userData || !empresaData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {empresaData.nome_fantasia || empresaData.razao_social}
              </h1>
              <p className="text-gray-600">
                CNPJ: {empresaData.cnpj} • {empresaData.cidade}, {empresaData.estado}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Bem-vindo,</p>
              <p className="font-semibold text-gray-900">{userData.nome}</p>
              <p className="text-sm text-gray-600 capitalize">{userData.role}</p>
            </div>
          </div>
        </div>


        {/* Busca e Novo Lançamento acima dos cards */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Buscar transações..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              // Adicione lógica de busca conforme necessário
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
            </span>
          </div>
          <a href="/lancamentos" className="w-full md:w-auto">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center w-full md:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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
  )
}
