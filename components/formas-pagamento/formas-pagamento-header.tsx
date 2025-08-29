"use client"

import { Plus, ArrowLeft, Upload, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface FormasPagamentoHeaderProps {
  onNovaFormaPagamento: () => void
  onImportar: () => void
  onExportar: () => void
  onRelatorio: () => void
}

export function FormasPagamentoHeader({
  onNovaFormaPagamento,
  onImportar,
  onExportar,
  onRelatorio,
}: FormasPagamentoHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Formas de Pagamento</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onImportar}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm" onClick={onExportar}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={onRelatorio}>
              <FileText className="w-4 h-4 mr-2" />
              Relatório
            </Button>
            <Button onClick={onNovaFormaPagamento}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Forma de Pagamento
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
