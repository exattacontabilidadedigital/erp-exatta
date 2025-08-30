"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Upload, FileText, FolderSyncIcon as Sync, Plus } from "lucide-react"
import Link from "next/link"

interface ContasHeaderProps {
  onNovaConta?: () => void
  onImportarExtrato?: () => void
  onExportar?: () => void
}

export function ContasHeader({ onNovaConta, onImportarExtrato, onExportar }: ContasHeaderProps) {
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
            <h1 className="text-xl font-bold text-gray-900">Gestão de Contas Bancárias</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onImportarExtrato}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Conta
            </Button>
            <Button variant="outline" size="sm" onClick={onExportar}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Link href="/conciliacao">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Conciliação
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Sync className="w-4 h-4 mr-2" />
              Sincronizar
            </Button>
            <Button onClick={onNovaConta}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
