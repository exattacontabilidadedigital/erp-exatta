"use client"

import { useState, useCallback, useMemo } from "react"
import { LancamentosHeader } from "@/components/lancamentos/lancamentos-header"
import { LancamentosList } from "@/components/lancamentos/lancamentos-list"
import { LancamentosModal } from "@/components/lancamentos/lancamentos-modal"
import { LancamentosFiltros } from "@/components/lancamentos/lancamentos-filtros"
import { LancamentosImportModal } from "@/components/lancamentos/lancamentos-import-modal"
import { LancamentosViewModal } from "@/components/lancamentos/lancamentos-view-modal"
import { LancamentosDeleteModal } from "@/components/lancamentos/lancamentos-delete-modal"
import { useColumnsConfig } from "@/hooks/use-columns-config"
import Header from "@/components/ui/header"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
    if (lancamentosData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há lançamentos para exportar",
        variant: "default"
      })
      return
    }

    const csvHeader = [
      "Data",
      "Tipo",
      "Nº Documento",
      "Plano de Contas",
      "Centro de Custo",
      "Cliente/Fornecedor",
      "Conta Bancária",
      "Valor",
      "Descrição",
      "Status",
    ].join(",")

    const csvContent = [
      csvHeader,
      ...lancamentosData.map((lancamento) =>
        [
          lancamento.data_lancamento ? new Date(lancamento.data_lancamento).toLocaleDateString('pt-BR') : '',
          lancamento.tipo,
          `"${lancamento.numero_documento || ''}"`,
          `"${lancamento.plano_conta_nome || ''}"`,
          `"${lancamento.centro_custo_nome || ''}"`,
          `"${lancamento.cliente_fornecedor_nome || ''}"`,
          `"${lancamento.conta_bancaria_nome || ''}"`,
          Number.parseFloat(lancamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          `"${lancamento.descricao || ''}"`,
          lancamento.status,
        ].join(",")
      ),
    ].join("\\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `lancamentos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <LancamentosHeader
          onNovoLancamento={handleNovoLancamento}
          onToggleFiltros={handleToggleFiltros}
          onImportar={handleImportar}
          onExportar={handleExportar}
          showFiltros={showFiltros}
          filtrosAtivos={filtrosAtivos}
          columns={columns}
          onColumnsChange={updateColumns}
        />

        <main className="container mx-auto px-4 py-6">
          {showFiltros && (
            <div className="mb-6">
              <LancamentosFiltros onFilterChange={handleFilterChange} />
            </div>
          )}

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
        </main>

        <LancamentosModal isOpen={isModalOpen} onClose={handleCloseModal} />
        <LancamentosModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          lancamento={selectedLancamento}
          isEditing={true}
        />
        <LancamentosImportModal 
          isOpen={isImportModalOpen} 
          onClose={handleCloseImportModal} 
          onImportComplete={handleImportComplete}
        />
        <LancamentosViewModal isOpen={isViewModalOpen} onClose={handleCloseViewModal} lancamento={selectedLancamento} />
        <LancamentosDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          lancamento={selectedLancamento}
        />
      </div>
    </>
  )
}
