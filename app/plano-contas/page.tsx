"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronRight, Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import Header from "@/components/ui/header"
import { PlanoContasHeader } from "@/components/plano-contas/plano-contas-header"
import { PlanoContasTree } from "@/components/plano-contas/plano-contas-tree"
import { PlanoContasResumo } from "@/components/plano-contas/plano-contas-resumo"
import { PlanoContasModal } from "@/components/plano-contas/plano-contas-modal"
import { PlanoContasImportModal } from "@/components/plano-contas/plano-contas-import-modal"
import { PlanoContasRelatorioModal } from "@/components/plano-contas/plano-contas-relatorio-modal"
import { PlanoContasDeleteModal } from "@/components/plano-contas/plano-contas-delete-modal"

export default function PlanoContasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedConta, setSelectedConta] = useState<any>(null)
  const [isSubcontaMode, setIsSubcontaMode] = useState(false)
  const [refreshTree, setRefreshTree] = useState(0)
  const [filtroCard, setFiltroCard] = useState<string>('')

    const handleNovaContaClick = () => {
      setSelectedConta(null)
      setIsSubcontaMode(false)
      setIsModalOpen(true)
    }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedConta(null)
    setIsSubcontaMode(false)
    setRefreshTree((r) => r + 1)
  }

  const handleAdicionarSubconta = (contaPai: any) => {
    setSelectedConta(contaPai)
    setIsSubcontaMode(true)
    setIsModalOpen(true)
  }

  const handleEditar = async (conta: any) => {
    // Mapeia os dados recebidos para o formato esperado pelos dropdowns (id para Select)
    const contaEdit = {
      id: conta.id,
      codigo: conta.codigo ?? "",
      nome: conta.nome ?? "",
      tipo: conta.tipo ? String(conta.tipo).toLowerCase() : "",
      conta_pai_id: conta.conta_pai_id ?? "",
      natureza: conta.natureza ? String(conta.natureza).toLowerCase() : "",
      nivel: conta.nivel ? String(conta.nivel) : "",
      descricao: conta.descricao ?? "",
      ativo: conta.ativo ?? true,
    }
    setSelectedConta(contaEdit)
    setIsSubcontaMode(false)
    setIsEditModalOpen(true)
  }

  const handleExcluir = (conta: any) => {
    setSelectedConta(conta)
    setIsDeleteModalOpen(true)
  }

  const handleToggleAtivo = async (conta: any) => {
    try {
      const novoStatus = !conta.ativo
      
      const { error } = await supabase
        .from('plano_contas')
        .update({ ativo: novoStatus })
        .eq('id', conta.id)

      if (error) {
        console.error('Erro ao alterar status da conta:', error)
        alert('Erro ao alterar status da conta. Tente novamente.')
        return
      }

      // Atualiza a árvore
      setRefreshTree((r) => r + 1)
      
      console.log(`Conta ${novoStatus ? 'ativada' : 'desativada'} com sucesso`)
    } catch (error) {
      console.error('Erro ao alterar status da conta:', error)
      alert('Erro ao alterar status da conta. Tente novamente.')
    }
  }

  const handleCardClick = (filtro: string) => {
    setFiltroCard(filtro)
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setSelectedConta(null)
    setRefreshTree((r) => r + 1)
  }

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false)
    setSelectedConta(null)
    setRefreshTree((r) => r + 1)
  }

  const handleConfirmDelete = () => {
    async function excluirConta() {
      if (!selectedConta?.id) return
      const { error } = await supabase.from("plano_contas").delete().eq("id", selectedConta.id)
      if (error) {
        alert("Erro ao excluir conta: " + error.message)
        return
      }
      handleDeleteModalClose()
      setRefreshTree((r) => r + 1)
    }
    excluirConta()
  }

  const handleImportarClick = () => {
    setIsImportModalOpen(true)
  }

  const handleImportModalClose = () => {
    setIsImportModalOpen(false)
  }

  const handleRelatorioClick = () => {
    setIsRelatorioModalOpen(true)
  }

  const handleRelatorioModalClose = () => {
    setIsRelatorioModalOpen(false)
  }

  const handleExportarClick = () => {
    const dadosPlanoContas = [
      {
        codigo: "5.1",
        nome: "DESPESAS OPERACIONAIS",
        tipo: "Despesa",
        nivel: "2",
        contaPai: "5",
        descricao: "Despesas da atividade principal"
      }
    ]

    const headers = ["Código", "Nome", "Tipo", "Nível", "Conta Pai", "Descrição"]
    const csvContent = [
      headers.join(","),
      ...dadosPlanoContas.map((conta) =>
        [conta.codigo, `"${conta.nome}"`, conta.tipo, conta.nivel, conta.contaPai, `"${conta.descricao}"`].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `plano_contas_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <PlanoContasHeader
          onNovaConta={handleNovaContaClick}
          onImportar={handleImportarClick}
          onExportar={handleExportarClick}
          onRelatorio={handleRelatorioClick}
        />

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Resumo do Plano de Contas */}
          <PlanoContasResumo 
            refresh={refreshTree}
            onCardClick={handleCardClick}
            filtroAtivo={filtroCard}
          />

          {/* Árvore do Plano de Contas */}
          <PlanoContasTree
            onAdicionarSubconta={handleAdicionarSubconta}
            onEditar={handleEditar}
            onExcluir={handleExcluir}
            onToggleAtivo={handleToggleAtivo}
            refresh={refreshTree}
            filtroCard={filtroCard}
          />
        </main>

        {/* Modal de Nova Conta */}
        <PlanoContasModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          conta={isSubcontaMode ? selectedConta : null}
          isSubconta={isSubcontaMode}
        />

        <PlanoContasModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          conta={selectedConta}
          isEditing={true}
        />

        <PlanoContasDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteModalClose}
          onConfirm={handleConfirmDelete}
          conta={selectedConta}
        />

        {/* Modal de Importação */}
        <PlanoContasImportModal isOpen={isImportModalOpen} onClose={handleImportModalClose} />

        <PlanoContasRelatorioModal isOpen={isRelatorioModalOpen} onClose={handleRelatorioModalClose} />
      </div>
    </>
  )
}
