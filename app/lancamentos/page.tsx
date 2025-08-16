"use client"

import { useState } from "react"
import { LancamentosHeader } from "@/components/lancamentos/lancamentos-header"
import { LancamentosList } from "@/components/lancamentos/lancamentos-list"
import { LancamentosModal } from "@/components/lancamentos/lancamentos-modal"
import { LancamentosFiltros } from "@/components/lancamentos/lancamentos-filtros"
import { LancamentosImportModal } from "@/components/lancamentos/lancamentos-import-modal"
import { LancamentosViewModal } from "@/components/lancamentos/lancamentos-view-modal"
import { LancamentosDeleteModal } from "@/components/lancamentos/lancamentos-delete-modal"

export default function LancamentosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshLancamentos, setRefreshLancamentos] = useState(0)
  const [showFiltros, setShowFiltros] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLancamento, setSelectedLancamento] = useState<any>(null)

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

  const handleImportar = () => {
    setIsImportModalOpen(true)
  }

  const handleCloseImportModal = () => {
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

  const handleConfirmDelete = () => {
    console.log("Excluindo lançamento:", selectedLancamento?.id)
    setIsDeleteModalOpen(false)
    setSelectedLancamento(null)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedLancamento(null)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedLancamento(null)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedLancamento(null)
  }

  const handleExportar = () => {
    const lancamentos = [
      {
        data: "2024-01-15",
        tipo: "Receita",
        numeroDocumento: "NF-001",
        planoContas: "3.1.01 - Receita de Vendas",
        centroCusto: "Vendas",
        valor: "5000.00",
        clienteFornecedor: "Cliente ABC Ltda",
        contaBancaria: "Banco do Brasil - CC 12345-6",
        historico: "Venda de produtos",
        status: "Liquidado",
      },
      {
        data: "2024-01-16",
        tipo: "Despesa",
        numeroDocumento: "BOL-002",
        planoContas: "4.1.01 - Despesas Administrativas",
        centroCusto: "Administrativo",
        valor: "1200.00",
        clienteFornecedor: "Fornecedor XYZ Ltda",
        contaBancaria: "Itaú - CC 98765-4",
        historico: "Pagamento de fornecedor",
        status: "Pendente",
      },
      {
        data: "2024-01-17",
        tipo: "Transferência",
        numeroDocumento: "TRF-003",
        planoContas: "1.1.01 - Caixa",
        centroCusto: "Financeiro",
        valor: "3000.00",
        clienteFornecedor: "",
        contaBancaria: "Santander - CC 54321-9",
        historico: "Transferência entre contas",
        status: "Liquidado",
      },
    ]

    const headers = [
      "Data",
      "Tipo",
      "Número Documento",
      "Plano de Contas",
      "Centro de Custo",
      "Valor",
      "Cliente/Fornecedor",
      "Conta Bancária",
      "Histórico",
      "Status",
    ]

    const csvContent = [
      headers.join(","),
      ...lancamentos.map((lancamento) =>
        [
          lancamento.data,
          lancamento.tipo,
          lancamento.numeroDocumento,
          `"${lancamento.planoContas}"`,
          lancamento.centroCusto,
          lancamento.valor,
          `"${lancamento.clienteFornecedor}"`,
          `"${lancamento.contaBancaria}"`,
          `"${lancamento.historico}"`,
          lancamento.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `lancamentos_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LancamentosHeader
        onNovoLancamento={handleNovoLancamento}
        onToggleFiltros={handleToggleFiltros}
        onImportar={handleImportar}
        onExportar={handleExportar}
      />

      <main className="container mx-auto px-4 py-6">
        {showFiltros && (
          <div className="mb-6">
            <LancamentosFiltros />
          </div>
        )}

    <LancamentosList onVisualizar={handleVisualizar} onEditar={handleEditar} onExcluir={handleExcluir} refresh={refreshLancamentos} />
      </main>

      <LancamentosModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <LancamentosModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        lancamento={selectedLancamento}
        isEditing={true}
      />
      <LancamentosImportModal isOpen={isImportModalOpen} onClose={handleCloseImportModal} />
      <LancamentosViewModal isOpen={isViewModalOpen} onClose={handleCloseViewModal} lancamento={selectedLancamento} />
      <LancamentosDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        lancamento={selectedLancamento}
      />
    </div>
  )
}
