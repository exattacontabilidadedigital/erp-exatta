// =========================================================
// CARD DE CONCILIAÇÃO APRIMORADO - V2
// =========================================================

"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, X, Clock, ArrowLeftRight, Plus, Search } from "lucide-react";

interface BankTransaction {
  id: string;
  memo: string;
  payee?: string;
  amount: number;
  posted_at: string;
  transaction_type: 'DEBIT' | 'CREDIT';
}

interface SystemTransaction {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  numero_documento?: string;
}

interface ReconciliationPair {
  id: string;
  bankTransaction: BankTransaction;
  systemTransactions: SystemTransaction[];
  status: 'conciliado' | 'sugerido' | 'conflito' | 'pendente' | 'sem_match';
  confidenceLevel: '100%' | 'provavel' | 'manual';
  matchScore?: number;
  matchReason?: string;
}

interface ReconciliationCardProps {
  pair: ReconciliationPair;
  onConciliate: (pair: ReconciliationPair, systemTransaction?: SystemTransaction) => void;
  onIgnore: (pair: ReconciliationPair) => void;
  onCreateLancamento: (pair: ReconciliationPair) => void;
  onCreateTransferencia: (pair: ReconciliationPair) => void;
}

export function ReconciliationCard({
  pair,
  onConciliate,
  onIgnore,
  onCreateLancamento,
  onCreateTransferencia
}: ReconciliationCardProps) {
  const [selectedSystemTransactionId, setSelectedSystemTransactionId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conciliado': return 'bg-green-100 text-green-800 border-green-200';
      case 'sugerido': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'conflito': return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sem_match': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  // Sistema de match sugerido: seleciona automaticamente a transação mais próxima
  const suggestedMatch = useMemo(() => {
    if (!pair.systemTransactions || pair.systemTransactions.length === 0) return null;
    // Match mais próximo por valor absoluto
    return pair.systemTransactions.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.valor - pair.bankTransaction.amount);
      const currDiff = Math.abs(curr.valor - pair.bankTransaction.amount);
      return currDiff < prevDiff ? curr : prev;
    });
  }, [pair.systemTransactions, pair.bankTransaction.amount]);

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <div className="grid grid-cols-3 gap-0 min-h-[180px]">
        {/* Lado Esquerdo: OFX */}
        <div className="p-4 border-r">
          <div className="text-sm text-gray-500">{formatDate(pair.bankTransaction.posted_at)}</div>
          <div className={`font-bold text-lg mt-1 ${pair.bankTransaction.transaction_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(pair.bankTransaction.amount)}
          </div>
          <div className="text-sm mt-1">{pair.bankTransaction.memo || 'Sem descrição'}</div>
          {pair.bankTransaction.payee && <div className="text-gray-600 text-sm">{pair.bankTransaction.payee}</div>}
        </div>

        {/* Centro: Status + Match */}
        <div className="p-4 flex flex-col items-center justify-center space-y-2 bg-gray-50">
          <Badge className={`${getStatusColor(pair.status)} px-2 py-1 border`}>
            {pair.status === 'conciliado' && <CheckCircle className="h-4 w-4 mr-1 inline" />}
            {pair.status === 'sugerido' && <AlertCircle className="h-4 w-4 mr-1 inline" />}
            {pair.status === 'conflito' && <AlertCircle className="h-4 w-4 mr-1 inline text-red-600" />}
            {pair.status === 'pendente' && <Clock className="h-4 w-4 mr-1 inline text-yellow-600" />}
            {pair.status === 'sem_match' && <X className="h-4 w-4 mr-1 inline" />}
            {pair.status.charAt(0).toUpperCase() + pair.status.slice(1)}
          </Badge>

          {/* Mostrar nível de confiança para sugestões */}
          {pair.status === 'sugerido' && pair.confidenceLevel && (
            <div className="text-xs text-gray-600">
              Confiança: {pair.confidenceLevel}
            </div>
          )}

          {/* Botão de conciliação automática */}
          {pair.status === 'sugerido' && suggestedMatch && (
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => onConciliate(pair, suggestedMatch)}
            >
              Conciliar automaticamente
            </Button>
          )}

          {/* Botão de revisão manual */}
          {(pair.status === 'pendente' || pair.status === 'conflito') && (
            <Button
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => onConciliate(pair)}
            >
              Revisar
            </Button>
          )}

          {/* Botão para ignorar */}
          {pair.status === 'sem_match' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onIgnore(pair)}
            >
              Ignorar
            </Button>
          )}
        </div>

        {/* Lado Direito: Lançamentos do Sistema + Ações */}
        <div className="p-4 border-l flex flex-col">
          {/* Lista de Lançamentos do Sistema */}
          <div className="flex-1 space-y-2 mb-4">
            <div className="text-xs font-medium text-gray-600 mb-2">LANÇAMENTOS DO SISTEMA</div>
            
            {pair.systemTransactions.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4">
                Nenhum lançamento encontrado
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {pair.systemTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      selectedSystemTransactionId === tx.id 
                        ? 'bg-blue-100 border-blue-400' 
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => setSelectedSystemTransactionId(tx.id)}
                  >
                    <div className="font-medium text-sm">{tx.descricao}</div>
                    <div className="text-xs text-gray-500">{formatDate(tx.data_lancamento)}</div>
                    <div className={`font-medium text-sm ${tx.tipo === 'receita' ? 'text-green-600' : tx.tipo === 'despesa' ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatCurrency(tx.valor)}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {tx.tipo}
                      {tx.numero_documento && ` • Doc: ${tx.numero_documento}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="border-t pt-3 space-y-1">
            <Button size="sm" variant="outline" onClick={() => onCreateLancamento(pair)} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Criar Lançamento
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCreateTransferencia(pair)} className="w-full">
              <ArrowLeftRight className="h-4 w-4 mr-1" /> Transferência
            </Button>
            {pair.status !== 'sem_match' && (
              <Button size="sm" variant="destructive" onClick={() => onIgnore(pair)} className="w-full">
                <X className="h-4 w-4 mr-1" /> Ignorar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
