"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { ContasHeader } from "@/components/contas/contas-header"
import { ContasList } from "@/components/contas/contas-list"
import { ContasModal } from "@/components/contas/contas-modal"
import { ContasViewModal } from "@/components/contas/contas-view-modal"
import { ContasDeleteModal } from "@/components/contas/contas-delete-modal"
import { ContasExtratoModal } from "@/components/contas/contas-extrato-modal"
import { ContasConciliacaoModal } from "@/components/contas/contas-conciliacao-modal"
import { ContasImportModal } from "@/components/contas/contas-import-modal"

export default function ContasPage() {
  const { userData } = useAuth()
  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Estados dos modais
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExtratoModal, setShowExtratoModal] = useState(false)
  const [showConciliacaoModal, setShowConciliacaoModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedConta, setSelectedConta] = useState<any>(null)

  // Carrega as contas
  const loadContas = async () => {
    if (!userData?.empresa_id) return
    
    try {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select(`
          *,
          bancos:banco_id (
            id,
            nome,
            codigo
          )
        `)
        .eq('empresa_id', userData.empresa_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContas(data || [])
    } catch (err) {
      console.error('Erro ao carregar contas:', err)
      setError('Erro ao carregar contas bancárias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContas()
  }, [userData])

  // Handlers dos modais
  const handleNovaConta = () => {
    setSelectedConta(null)
    setShowModal(true)
  }

  const handleVisualizarConta = (conta: any) => {
    setSelectedConta(conta)
    setShowViewModal(true)
  }

  const handleEditarConta = (conta: any) => {
    setSelectedConta(conta)
    setShowModal(true)
  }

  const handleExcluirConta = (conta: any) => {
    setSelectedConta(conta)
    setShowDeleteModal(true)
  }

  const handleExtratoConta = (conta: any) => {
    setSelectedConta(conta)
    setShowExtratoModal(true)
  }

  const handleConciliarConta = (conta: any) => {
    setSelectedConta(conta)
    setShowConciliacaoModal(true)
  }

  const handleImportarExtrato = () => {
    setShowImportModal(true)
  }

  const handleExportar = () => {
    // Implementar exportação
    console.log('Exportar contas')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContasHeader
        onNovaConta={handleNovaConta}
        onImportarExtrato={handleImportarExtrato}
        onExportar={handleExportar}
      />
      
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Erro:</p>
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando contas...</span>
          </div>
        ) : (
          <ContasList
            contas={contas}
            loading={loading}
            error={error}
            onVisualizarConta={handleVisualizarConta}
            onEditarConta={handleEditarConta}
            onExcluirConta={handleExcluirConta}
            onExtratoConta={handleExtratoConta}
            onConciliarConta={handleConciliarConta}
            onRefresh={loadContas}
          />
        )}
      </main>

      {/* Modais */}
      <ContasModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        conta={selectedConta}
        isEditing={!!selectedConta}
        onSuccess={loadContas}
      />

      <ContasViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        conta={selectedConta}
      />

      <ContasDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        conta={selectedConta}
        onConfirm={loadContas}
      />

      <ContasExtratoModal
        isOpen={showExtratoModal}
        onClose={() => setShowExtratoModal(false)}
        conta={selectedConta}
      />

      <ContasConciliacaoModal
        isOpen={showConciliacaoModal}
        onClose={() => setShowConciliacaoModal(false)}
        conta={selectedConta}
      />

      <ContasImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  )
}
