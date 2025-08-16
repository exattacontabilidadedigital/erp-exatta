"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter, Plus, Upload } from "lucide-react"
import Link from "next/link"

interface LancamentosHeaderProps {
  onNovoLancamento?: () => void
  onToggleFiltros?: () => void
  onImportar?: () => void
  onExportar?: () => void // Adicionando prop para exportação
}

export function LancamentosHeader({
  onNovoLancamento,
  onToggleFiltros,
  onImportar,
  onExportar,
}: LancamentosHeaderProps) {
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
            <h1 className="text-xl font-bold text-gray-900">Lançamentos Contábeis</h1>
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
            <Button variant="outline" size="sm" onClick={onToggleFiltros}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button onClick={onNovoLancamento}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
