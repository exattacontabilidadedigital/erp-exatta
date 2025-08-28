"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ConciliacaoHeader } from "@/components/conciliacao"
import { ConciliacaoModerna } from "@/components/conciliacao/conciliacao-moderna"

function ConciliacaoContent() {
  const { user, userData, empresaData, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estado para período e conta selecionada
  const [periodo, setPeriodo] = useState<{ mes: string, ano: string }>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return { mes: pad(now.getMonth() + 1), ano: now.getFullYear().toString() };
  });
  
  const [contaSelecionada, setContaSelecionada] = useState<{ id: string } | null>(() => {
    const contaId = searchParams.get('conta_id');
    return contaId ? { id: contaId } : null;
  });

  // Estado para lançamentos importados (usado pelo header)
  const [lancamentosImportados, setLancamentosImportados] = useState<Array<{
    id: string;
    data: string;
    valor: number;
    descricao: string;
    origem: string;
    status: "pendente" | "conciliado" | "ignorado";
  }>>([]);

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

  // Converter período para formato de data
  const periodStart = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-01`;
  const lastDay = new Date(Number(periodo.ano), Number(periodo.mes), 0).getDate();
  const periodEnd = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <ConciliacaoHeader
          periodo={periodo}
          setPeriodo={setPeriodo}
          setLancamentosImportados={setLancamentosImportados}
          contaSelecionada={contaSelecionada}
          setContaSelecionada={setContaSelecionada}
        />
        
        {contaSelecionada && (
          <div className="mt-6">
            <ConciliacaoModerna
              bankAccountId={contaSelecionada.id}
              period={{ start: periodStart, end: periodEnd }}
              hideHeader={true}
              hideUpload={true}
            />
          </div>
        )}
        
        {!contaSelecionada && (
          <div className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecione uma conta bancária
              </h3>
              <p className="text-gray-600">
                Escolha uma conta bancária no cabeçalho para iniciar a conciliação
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ConciliacaoBancariaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando conciliação...</p>
        </div>
      </div>
    }>
      <ConciliacaoContent />
    </Suspense>
  )
}
