'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { PlanoContasHeader } from '@/components/plano-contas/plano-contas-header';
import { PlanoContasTree } from '@/components/plano-contas/plano-contas-tree';
import { PlanoContasResumo } from '@/components/plano-contas/plano-contas-resumo';
import { PlanoContasModal } from '@/components/plano-contas/plano-contas-modal';
import { PlanoContasImportModal } from '@/components/plano-contas/plano-contas-import-modal';
import { PlanoContasRelatorioModal } from '@/components/plano-contas/plano-contas-relatorio-modal';
import { PlanoContasDeleteModal } from '@/components/plano-contas/plano-contas-delete-modal';

interface PlanoContaItem {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  conta_pai_id?: string;
  natureza: string;
  nivel: number;
  descricao?: string;
  ativo: boolean;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export default function PlanoContasPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [isSubcontaMode, setIsSubcontaMode] = useState(false);
  const [refreshTree, setRefreshTree] = useState(0);
  const [filtroCard, setFiltroCard] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleNovaContaClick = () => {
    setSelectedConta(null);
    setIsSubcontaMode(false);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedConta(null);
    setIsSubcontaMode(false);
    setRefreshTree((r) => r + 1);
  };

  const handleAdicionarSubconta = (contaPai: any) => {
    setSelectedConta(contaPai);
    setIsSubcontaMode(true);
    setIsModalOpen(true);
  };

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
    };
    setSelectedConta(contaEdit);
    setIsSubcontaMode(false);
    setIsEditModalOpen(true);
  };

  const handleExcluir = (conta: any) => {
    setSelectedConta(conta);
    setIsDeleteModalOpen(true);
  };

  const handleToggleAtivo = async (conta: any) => {
    if (!supabase) {
      toast({
        title: "Erro",
        description: "Sistema não conectado",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const novoStatus = !conta.ativo;
      
      const { error } = await supabase
        .from('plano_contas')
        .update({ ativo: novoStatus })
        .eq('id', conta.id);

      if (error) {
        console.error('Erro ao alterar status da conta:', error);
        toast({
          title: "Erro ao alterar status",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Atualiza a árvore
      setRefreshTree((r) => r + 1);
      
      toast({
        title: "Status alterado",
        description: `Conta ${novoStatus ? 'ativada' : 'desativada'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status da conta:', error);
      toast({
        title: "Erro inesperado",
        description: "Falha ao alterar status da conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (filtro: string) => {
    setFiltroCard(filtro);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedConta(null);
    setRefreshTree((r) => r + 1);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedConta(null);
    setRefreshTree((r) => r + 1);
  };

  const handleConfirmDelete = async () => {
    if (!selectedConta?.id || !supabase) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("plano_contas")
        .delete()
        .eq("id", selectedConta.id);

      if (error) {
        console.error('Erro ao excluir conta:', error);
        toast({
          title: "Erro ao excluir conta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Conta excluída",
        description: "Conta do plano removida com sucesso",
      });

      handleDeleteModalClose();
    } catch (error) {
      console.error('Erro inesperado ao excluir:', error);
      toast({
        title: "Erro inesperado",
        description: "Falha ao excluir conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportarClick = () => {
    setIsImportModalOpen(true);
  };

  const handleImportModalClose = () => {
    setIsImportModalOpen(false);
    setRefreshTree((r) => r + 1);
  };

  const handleRelatorioClick = () => {
    setIsRelatorioModalOpen(true);
  };

  const handleRelatorioModalClose = () => {
    setIsRelatorioModalOpen(false);
  };

  const handleExportarClick = async () => {
    if (!supabase) {
      toast({
        title: "Erro",
        description: "Sistema não conectado",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Buscar dados reais do plano de contas
      const { data: planoContas, error } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('empresa_id', userData?.empresa_id)
        .order('codigo');

      if (error) {
        console.error('Erro ao buscar plano de contas:', error);
        toast({
          title: "Erro na exportação",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!planoContas || planoContas.length === 0) {
        toast({
          title: "Exportação cancelada",
          description: "Nenhuma conta encontrada para exportar",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para exportação
      const dadosExportacao = planoContas.map((conta: any) => ({
        'Código': conta.codigo,
        'Nome': conta.nome,
        'Tipo': conta.tipo,
        'Natureza': conta.natureza,
        'Nível': conta.nivel,
        'Conta Pai': conta.conta_pai_id || '',
        'Descrição': conta.descricao || '',
        'Status': conta.ativo ? 'Ativo' : 'Inativo',
        'Criada em': new Date(conta.created_at).toLocaleDateString('pt-BR')
      }));

      // Criar CSV
      const headers = Object.keys(dadosExportacao[0]).join(',');
      const csvRows = dadosExportacao.map((row: any) => 
        Object.values(row).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [headers, ...csvRows].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `plano_contas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação realizada",
        description: `${planoContas.length} contas exportadas com sucesso`,
      });
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Falha ao gerar arquivo CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificação de autenticação
  if (!userData?.empresa_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso não autorizado</h2>
          <p className="text-gray-600">Faça login para acessar o plano de contas</p>
        </div>
      </div>
    );
  }

  return (
    <>
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

          {/* Estado de carregamento */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Processando...</span>
            </div>
          )}

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

        {/* Modais */}
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

        <PlanoContasImportModal 
          isOpen={isImportModalOpen} 
          onClose={handleImportModalClose} 
        />

        <PlanoContasRelatorioModal 
          isOpen={isRelatorioModalOpen} 
          onClose={handleRelatorioModalClose} 
        />
      </div>
    </>
  );
}
