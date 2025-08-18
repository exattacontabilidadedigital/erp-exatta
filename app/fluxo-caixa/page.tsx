import { FluxoCaixaHeader } from "@/components/fluxo-caixa/fluxo-caixa-header"
import { FluxoCaixaResumo } from "@/components/fluxo-caixa/fluxo-caixa-resumo"
import { FluxoCaixaChart } from "@/components/fluxo-caixa/fluxo-caixa-chart"
import { FluxoCaixaProjecao } from "@/components/fluxo-caixa/fluxo-caixa-projecao"
import { FluxoCaixaExtrato } from "@/components/fluxo-caixa/fluxo-caixa-extrato"
import { FluxoCaixaAlertas } from "@/components/fluxo-caixa/fluxo-caixa-alertas"
import Header from "@/components/ui/header"

export default function FluxoCaixaPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      <FluxoCaixaHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Resumo do Fluxo de Caixa */}
        <FluxoCaixaResumo />

        {/* Gráfico e Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FluxoCaixaChart />
          </div>
          <div>
            <FluxoCaixaAlertas />
          </div>
        </div>

        {/* Projeção e Extrato */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FluxoCaixaProjecao />
          <FluxoCaixaExtrato />
        </div>
      </main>
      </div>
    </>
  )
}
