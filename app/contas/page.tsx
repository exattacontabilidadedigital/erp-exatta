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
import Header from "@/components/ui/header"

export default function ContasPage() {
  // Handlers mínimos para evitar erros de referência
  const handleNovaConta = () => setIsModalOpen(true);
  const handleImportarExtrato = () => setIsImportModalOpen(true);
  const handleExportar = () => {};
  const handleVisualizarConta = (conta: any) => setSelectedConta(conta);
  const handleEditarConta = (conta: any) => setSelectedConta(conta);
  const handleExcluirConta = (conta: any) => setSelectedConta(conta);
  const handleExtratoConta = (conta: any) => setSelectedConta(conta);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseImportModal = () => setIsImportModalOpen(false);
  const handleConfirmDelete = () => setIsDeleteModalOpen(false);
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
  return (
    <>
      <Header />
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
    </>
  )
}
