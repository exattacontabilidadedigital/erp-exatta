"use client"

import { useState } from "react"
import { RelatoriosHeader } from "@/components/relatorios/relatorios-header"
import { RelatoriosFiltros } from "@/components/relatorios/relatorios-filtros"
import { RelatoriosList } from "@/components/relatorios/relatorios-list"
import { RelatoriosVisualizacao } from "@/components/relatorios/relatorios-visualizacao"
import Header from "@/components/ui/header"

export default function RelatoriosPage() {
  const [relatorioSelecionado, setRelatorioSelecionado] = useState("balancete")

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      <RelatoriosHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <RelatoriosFiltros />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de Relatórios */}
          <div className="lg:col-span-1">
            <RelatoriosList relatorioSelecionado={relatorioSelecionado} onRelatorioSelect={setRelatorioSelecionado} />
          </div>

          {/* Visualização do Relatório */}
          <div className="lg:col-span-3">
            <RelatoriosVisualizacao relatorioSelecionado={relatorioSelecionado} />
          </div>
        </div>
      </main>
      </div>
    </>
  )
}
