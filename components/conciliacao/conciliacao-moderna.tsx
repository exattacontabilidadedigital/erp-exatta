// =========================================================
// COMPONENTE PRINCIPAL DE CONCILIAÇÃO BANCÁRIA
// UI em duas colunas conforme blueprint
// =========================================================

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Check, 
  X, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import ConciliacaoActionModal from './conciliacao-action-modal';
import BuscarExistenteFullscreen from './buscar-existente-fullscreen';
import BuscarLancamentosModal from './buscar-lancamentos-modal';
import IgnorarTransacaoModal from './ignorar-transacao-modal';
import type { 
  ReconciliationPair, 
  BankTransaction, 
  SystemTransaction,
  ReconciliationSummary 
} from '@/types/conciliacao';

interface ConciliacaoModernaProps {
  bankAccountId: string;
  period: { start: string; end: string };
  hideHeader?: boolean; // Esconder card de resumo
  hideUpload?: boolean; // Esconder seção de upload
}

export function ConciliacaoModerna({ bankAccountId, period, hideHeader = false, hideUpload = false }: ConciliacaoModernaProps) {
  const { toast } = useToast();
  
  // Estados principais
  const [pairs, setPairs] = useState<ReconciliationPair[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'matched' | 'suggested' | 'no_match'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reconciliationId, setReconciliationId] = useState<string>('');

  // Estados para upload OFX
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados para modal de ação
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedBankTransaction, setSelectedBankTransaction] = useState<BankTransaction | null>(null);
  const [actionType, setActionType] = useState<'create' | 'transfer'>('create');

  // Estados para modal de buscar existente
  const [showBuscarModal, setShowBuscarModal] = useState(false);
  const [modalType, setModalType] = useState<'fullscreen' | 'compact'>('compact'); // Tipo de modal de busca

  // Estados para modal de ignorar
  const [showIgnorarModal, setShowIgnorarModal] = useState(false);

  // Carregar sugestões de conciliação
  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reconciliation/suggestions?bank_account_id=${bankAccountId}&period_start=${period.start}&period_end=${period.end}`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao carregar sugestões');
      }

      const data = await response.json();
      setPairs(data.pairs);
      setSummary(data.summary);
      setReconciliationId(data.reconciliation_id);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar sugestões de conciliação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [bankAccountId, period, toast]);

  // Upload OFX
  const handleOFXUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo OFX",
        variant: "destructive",
      });
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bank_account_id', bankAccountId);

      const response = await fetch('/api/ofx/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      
      toast({
        title: "Sucesso",
        description: `${result.total_transactions} transações importadas`,
      });

      // Recarregar sugestões
      await loadSuggestions();
      setSelectedFile(null);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha no upload do arquivo OFX",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Confirmar match
  const confirmMatch = async (pair: ReconciliationPair, action: any) => {
    try {
      const response = await fetch('/api/reconciliation/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconciliation_id: reconciliationId,
          bank_transaction_id: pair.bankTransaction?.id,
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao confirmar match');
      }

      toast({
        title: "Sucesso",
        description: "Conciliação confirmada",
      });

      // Atualizar o status do par
      setPairs(prevPairs => 
        prevPairs.map(p => 
          p.id === pair.id 
            ? { ...p, status: 'matched' as const }
            : p
        )
      );

    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao confirmar conciliação",
        variant: "destructive",
      });
    }
  };

  // Abrir modal para criar lançamento
  const handleCreateLancamento = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setActionType('create');
    setShowActionModal(true);
  };

  // Abrir modal para criar transferência
  const handleCreateTransferencia = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setActionType('transfer');
    setShowActionModal(true);
  };

  // Abrir modal para buscar existente
  const handleBuscarExistente = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setShowBuscarModal(true);
  };

  // Abrir modal para ignorar transação
  const handleIgnorar = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setShowIgnorarModal(true);
  };

  // Callback quando match é encontrado via busca
  const handleMatchFound = (lancamento: any) => {
    // Recarregar sugestões para mostrar o novo match
    loadSuggestions();
    
    toast({
      title: "Sucesso!",
      description: "Lançamento conciliado com sucesso",
    });
  };

  // Callback quando transação é ignorada
  const handleIgnored = () => {
    // Recarregar sugestões para remover a transação ignorada
    loadSuggestions();
    
    toast({
      title: "Sucesso!",
      description: "Transação ignorada com sucesso",
    });
  };

  // Callback quando ação é realizada com sucesso
  const handleActionSuccess = (result: any) => {
    // Recarregar sugestões para mostrar o novo match
    loadSuggestions();
    
    toast({
      title: "Sucesso!",
      description: result.type === 'create_and_match' 
        ? "Lançamento criado e conciliado automaticamente"
        : "Transferência criada e conciliada automaticamente",
    });
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Filtrar pares
  const filteredPairs = pairs.filter(pair => {
    // Filtro por status
    if (selectedFilter !== 'all' && pair.status !== selectedFilter) {
      return false;
    }

    // Filtro por busca
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const bankDesc = pair.bankTransaction?.description?.toLowerCase() || '';
      const systemDesc = pair.systemTransaction?.descricao?.toLowerCase() || '';
      
      return bankDesc.includes(searchLower) || systemDesc.includes(searchLower);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header com resumo - só exibe se não estiver oculto */}
      {!hideHeader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conciliação Bancária</span>
              <Button onClick={loadSuggestions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.total_bank}</div>
                  <div className="text-sm text-gray-500">Extrato</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{summary.total_system}</div>
                  <div className="text-sm text-gray-500">Sistema</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.exact_matches}</div>
                  <div className="text-sm text-gray-500">Exatos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{summary.suggested_matches}</div>
                  <div className="text-sm text-gray-500">Sugeridos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.no_matches}</div>
                  <div className="text-sm text-gray-500">Sem Match</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload OFX - só exibe se não estiver oculto */}
      {!hideUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Importar OFX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept=".ofx,.qfx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Button 
                onClick={handleOFXUpload} 
                disabled={uploadLoading || !selectedFile}
              >
                {uploadLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo simples quando header está oculto */}
      {hideHeader && summary && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{summary.total_bank}</div>
                <div className="text-xs text-gray-500">Extrato</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{summary.total_system}</div>
                <div className="text-xs text-gray-500">Sistema</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{summary.exact_matches}</div>
                <div className="text-xs text-gray-500">Exatos</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">{summary.suggested_matches}</div>
                <div className="text-xs text-gray-500">Sugeridos</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{summary.no_matches}</div>
                <div className="text-xs text-gray-500">Sem Match</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="matched">Conciliados</SelectItem>
                <SelectItem value="suggested">Sugeridos</SelectItem>
                <SelectItem value="no_match">Sem Match</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Seletor de tipo de modal */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Modal:</label>
              <Select value={modalType} onValueChange={(value: 'fullscreen' | 'compact') => setModalType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="fullscreen">Fullscreen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pares de conciliação */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando conciliações...</p>
          </div>
        ) : filteredPairs.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          filteredPairs.map((pair) => (
            <ReconciliationPairCard 
              key={pair.id} 
              pair={pair} 
              onConfirm={confirmMatch}
              onCreateLancamento={handleCreateLancamento}
              onCreateTransferencia={handleCreateTransferencia}
              onBuscarExistente={handleBuscarExistente}
              onIgnorar={handleIgnorar}
            />
          ))
        )}
      </div>

      {/* Modal de Ação */}
      {showActionModal && selectedBankTransaction && (
        <ConciliacaoActionModal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setSelectedBankTransaction(null);
          }}
          bankTransaction={selectedBankTransaction}
          actionType={actionType}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* Modal de Buscar Existente - Escolha entre versões */}
      {showBuscarModal && selectedBankTransaction && modalType === 'fullscreen' && (
        <BuscarExistenteFullscreen
          isOpen={showBuscarModal}
          onClose={() => {
            setShowBuscarModal(false);
            setSelectedBankTransaction(null);
          }}
          bankTransaction={selectedBankTransaction}
          onMatchFound={handleMatchFound}
        />
      )}

      {/* Modal de Buscar Existente - Versão Compacta */}
      {/* TEMPORARIAMENTE COMENTADO
      {showBuscarModal && selectedBankTransaction && modalType === 'compact' && (
        <BuscarLancamentosModal
          isOpen={showBuscarModal}
          onClose={() => {
            setShowBuscarModal(false);
            setSelectedBankTransaction(null);
          }}
          onMatch={handleMatchFound}
        />
      )}
      */}

      {/* Modal Buscar Lançamentos */}
      {showBuscarModal && selectedBankTransaction && modalType === 'compact' && (
        <BuscarLancamentosModal
          isOpen={showBuscarModal}
          onClose={() => {
            setShowBuscarModal(false);
            setSelectedBankTransaction(null);
          }}
          onMatch={handleMatchFound}
          valorExtrato={selectedBankTransaction.amount}
          dataExtrato={selectedBankTransaction.posted_at}
        />
      )}

      {/* Modal de Ignorar Transação */}
      {showIgnorarModal && selectedBankTransaction && (
        <IgnorarTransacaoModal
          isOpen={showIgnorarModal}
          onClose={() => {
            setShowIgnorarModal(false);
            setSelectedBankTransaction(null);
          }}
          bankTransaction={selectedBankTransaction}
          onIgnored={handleIgnored}
        />
      )}
    </div>
  );
}

// =========================================================
// COMPONENTE PARA CADA PAR DE CONCILIAÇÃO
// =========================================================

interface ReconciliationPairCardProps {
  pair: ReconciliationPair;
  onConfirm: (pair: ReconciliationPair, action: any) => void;
  onCreateLancamento: (bankTransaction: BankTransaction) => void;
  onCreateTransferencia: (bankTransaction: BankTransaction) => void;
  onBuscarExistente: (bankTransaction: BankTransaction) => void;
  onIgnorar: (bankTransaction: BankTransaction) => void;
}

function ReconciliationPairCard({ 
  pair, 
  onConfirm, 
  onCreateLancamento, 
  onCreateTransferencia,
  onBuscarExistente,
  onIgnorar
}: ReconciliationPairCardProps) {
  const getStatusBadge = () => {
    switch (pair.status) {
      case 'matched':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Conciliado</Badge>;
      case 'suggested':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Sugerido</Badge>;
      case 'no_match':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Sem Match</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Coluna do Extrato Bancário */}
          <div className="p-6 bg-blue-50 border-r">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-900">Extrato Bancário</h3>
              {pair.bankTransaction?.transaction_type === 'CREDIT' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            
            {pair.bankTransaction ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Data:</span>
                  <span className="font-medium">{formatDate(pair.bankTransaction.posted_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className={`font-bold ${pair.bankTransaction.transaction_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(pair.bankTransaction.amount)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <p className="text-sm mt-1 break-words">{pair.bankTransaction.description}</p>
                </div>
                {pair.bankTransaction.fit_id && (
                  <div className="text-xs text-gray-500">
                    FITID: {pair.bankTransaction.fit_id}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Sem transação bancária
              </div>
            )}
          </div>

          {/* Coluna Central - Ações */}
          <div className="p-6 flex flex-col items-center justify-center bg-gray-50">
            <div className="mb-4">
              {getStatusBadge()}
            </div>
            
            {pair.matchScore && (
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-gray-700">
                  {Math.round(pair.matchScore * 100)}%
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
            )}

            <div className="space-y-2 w-full">
              {pair.status === 'suggested' && pair.systemTransaction && (
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => onConfirm(pair, {
                    type: 'match',
                    system_transaction_id: pair.systemTransaction?.id
                  })}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Conciliar
                </Button>
              )}

              {pair.status === 'no_match' && (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => pair.bankTransaction && onCreateLancamento(pair.bankTransaction)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Lançamento
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => pair.bankTransaction && onCreateTransferencia(pair.bankTransaction)}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Transferência
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => pair.bankTransaction && onBuscarExistente(pair.bankTransaction)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Existente
                  </Button>
                </div>
              )}

              {pair.status !== 'matched' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => pair.bankTransaction && onIgnorar(pair.bankTransaction)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Ignorar
                </Button>
              )}
            </div>
          </div>

          {/* Coluna do Sistema */}
          <div className="p-6 bg-purple-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-purple-900">Sistema</h3>
              {pair.systemTransaction && (
                <div className={`w-3 h-3 rounded-full ${
                  pair.systemTransaction.tipo === 'receita' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              )}
            </div>
            
            {pair.systemTransaction ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Data:</span>
                  <span className="font-medium">{formatDate(pair.systemTransaction.data_lancamento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className={`font-bold ${pair.systemTransaction.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(pair.systemTransaction.valor)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <p className="text-sm mt-1 break-words">{pair.systemTransaction.descricao}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {pair.systemTransaction.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                {pair.status === 'no_match' ? 'Sem correspondência' : 'Aguardando match'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
