"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter, Plus, Upload } from "lucide-react"
import Link from "next/link"
import { LancamentosColumnsConfig, type ColumnConfig } from "./lancamentos-columns-config"
import { ExportDropdown } from "./export-dropdown"

interface LancamentosHeaderProps {
  onNovoLancamento?: () => void
  onToggleFiltros?: () => void
  onImportar?: () => void
  onExportar?: () => void
  onExportCSV?: () => void
  onExportExcel?: () => void
  onExportJSON?: () => void
  showFiltros?: boolean
  filtrosAtivos?: boolean
  columns?: ColumnConfig[]
  onColumnsChange?: (columns: ColumnConfig[]) => void
  totalLancamentos?: number
}

export function LancamentosHeader({
  onNovoLancamento,
  onToggleFiltros,
  onImportar,
  onExportar,
  onExportCSV,
  onExportExcel,
  onExportJSON,
  showFiltros = false,
  filtrosAtivos = false,
  columns,
  onColumnsChange,
  totalLancamentos = 0,
}: LancamentosHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              <span className="hidden sm:inline">Lançamentos Contábeis</span>
              <span className="sm:hidden">Lançamentos</span>
            </h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="outline" size="sm" onClick={onImportar} className="hidden sm:flex">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm" onClick={onImportar} className="sm:hidden">
              <Upload className="w-4 h-4" />
            </Button>
            
            {/* Dropdown de exportação melhorado */}
            <ExportDropdown
              onExportCSV={onExportCSV || onExportar}
              onExportExcel={onExportExcel || onExportar}
              onExportJSON={onExportJSON || onExportar}
              disabled={totalLancamentos === 0}
            />
            
            {/* Botão simples para mobile */}
            <Button variant="outline" size="sm" onClick={onExportar} className="sm:hidden">
              <Download className="w-4 h-4" />
            </Button>
            
            {columns && onColumnsChange && (
              <LancamentosColumnsConfig 
                columns={columns} 
                onColumnsChange={onColumnsChange} 
              />
            )}
            
            <Button 
              variant={showFiltros ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleFiltros}
              className={`${filtrosAtivos ? "bg-blue-500 hover:bg-blue-600 text-white" : ""} hidden sm:flex`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {filtrosAtivos && (
                <span className="ml-1 bg-white text-blue-500 rounded-full px-1 text-xs">●</span>
              )}
            </Button>
            <Button 
              variant={showFiltros ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleFiltros}
              className={`${filtrosAtivos ? "bg-blue-500 hover:bg-blue-600 text-white" : ""} sm:hidden`}
            >
              <Filter className="w-4 h-4" />
              {filtrosAtivos && (
                <span className="ml-1 bg-white text-blue-500 rounded-full px-1 text-xs">●</span>
              )}
            </Button>
            
            <Button onClick={onNovoLancamento} className="hidden sm:flex">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
            <Button onClick={onNovoLancamento} className="sm:hidden">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
