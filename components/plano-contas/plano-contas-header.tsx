"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Upload, FileText, Plus } from "lucide-react"
import Link from "next/link"

interface PlanoContasHeaderProps {
  onNovaConta: () => void
  onImportar?: () => void
  onExportar?: () => void
  onRelatorio?: () => void
}

export function PlanoContasHeader({ onNovaConta, onImportar, onExportar, onRelatorio }: PlanoContasHeaderProps) {
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
            <h1 className="text-xl font-bold text-gray-900">Plano de Contas</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onNovaConta}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
            {onImportar && (
              <Button variant="outline" size="sm" onClick={onImportar}>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            )}
            {onExportar && (
              <Button variant="outline" size="sm" onClick={onExportar}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
            {onRelatorio && (
              <Button variant="outline" size="sm" onClick={onRelatorio}>
                <FileText className="w-4 h-4 mr-2" />
                Relatório
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
