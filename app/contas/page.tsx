"use client"

import { useState, useEffect } from "react"
import { ContasHeader } from "@/components/contas/contas-header"
import { ContasList } from "@/components/contas/contas-list"
import { ContasResumo } from "@/components/contas/contas-resumo"
import { ContasModal } from "@/components/contas/contas-modal"
import { ContasImportModal } from "@/components/contas/contas-import-modal"
import { ContasViewModal } from "@/components/contas/contas-view-modal"
import { ContasDeleteModal } from "@/components/contas/contas-delete-modal"
import { ContasExtratoModal } from "@/components/contas/contas-extrato-modal"

export default function ContasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isExtratoModalOpen, setIsExtratoModalOpen] = useState(false)
  const [selectedConta, setSelectedConta] = useState<any>(null)

  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    import("@/lib/supabase/client").then(({ supabase }) => {
      supabase
        .from("contas_bancarias")
        .select("*, bancos: banco_id (nome)")
        .then(({ data, error }) => {
          if (error) setError("Erro ao buscar contas");
          else setContas(data || []);
          setLoading(false);
        });
    });
    function handleContasAtualizado(e: any) {
      if (e.detail && Array.isArray(e.detail)) {
        setContas(e.detail);
      }
    }
    window.addEventListener("contasAtualizado", handleContasAtualizado);
    return () => {
      window.removeEventListener("contasAtualizado", handleContasAtualizado);
    };
  }, []);

  const handleNovaConta = () => setIsModalOpen(true);
  const handleImportarExtrato = () => setIsImportModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseImportModal = () => setIsImportModalOpen(false);
  const handleVisualizarConta = (conta: any) => { setSelectedConta(conta); setIsViewModalOpen(true); };
  const handleEditarConta = (conta: any) => { setSelectedConta(conta); setIsEditModalOpen(true); };
  const handleExcluirConta = (conta: any) => { setSelectedConta(conta); setIsDeleteModalOpen(true); };
  const handleExtratoConta = (conta: any) => { setSelectedConta(conta); setIsExtratoModalOpen(true); };
  const handleConfirmDelete = () => { setIsDeleteModalOpen(false); setSelectedConta(null); };

  const handleExportar = () => {
    const contasData = [
      {
        banco: "Banco do Brasil",
        agencia: "1234-5",
        conta: "12345-6",
        tipo: "Conta Corrente",
        saldoInicial: "R$ 50.000,00",
        saldoAtual: "R$ 52.500,00",
        variacao: "+R$ 2.500,00",
        status: "Ativa",
        ultimaMovimentacao: "15/12/2024",
      },
      {
        banco: "Itaú",
        agencia: "5678-9",
        conta: "67890-1",
        tipo: "Conta Poupança",
        saldoInicial: "R$ 25.000,00",
        saldoAtual: "R$ 26.800,00",
        variacao: "+R$ 1.800,00",
        status: "Ativa",
        ultimaMovimentacao: "14/12/2024",
      },
      {
        banco: "Santander",
        agencia: "9876-5",
        conta: "54321-0",
        tipo: "Conta Corrente",
        saldoInicial: "R$ 15.000,00",
        saldoAtual: "R$ 13.200,00",
        variacao: "-R$ 1.800,00",
        status: "Ativa",
        ultimaMovimentacao: "13/12/2024",
      },
    ]

    const headers = [
      "Banco",
      "Agência",
      "Conta",
      "Tipo",
      "Saldo Inicial",
      "Saldo Atual",
      "Variação",
      "Status",
      "Última Movimentação",
    ]
    const csvContent = [
      headers.join(","),
      ...contasData.map((conta) =>
        [
          conta.banco,
          conta.agencia,
          conta.conta,
          conta.tipo,
          conta.saldoInicial,
          conta.saldoAtual,
          conta.variacao,
          conta.status,
          conta.ultimaMovimentacao,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `contas_bancarias_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContasHeader
        onNovaConta={handleNovaConta}
        onImportarExtrato={handleImportarExtrato}
        onExportar={handleExportar}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
  {/* Resumo das Contas */}
  <ContasResumo contas={contas} />

        {/* Lista de Contas */}
        {loading && <div>Carregando contas...</div>}
        {error && <div className="text-red-600">{error}</div>}
        <ContasList
          contas={contas}
          onVisualizarConta={handleVisualizarConta}
          onEditarConta={handleEditarConta}
          onExcluirConta={handleExcluirConta}
          onExtratoConta={handleExtratoConta}
        />
      </main>

      <ContasModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <ContasImportModal isOpen={isImportModalOpen} onClose={handleCloseImportModal} />
      <ContasViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} conta={selectedConta} />
      <ContasModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        isEditing={true}
        conta={selectedConta}
      />
      <ContasDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        conta={selectedConta}
        onConfirm={handleConfirmDelete}
      />
      <ContasExtratoModal
        isOpen={isExtratoModalOpen}
        onClose={() => setIsExtratoModalOpen(false)}
        conta={selectedConta}
      />
    </div>
  )
}
