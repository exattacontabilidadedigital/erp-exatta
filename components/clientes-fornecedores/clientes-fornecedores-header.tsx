"use client"

import { Users, Plus, ArrowLeft, Upload, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ClientesFornecedoresHeaderProps {
  onNovoClienteFornecedor: () => void
  onImportar?: () => void
  onExportar?: () => void
  onRelatorio?: () => void
}

export function ClientesFornecedoresHeader({
  onNovoClienteFornecedor,
  onImportar,
  onExportar,
  onRelatorio,
}: ClientesFornecedoresHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes e Fornecedores</h1>
              <p className="text-gray-600">Gerencie seus parceiros comerciais</p>
            </div>
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
            <Button onClick={onNovoClienteFornecedor}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente/Fornecedor
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
