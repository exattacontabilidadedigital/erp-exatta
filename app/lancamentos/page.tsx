"use client"

import { useState, useCallback, useMemo, Suspense, lazy } from "react"
import { LancamentosHeader } from "@/components/lancamentos/lancamentos-header"
import { useColumnsConfig } from "@/hooks/use-columns-config"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/contexts/toast-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { DataExporter, LancamentosExportColumns } from "@/lib/export-utils"

// Lazy loading dos componentes pesados
const LancamentosList = lazy(() => import("@/components/lancamentos/lancamentos-list").then(m => ({ default: m.LancamentosList })))
const LancamentosModal = lazy(() => import("@/components/lancamentos/lancamentos-modal").then(m => ({ default: m.LancamentosModal })))
const LancamentosFiltros = lazy(() => import("@/components/lancamentos/lancamentos-filtros").then(m => ({ default: m.LancamentosFiltros })))
const LancamentosImportModal = lazy(() => import("@/components/lancamentos/lancamentos-import-modal").then(m => ({ default: m.LancamentosImportModal })))
const LancamentosViewModal = lazy(() => import("@/components/lancamentos/lancamentos-view-modal").then(m => ({ default: m.LancamentosViewModal })))
const LancamentosDeleteModal = lazy(() => import("@/components/lancamentos/lancamentos-delete-modal").then(m => ({ default: m.LancamentosDeleteModal })))

// Loading skeletons
const ListSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const FiltrosSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

export default function LancamentosPage() {
  const { toast } = useToast()
  const { columns, updateColumns } = useColumnsConfig()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshLancamentos, setRefreshLancamentos] = useState(0)
  const [showFiltros, setShowFiltros] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLancamento, setSelectedLancamento] = useState<any>(null)
  const [lancamentosData, setLancamentosData] = useState<any[]>([])
  const [filtrosData, setFiltrosData] = useState<any>({})
  const [periodFilter, setPeriodFilter] = useState<{
    startDate: Date | null
    endDate: Date | null
    periodKey: string | null
  }>({
    startDate: null,
    endDate: null,
    periodKey: null
  })

  const handleNovoLancamento = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setRefreshLancamentos((prev) => prev + 1)
  }

  const handleToggleFiltros = () => {
    setShowFiltros(!showFiltros)
  }

  const handleFilterChange = (filtros: any) => {
    setFiltrosData(filtros)
  }

  const handlePeriodChange = useCallback((period: { startDate: Date | null; endDate: Date | null; periodKey: string | null }) => {
    setPeriodFilter(period)
    setRefreshLancamentos((prev) => prev + 1) // Atualizar listagem com novo período
  }, [])

  // Verificar se há filtros ativos (incluindo período)
  const filtrosAtivos = (filtrosData && Object.values(filtrosData).some((value: any) => 
    value !== "" && value !== null && value !== undefined && value !== "all"
  )) || periodFilter.periodKey !== null

  const handleLancamentosDataChange = (data: any[]) => {
    setLancamentosData(data)
  }

  const handleImportar = () => {
    setIsImportModalOpen(true)
  }

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false)
  }

  const handleImportComplete = () => {
    setRefreshLancamentos((prev) => prev + 1)
    setIsImportModalOpen(false)
  }

  const handleVisualizar = (lancamento: any) => {
    setSelectedLancamento(lancamento)
    setIsViewModalOpen(true)
  }

  const handleEditar = (lancamento: any) => {
    setSelectedLancamento(lancamento)
    setIsEditModalOpen(true)
  }

  const handleExcluir = (lancamento: any) => {
    setSelectedLancamento(lancamento)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedLancamento?.id) return
    
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', selectedLancamento.id)
      
      if (error) {
        console.error('Erro ao excluir lançamento:', error)
        toast({
          title: "Erro",
          description: `Erro ao excluir lançamento: ${error.message}`,
          variant: "destructive"
        })
        return
      }
      
      toast({
        title: "Sucesso!",
        description: "Lançamento excluído com sucesso!",
        variant: "default"
      })
      setRefreshLancamentos((prev) => prev + 1)
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao excluir lançamento",
        variant: "destructive"
      })
    } finally {
      setIsDeleteModalOpen(false)
      setSelectedLancamento(null)
    }
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedLancamento(null)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedLancamento(null)
    setRefreshLancamentos((prev) => prev + 1)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedLancamento(null)
  }

  const handleExportar = () => {
    handleExportCSV()
  }

  const handleExportCSV = () => {
    if (lancamentosData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há lançamentos para exportar",
        variant: "default"
      })
      return
    }

    try {
      DataExporter.exportToCSV(lancamentosData, {
        filename: 'lancamentos_contabeis',
        columns: LancamentosExportColumns,
        includeTimestamp: true
      })

      toast({
        title: "Sucesso",
        description: `${lancamentosData.length} lançamentos exportados em CSV`,
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao exportar lançamentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar lançamentos. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleExportExcel = () => {
    if (lancamentosData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há lançamentos para exportar",
        variant: "default"
      })
      return
    }

    try {
      DataExporter.exportToExcel(lancamentosData, {
        filename: 'lancamentos_contabeis',
        columns: LancamentosExportColumns,
        includeTimestamp: true
      })

      toast({
        title: "Sucesso",
        description: `${lancamentosData.length} lançamentos exportados em Excel`,
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao exportar lançamentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar lançamentos. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleExportJSON = () => {
    if (lancamentosData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há lançamentos para exportar",
        variant: "default"
      })
      return
    }

    try {
      DataExporter.exportToJSON(lancamentosData, {
        filename: 'lancamentos_contabeis',
        includeTimestamp: true
      })

      toast({
        title: "Sucesso",
        description: `${lancamentosData.length} lançamentos exportados em JSON`,
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao exportar lançamentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar lançamentos. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <LancamentosHeader
          onNovoLancamento={handleNovoLancamento}
          onToggleFiltros={handleToggleFiltros}
          onImportar={handleImportar}
          onExportar={handleExportar}
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          onExportJSON={handleExportJSON}
          showFiltros={showFiltros}
          filtrosAtivos={filtrosAtivos}
          columns={columns}
          onColumnsChange={updateColumns}
          totalLancamentos={lancamentosData.length}
        />

        <main className="container mx-auto px-4 py-6">
          {showFiltros && (
            <div className="mb-6">
              <Suspense fallback={<FiltrosSkeleton />}>
                <LancamentosFiltros onFilterChange={handleFilterChange} />
              </Suspense>
            </div>
          )}

          <Suspense fallback={<ListSkeleton />}>
            <LancamentosList 
              onVisualizar={handleVisualizar} 
              onEditar={handleEditar} 
              onExcluir={handleExcluir} 
              refresh={refreshLancamentos}
              showContasFilter={true}
              onDataChange={handleLancamentosDataChange}
              filtros={filtrosData}
              columns={columns}
              periodFilter={periodFilter}
              onPeriodChange={handlePeriodChange}
            />
          </Suspense>
        </main>

        <Suspense fallback={<div />}>
          <LancamentosModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </Suspense>
        
        <Suspense fallback={<div />}>
          <LancamentosModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            lancamento={selectedLancamento}
            isEditing={true}
          />
        </Suspense>
        
        <Suspense fallback={<div />}>
          <LancamentosImportModal 
            isOpen={isImportModalOpen} 
            onClose={handleCloseImportModal} 
            onImportComplete={handleImportComplete}
          />
        </Suspense>
        
        <Suspense fallback={<div />}>
          <LancamentosViewModal 
            isOpen={isViewModalOpen} 
            onClose={handleCloseViewModal} 
            lancamento={selectedLancamento} 
          />
        </Suspense>
        
        <Suspense fallback={<div />}>
          <LancamentosDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDelete}
            lancamento={selectedLancamento}
          />
        </Suspense>
      </div>
  )
}
