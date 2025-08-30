// =========================================================
// EXEMPLO PRÁTICO: INTEGRAÇÃO DO CONTROLE DE DUPLICIDADE
// Como usar o sistema na interface de conciliação existente
// =========================================================

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TransactionStatusBadge, 
  ReconciliationStatsDisplay,
  useDuplicateStatus 
} from '@/components/conciliacao/duplicate-status-display';
import { 
  shouldShowFaded,
  getPendingTransactions,
  createEnhancedMatch 
} from '@/lib/duplicate-control-utils';

// Exemplo 1: Card de Transação Bancária com Controle de Duplicidade
interface EnhancedBankTransactionCardProps {
  transaction: {
    id: string;
    fit_id: string;
    memo: string;
    amount: number;
    posted_at: string;
    status_conciliacao: 'pendente' | 'conciliado' | 'ignorado';
    bank_account_id: string;
  };
  onStatusChange?: (id: string, newStatus: 'pendente' | 'conciliado' | 'ignorado') => void;
}

export function EnhancedBankTransactionCard({ 
  transaction, 
  onStatusChange 
}: EnhancedBankTransactionCardProps) {
  const isFaded = shouldShowFaded(transaction.status_conciliacao);

  return (
    <Card className={`${isFaded ? 'opacity-50 bg-gray-50' : ''} transition-all duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">
            {transaction.memo}
          </CardTitle>
          
          {/* Badge de Status com Ações */}
          <TransactionStatusBadge
            transactionId={transaction.id}
            status={transaction.status_conciliacao}
            showActions={true}
            onStatusChange={(newStatus) => {
              onStatusChange?.(transaction.id, newStatus);
            }}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Valor:</span>
            <span className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(transaction.amount)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Data:</span>
            <span className="text-sm">
              {new Date(transaction.posted_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">FIT ID:</span>
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
              {transaction.fit_id}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Exemplo 2: Interface de Conciliação com Dashboard de Estatísticas
interface ConciliacaoWithStatsProps {
  bankAccountId: string;
  dateStart: string;
  dateEnd: string;
}

export function ConciliacaoWithStats({ 
  bankAccountId, 
  dateStart, 
  dateEnd 
}: ConciliacaoWithStatsProps) {
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar transações pendentes
  const loadPendingTransactions = async () => {
    setLoading(true);
    try {
      const transactions = await getPendingTransactions(bankAccountId, 50);
      setPendingTransactions(transactions);
    } catch (error) {
      console.error('Erro ao carregar transações pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTransactions();
  }, [bankAccountId]);

  const handleStatusChange = (transactionId: string, newStatus: 'pendente' | 'conciliado' | 'ignorado') => {
    setPendingTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, status_conciliacao: newStatus }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard de Estatísticas */}
      <ReconciliationStatsDisplay
        bankAccountId={bankAccountId}
        dateStart={dateStart}
        dateEnd={dateEnd}
        showActions={true}
      />

      {/* Lista de Transações Pendentes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transações Pendentes de Conciliação</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPendingTransactions}
              disabled={loading}
            >
              Atualizar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : pendingTransactions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhuma transação pendente encontrada
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingTransactions.map(transaction => (
                <EnhancedBankTransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Exemplo 3: Hook Personalizado para Gerenciar Conciliação
export function useReconciliationManager(bankAccountId: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Carregar transações pendentes
      const pendingTxns = await getPendingTransactions(bankAccountId);
      setTransactions(pendingTxns);
      
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (
    bankTransactionId: string, 
    systemTransactionId: string, 
    matchScore: number = 1.0
  ) => {
    try {
      const success = await createEnhancedMatch(
        bankTransactionId,
        systemTransactionId,
        matchScore,
        'manual'
      );

      if (success) {
        // Atualizar transação local
        setTransactions(prev => 
          prev.map(t => 
            t.id === bankTransactionId 
              ? { ...t, status_conciliacao: 'conciliado' }
              : t
          )
        );
        
        // Refresh para atualizar estatísticas
        await refreshData();
      }

      return success;
    } catch (error) {
      console.error('Erro ao criar match:', error);
      return false;
    }
  };

  const updateTransactionStatus = (
    transactionId: string, 
    newStatus: 'pendente' | 'conciliado' | 'ignorado'
  ) => {
    setTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, status_conciliacao: newStatus }
          : t
      )
    );
  };

  useEffect(() => {
    if (bankAccountId) {
      refreshData();
    }
  }, [bankAccountId]);

  return {
    transactions,
    stats,
    loading,
    refreshData,
    createMatch,
    updateTransactionStatus
  };
}

// Exemplo 4: Componente de Ação Rápida para Matches
interface QuickMatchActionProps {
  bankTransaction: {
    id: string;
    memo: string;
    amount: number;
  };
  systemTransaction: {
    id: string;
    descricao: string;
    valor: number;
  };
  onMatchCreated?: () => void;
}

export function QuickMatchAction({ 
  bankTransaction, 
  systemTransaction, 
  onMatchCreated 
}: QuickMatchActionProps) {
  const [loading, setLoading] = useState(false);

  const handleQuickMatch = async () => {
    setLoading(true);
    try {
      const success = await createEnhancedMatch(
        bankTransaction.id,
        systemTransaction.id,
        1.0, // Score máximo para match manual
        'manual'
      );

      if (success) {
        onMatchCreated?.();
      }
    } catch (error) {
      console.error('Erro ao criar match:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se valores são compatíveis
  const valuesMatch = Math.abs(bankTransaction.amount - systemTransaction.valor) < 0.01;

  return (
    <Button
      variant={valuesMatch ? "default" : "outline"}
      size="sm"
      onClick={handleQuickMatch}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Conciliando...' : 'Conciliar Automaticamente'}
    </Button>
  );
}

// Exemplo 5: Filtro por Status de Conciliação
interface StatusFilterProps {
  currentStatus: 'all' | 'pendente' | 'conciliado' | 'ignorado';
  onStatusChange: (status: 'all' | 'pendente' | 'conciliado' | 'ignorado') => void;
  counts: {
    all: number;
    pendente: number;
    conciliado: number;
    ignorado: number;
  };
}

export function StatusFilter({ currentStatus, onStatusChange, counts }: StatusFilterProps) {
  const statusOptions = [
    { value: 'all', label: 'Todas', count: counts.all, color: 'bg-blue-100 text-blue-800' },
    { value: 'pendente', label: 'Pendentes', count: counts.pendente, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'conciliado', label: 'Conciliadas', count: counts.conciliado, color: 'bg-green-100 text-green-800' },
    { value: 'ignorado', label: 'Ignoradas', count: counts.ignorado, color: 'bg-gray-100 text-gray-800' },
  ] as const;

  return (
    <div className="flex gap-2 flex-wrap">
      {statusOptions.map(option => (
        <Button
          key={option.value}
          variant={currentStatus === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(option.value)}
          className="flex items-center gap-2"
        >
          {option.label}
          <Badge variant="secondary" className={option.color}>
            {option.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}

export default {
  EnhancedBankTransactionCard,
  ConciliacaoWithStats,
  useReconciliationManager,
  QuickMatchAction,
  StatusFilter
};
