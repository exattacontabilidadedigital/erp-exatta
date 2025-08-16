"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronRight, Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
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

  const handleEditar = (conta: any) => {
    // Mapeia os dados recebidos para o formato esperado pelo formulário
    const contaEdit = {
      ...conta,
      tipo: conta.tipo || "",
      contaPai: conta.conta_pai_id || "",
      natureza: conta.natureza || "",
      nivel: conta.nivel ? String(conta.nivel) : "",
      descricao: conta.descricao || "",
      ativa: conta.ativo !== undefined ? conta.ativo : true,
    }
    setSelectedConta(contaEdit)
    setIsSubcontaMode(false)
    setIsEditModalOpen(true)
  }

  const handleExcluir = (conta: any) => {
    setSelectedConta(conta)
    setIsDeleteModalOpen(true)
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
        codigo: "1",
        nome: "ATIVO",
        tipo: "Ativo",
        nivel: "1",
        contaPai: "",
        descricao: "Bens e direitos da empresa",
      },
      {
        codigo: "1.1",
        nome: "ATIVO CIRCULANTE",
        tipo: "Ativo",
        nivel: "2",
        contaPai: "1",
        descricao: "Bens e direitos realizáveis até 12 meses",
      },
      {
        codigo: "1.1.01",
        nome: "Caixa e Equivalentes",
        tipo: "Ativo",
        nivel: "3",
        contaPai: "1.1",
        descricao: "Disponibilidades imediatas",
      },
      {
        codigo: "1.1.01.001",
        nome: "Caixa",
        tipo: "Ativo",
        nivel: "4",
        contaPai: "1.1.01",
        descricao: "Dinheiro em espécie",
      },
      {
        codigo: "1.1.01.002",
        nome: "Bancos Conta Movimento",
        tipo: "Ativo",
        nivel: "4",
        contaPai: "1.1.01",
        descricao: "Saldo em contas bancárias",
      },
      {
        codigo: "2",
        nome: "PASSIVO",
        tipo: "Passivo",
        nivel: "1",
        contaPai: "",
        descricao: "Obrigações da empresa",
      },
      {
        codigo: "2.1",
        nome: "PASSIVO CIRCULANTE",
        tipo: "Passivo",
        nivel: "2",
        contaPai: "2",
        descricao: "Obrigações vencíveis até 12 meses",
      },
      {
        codigo: "3",
        nome: "PATRIMÔNIO LÍQUIDO",
        tipo: "Patrimônio Líquido",
        nivel: "1",
        contaPai: "",
        descricao: "Recursos próprios da empresa",
      },
      {
        codigo: "4",
        nome: "RECEITAS",
        tipo: "Receita",
        nivel: "1",
        contaPai: "",
        descricao: "Entradas de recursos",
      },
      {
        codigo: "4.1",
        nome: "RECEITAS OPERACIONAIS",
        tipo: "Receita",
        nivel: "2",
        contaPai: "4",
        descricao: "Receitas da atividade principal",
      },
      {
        codigo: "5",
        nome: "DESPESAS",
        tipo: "Despesa",
        nivel: "1",
        contaPai: "",
        descricao: "Saídas de recursos",
      },
      {
        codigo: "5.1",
        nome: "DESPESAS OPERACIONAIS",
        tipo: "Despesa",
        nivel: "2",
        contaPai: "5",
        descricao: "Despesas da atividade principal",
      },
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
    <div className="min-h-screen bg-gray-50">
      <PlanoContasHeader
        onNovaConta={handleNovaContaClick}
        onImportar={handleImportarClick}
        onExportar={handleExportarClick}
        onRelatorio={handleRelatorioClick}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Resumo do Plano de Contas */}
        <PlanoContasResumo />

        {/* Árvore do Plano de Contas */}
        <PlanoContasTree
          onAdicionarSubconta={handleAdicionarSubconta}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
          refresh={refreshTree}
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
  )
}
