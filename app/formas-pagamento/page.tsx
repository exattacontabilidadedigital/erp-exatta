"use client"

import { useState } from "react"
import { FormasPagamentoHeader } from "@/components/formas-pagamento/formas-pagamento-header"
import { FormasPagamentoList } from "@/components/formas-pagamento/formas-pagamento-list"
import { FormasPagamentoModal } from "@/components/formas-pagamento/formas-pagamento-modal"
import { FormasPagamentoImportModal } from "@/components/formas-pagamento/formas-pagamento-import-modal"
import { FormasPagamentoRelatorioModal } from "@/components/formas-pagamento/formas-pagamento-relatorio-modal"
import { FormasPagamentoDeleteModal } from "@/components/formas-pagamento/formas-pagamento-delete-modal"
import Header from "@/components/ui/header"

export default function FormasPagamentoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<any>(null)

  const handleExportar = () => {
    const csvData = [
      ["Nome", "Tipo", "Prazo Médio (dias)", "Taxa de Juros (%)", "Status"],
      ["Dinheiro", "Dinheiro", "0", "0", "Ativo"],
      ["Cartão de Crédito", "Cartão de Crédito", "30", "2.5", "Ativo"],
      ["PIX", "PIX", "0", "0", "Ativo"],
      ["Boleto Bancário", "Boleto", "3", "0", "Ativo"],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `formas_pagamento_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEditar = (formaPagamento: any) => {
    setSelectedFormaPagamento(formaPagamento)
    setIsEditModalOpen(true)
  }

  const handleExcluir = (formaPagamento: any) => {
    setSelectedFormaPagamento(formaPagamento)
    setIsDeleteModalOpen(true)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      <FormasPagamentoHeader
        onNovaFormaPagamento={() => setIsModalOpen(true)}
        onImportar={() => setIsImportModalOpen(true)}
        onExportar={handleExportar}
        onRelatorio={() => setIsRelatorioModalOpen(true)}
      />

      <main className="container mx-auto px-4 py-6">
        <FormasPagamentoList onEditar={handleEditar} onExcluir={handleExcluir} />
      </main>

      <FormasPagamentoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <FormasPagamentoImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      <FormasPagamentoRelatorioModal isOpen={isRelatorioModalOpen} onClose={() => setIsRelatorioModalOpen(false)} />

      <FormasPagamentoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedFormaPagamento(null)
        }}
        formaPagamento={selectedFormaPagamento}
        isEditing={true}
      />

      <FormasPagamentoDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedFormaPagamento(null)
        }}
        formaPagamento={selectedFormaPagamento}
      />
      </div>
    </>
  )
}
