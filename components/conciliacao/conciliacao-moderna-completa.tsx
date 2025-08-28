// =========================================================
// COMPONENTE PRINCIPAL DE CONCILIAÇÃO BANCÁRIA - VERSÃO COMPLETA
// UI em duas colunas com arquitetura melhorada e funcionalidades completas
// =========================================================

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, Upload, Search, Filter, ArrowUpDown, CheckCircle, AlertCircle, X, Eye, EyeOff,
  Check, Clock, ArrowLeftRight, TrendingUp, TrendingDown, Plus, Unlink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Utility Functions
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

const logError = (message: string, error: any, context: any = {}) => {
  console.error(message, {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context,
    timestamp: new Date().toISOString()
  });
};

// Types
interface BankTransaction {
  id: string;
  fit_id?: string;
  memo?: string;
  payee?: string;
  amount: number;
  posted_at: string;
  reconciliation_status?: string;
  matched_lancamento_id?: string;
  transaction_type?: string;
}

interface SystemTransaction {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  centro_custo?: string;
  plano_conta?: string;
  numero_documento?: string;
}

interface ReconciliationPair {
  id: string;
  bankTransaction?: BankTransaction;
  systemTransaction?: SystemTransaction;
  systemTransactions?: SystemTransaction[];
  matchScore?: number;
  matchType?: string;
  status: 'matched' | 'suggested' | 'no_match' | 'transfer';
  matchReason?: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_atual: number;
}

interface ConciliacaoModernaProps {
  className?: string;
}

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

function ConciliacaoModerna({ className }: ConciliacaoModernaProps) {
  const { toast } = useToast();

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [pairs, setPairs] = useState<ReconciliationPair[]>([]);
  const [reconciliationId, setReconciliationId] = useState<string>('');

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Estados para seleções múltiplas
  const [selectedBankTransactions, setSelectedBankTransactions] = useState<Set<string>>(new Set());
  const [selectedSystemTransactions, setSelectedSystemTransactions] = useState<Set<string>>(new Set());

  // Estados para modais
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBuscarModal, setShowBuscarModal] = useState(false);
  const [showIgnorarModal, setShowIgnorarModal] = useState(false);
  const [selectedBankTransaction, setSelectedBankTransaction] = useState<BankTransaction | null>(null);

  // Carregar contas bancárias
  const loadBankAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (!response.ok) throw new Error('Erro ao carregar contas bancárias');
      
      const data = await response.json();
      setContasBancarias(data.data || []);
    } catch (error) {
      logError('Erro ao carregar contas bancárias:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar contas bancárias",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Carregar sugestões de conciliação
  const loadSuggestions = useCallback(async (force = false) => {
    if (!selectedBankAccountId) {
      setPairs([]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Carregando sugestões de conciliação...', { 
        bankAccountId: selectedBankAccountId, 
        force 
      });

      const url = `/api/reconciliation/suggestions?bank_account_id=${selectedBankAccountId}${force ? '&force=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Dados de conciliação recebidos:', data);

      if (data.reconciliation_id) {
        setReconciliationId(data.reconciliation_id);
      }

      setPairs(data.pairs || []);

      toast({
        title: "Sucesso",
        description: `${data.pairs?.length || 0} pares de conciliação carregados`,
      });

    } catch (error) {
      logError('Erro ao carregar sugestões:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar sugestões",
        variant: "destructive",
      });
      setPairs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBankAccountId, toast]);

  // Upload de arquivo OFX
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedBankAccountId) {
      toast({
        title: "Atenção",
        description: "Selecione uma conta bancária antes de fazer upload",
        variant: "destructive",
      });
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bank_account_id', selectedBankAccountId);

      const response = await fetch('/api/reconciliation/upload-ofx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Upload realizado com sucesso!",
        description: `${result.imported_count || 0} transações importadas`,
      });

      // Recarregar sugestões
      setTimeout(() => {
        loadSuggestions(true);
      }, 1000);

    } catch (error) {
      logError('Erro no upload:', error);
      toast({
        title: "Erro no Upload",
        description: error instanceof Error ? error.message : "Falha no upload do arquivo",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Confirmar match com tratamento robusto de erro
  const confirmMatch = async (pair: ReconciliationPair, action: any) => {
    console.log('🎯 INICIANDO CONFIRMAÇÃO:', {
      pairId: pair.id,
      bankTransactionId: pair.bankTransaction?.id,
      systemTransactionId: pair.systemTransaction?.id,
      currentStatus: pair.status,
      action,
      reconciliationId,
      timestamp: new Date().toISOString()
    });

    // Validações básicas
    if (!reconciliationId) {
      toast({
        title: "Erro de Sessão",
        description: "Sessão de conciliação não encontrada. Recarregue a página.",
        variant: "destructive",
      });
      return;
    }

    if (!pair.bankTransaction?.id) {
      toast({
        title: "Erro de Dados", 
        description: "Transação bancária não encontrada.",
        variant: "destructive",
      });
      return;
    }

    // Preparar payload simplificado
    const payload = {
      reconciliation_id: reconciliationId,
      bank_transaction_id: pair.bankTransaction.id,
      ...(pair.systemTransaction?.id && { 
        system_transaction_id: pair.systemTransaction.id 
      }),
      action: typeof action === 'string' ? action : action?.action || 'confirm'
    };
    
    console.log('📡 PAYLOAD:', payload);

    try {
      const response = await fetch('/api/reconciliation/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📋 RESPOSTA:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
          // Usar mensagem padrão se não conseguir fazer parse
        }

        console.error('❌ Erro na confirmação:', {
          status: response.status,
          message: errorMessage,
          payload
        });

        toast({
          title: "❌ Erro na Confirmação",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Sucesso
      let result = {};
      try {
        const resultText = await response.text();
        result = resultText ? JSON.parse(resultText) : {};
      } catch (parseError) {
        result = { success: true };
      }

      console.log('✅ CONFIRMAÇÃO REALIZADA:', result);

      const actionType = action?.action || action;
      const successMessage = actionType === 'confirm_transfer' ? 'Transferência confirmada com sucesso' : 
                           actionType === 'reject' ? 'Match rejeitado com sucesso' :
                           'Conciliação confirmada com sucesso';

      toast({
        title: "✅ Sucesso!",
        description: successMessage,
      });

      // Atualizar status localmente
      setPairs(prevPairs => 
        prevPairs.map(p => 
          p.id === pair.id 
            ? { ...p, status: actionType === 'reject' ? 'no_match' as const : 'matched' as const }
            : p
        )
      );

      // Recarregar dados
      setTimeout(() => {
        loadSuggestions(true);
      }, 500);

    } catch (error) {
      console.error('❌ Erro na confirmação:', error);
      
      let errorMessage = 'Falha ao confirmar conciliação';
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Desconciliar transações conciliadas
  const desconciliarMatch = async (pair: ReconciliationPair) => {
    try {
      const response = await fetch('/api/reconciliation/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconciliation_id: reconciliationId,
          bank_transaction_id: pair.bankTransaction?.id,
          system_transaction_id: pair.systemTransaction?.id
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          logError('❌ Erro ao fazer parse do erro JSON:', parseError, {
            unlinkStatus: response.status,
            unlinkUrl: response.url
          });
          errorData = { message: `Erro ${response.status}: ${response.statusText}` };
        }
        logError('❌ Erro na resposta de desconciliação:', new Error(`Unlink failed: ${response.status}`), {
          status: response.status,
          statusText: response.statusText,
          errorData,
          pair: pair.id
        });
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Sucesso",
        description: result.message || "Conciliação desfeita com sucesso",
      });

      // Atualizar o status do par localmente para feedback imediato
      setPairs(prevPairs => 
        prevPairs.map(p => {
          if (p.id === pair.id) {
            // Após desvincular, se há transação do sistema, volta para 'suggested' (azul)
            if (p.systemTransaction && p.bankTransaction) {
              return { ...p, status: 'suggested' };
            }
            // Se não há transação do sistema, vai para 'no_match'
            return { ...p, status: 'no_match' };
          }
          return p;
        })
      );

    } catch (error) {
      logError('❌ Erro ao desconciliar match:', error, {
        pair: pair.id,
        bankAccountId: selectedBankAccountId
      });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Falha ao desfazer conciliação. Tente novamente.";
        
      toast({
        title: "Erro na Desconciliação",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Funções para gerenciar checkboxes
  const handleBankTransactionCheck = (transactionId: string, checked: boolean) => {
    setSelectedBankTransactions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(transactionId);
      } else {
        newSet.delete(transactionId);
      }
      return newSet;
    });
  };

  const handleSystemTransactionCheck = (transactionId: string, checked: boolean) => {
    setSelectedSystemTransactions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(transactionId);
      } else {
        newSet.delete(transactionId);
      }
      return newSet;
    });
  };

  // Handlers para ações
  const handleCreateLancamento = (bankTransaction: BankTransaction) => {
    console.log('Criar lançamento para:', bankTransaction);
  };

  const handleCreateTransferencia = (bankTransaction: BankTransaction) => {
    console.log('Criar transferência para:', bankTransaction);
  };

  const handleBuscarExistente = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setShowBuscarModal(true);
  };

  const handleIgnorar = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setShowIgnorarModal(true);
  };

  const handleMatchFound = (lancamento: any) => {
    console.log('Match encontrado:', lancamento);
    setShowBuscarModal(false);
    // Aqui você implementaria a lógica para criar o match
  };

  const handleIgnored = () => {
    console.log('Transação ignorada');
    setShowIgnorarModal(false);
    // Aqui você implementaria a lógica para ignorar a transação
  };

  // Classificar status do par
  const classifyPairStatus = useCallback((pair: ReconciliationPair): 'matched' | 'suggested' | 'no_match' | 'transfer' => {
    // Se já tem status definido, usar ele
    if (pair.status && ['matched', 'suggested', 'no_match', 'transfer'].includes(pair.status)) {
      return pair.status;
    }

    // Lógica de classificação baseada nos dados
    if (!pair.bankTransaction) return 'no_match';
    
    if (pair.systemTransaction) {
      // Se score alto ou já confirmado
      if (pair.matchScore && pair.matchScore > 0.8) return 'matched';
      
      // Se é transferência
      if (pair.systemTransaction.tipo === 'transferencia') return 'transfer';
      
      // Senão é sugestão
      return 'suggested';
    }

    return 'no_match';
  }, []);

  // Filtros aplicados
  const filteredPairs = useMemo(() => {
    return pairs.filter(pair => {
      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const bankMemo = pair.bankTransaction?.memo?.toLowerCase() || '';
        const systemDesc = pair.systemTransaction?.descricao?.toLowerCase() || '';
        if (!bankMemo.includes(searchLower) && !systemDesc.includes(searchLower)) {
          return false;
        }
      }

      // Filtro por status
      if (statusFilter !== 'all') {
        const pairStatus = classifyPairStatus(pair);
        if (pairStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [pairs, searchTerm, statusFilter, classifyPairStatus]);

  // Effects
  useEffect(() => {
    loadBankAccounts();
  }, [loadBankAccounts]);

  useEffect(() => {
    if (selectedBankAccountId) {
      loadSuggestions();
    }
  }, [selectedBankAccountId, loadSuggestions]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = pairs.length;
    const matched = pairs.filter(p => classifyPairStatus(p) === 'matched').length;
    const suggested = pairs.filter(p => classifyPairStatus(p) === 'suggested').length;
    const noMatch = pairs.filter(p => classifyPairStatus(p) === 'no_match').length;
    const transfer = pairs.filter(p => classifyPairStatus(p) === 'transfer').length;

    return { total, matched, suggested, noMatch, transfer };
  }, [pairs, classifyPairStatus]);

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conciliação Bancária</h1>
          <p className="text-gray-600">Gerencie e concilie suas transações bancárias</p>
        </div>
        
        <div className="flex gap-3">
          <input
            type="file"
            accept=".ofx,.qfx"
            onChange={handleFileUpload}
            className="hidden"
            id="ofx-upload"
          />
          <label htmlFor="ofx-upload">
            <Button disabled={uploadLoading || !selectedBankAccountId} asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploadLoading ? 'Enviando...' : 'Upload OFX'}
              </span>
            </Button>
          </label>
          
          <Button 
            variant="outline" 
            onClick={() => loadSuggestions(true)}
            disabled={loading || !selectedBankAccountId}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Seleção da Conta e Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conta Bancária</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {contasBancarias.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.nome} - {conta.banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
                <div className="text-sm text-gray-500">Conciliados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.suggested}</div>
                <div className="text-sm text-gray-500">Sugeridos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.transfer}</div>
                <div className="text-sm text-gray-500">Transferências</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.noMatch}</div>
                <div className="text-sm text-gray-500">Sem Match</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="matched">Conciliados</SelectItem>
                <SelectItem value="suggested">Sugeridos</SelectItem>
                <SelectItem value="transfer">Transferências</SelectItem>
                <SelectItem value="no_match">Sem Match</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pares */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Carregando transações...</p>
          </div>
        ) : filteredPairs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma transação encontrada</p>
            {!selectedBankAccountId && (
              <p className="text-sm text-gray-500 mt-2">Selecione uma conta bancária para começar</p>
            )}
          </div>
        ) : (
          filteredPairs.map(pair => (
            <ReconciliationPairCard
              key={pair.id}
              pair={pair}
              onConfirm={confirmMatch}
              onUnlink={desconciliarMatch}
              onCreateLancamento={handleCreateLancamento}
              onCreateTransferencia={handleCreateTransferencia}
              onBuscarExistente={handleBuscarExistente}
              onIgnorar={handleIgnorar}
              selectedBankTransactions={selectedBankTransactions}
              selectedSystemTransactions={selectedSystemTransactions}
              onBankTransactionCheck={handleBankTransactionCheck}
              onSystemTransactionCheck={handleSystemTransactionCheck}
              classifyPairStatus={classifyPairStatus}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <Dialog open={showBuscarModal} onOpenChange={setShowBuscarModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Buscar Lançamento Existente</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Funcionalidade de busca será implementada aqui</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setShowBuscarModal(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIgnorarModal} onOpenChange={setShowIgnorarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ignorar Transação</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Tem certeza que deseja ignorar esta transação?</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setShowIgnorarModal(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleIgnored}>
                Ignorar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =========================================================
// COMPONENTE PARA CADA PAR DE CONCILIAÇÃO
// =========================================================

interface ReconciliationPairCardProps {
  pair: ReconciliationPair;
  onConfirm: (pair: ReconciliationPair, action: any) => void;
  onUnlink: (pair: ReconciliationPair) => void;
  onCreateLancamento: (bankTransaction: BankTransaction) => void;
  onCreateTransferencia: (bankTransaction: BankTransaction) => void;
  onBuscarExistente: (bankTransaction: BankTransaction) => void;
  onIgnorar: (bankTransaction: BankTransaction) => void;
  selectedBankTransactions: Set<string>;
  selectedSystemTransactions: Set<string>;
  onBankTransactionCheck: (transactionId: string, checked: boolean) => void;
  onSystemTransactionCheck: (transactionId: string, checked: boolean) => void;
  classifyPairStatus: (pair: ReconciliationPair) => 'matched' | 'suggested' | 'no_match' | 'transfer';
}

function ReconciliationPairCard({ 
  pair, 
  onConfirm, 
  onUnlink,
  onCreateLancamento, 
  onCreateTransferencia,
  onBuscarExistente,
  onIgnorar,
  selectedBankTransactions,
  selectedSystemTransactions,
  onBankTransactionCheck,
  onSystemTransactionCheck,
  classifyPairStatus
}: ReconciliationPairCardProps) {
  
  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = safeNumber(value, 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(safeValue);
  };

  // Função para determinar se é entrada ou saída e retornar estilos apropriados
  const getTransactionTypeStyles = (amount: number | undefined | null, transactionType?: string) => {
    if (!amount && !transactionType) return { 
      icon: AlertCircle, 
      iconColor: 'text-gray-400',
      textColor: 'text-gray-900',
      tag: 'Indefinido',
      tagColor: 'bg-gray-100 text-gray-600'
    };

    // Determinar se é entrada baseado no contexto
    let isCredit = false;
    
    // Para transações do sistema ERP - verificar tipo exato
    if (transactionType === 'receita') {
      isCredit = true;
    } else if (transactionType === 'despesa') {
      isCredit = false;
    } else if (transactionType === 'transferencia') {
      // Para transferências, usar o valor para determinar direção
      isCredit = (amount || 0) > 0;
    } else if (transactionType === 'CREDIT' || transactionType === 'credit') {
      // Para OFX - tipo CREDIT
      isCredit = true;
    } else if (transactionType === 'DEBIT' || transactionType === 'debit') {
      // Para OFX - tipo DEBIT
      isCredit = false;
    } else {
      // Fallback: usar o valor para determinar
      // Valor positivo = entrada, Valor negativo = saída
      isCredit = (amount || 0) > 0;
    }
    
    return {
      icon: isCredit ? TrendingUp : TrendingDown,
      iconColor: isCredit ? 'text-green-500' : 'text-red-500',
      textColor: isCredit ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold',
      tag: isCredit ? 'Entrada' : 'Saída',
      tagColor: isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    };
  };

  // Componente para renderizar valor com indicadores visuais
  const ValueDisplay = ({ 
    amount, 
    transactionType, 
    showTag = true, 
    size = 'sm' 
  }: { 
    amount: number | undefined | null; 
    transactionType?: string; 
    showTag?: boolean;
    size?: 'xs' | 'sm';
  }) => {
    const styles = getTransactionTypeStyles(amount, transactionType);
    const iconSize = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4';
    const textSize = size === 'xs' ? 'text-xs' : 'text-sm';
    
    return (
      <div className="flex items-center gap-2">
        {/* Valor */}
        <span className={`${textSize} ${styles.textColor}`}>
          {formatCurrency(amount)}
        </span>
        
        {/* Ícone */}
        <styles.icon className={`${iconSize} ${styles.iconColor}`} />
        
        {/* Tag (se habilitada) */}
        {showTag && (
          <Badge className={`text-xs px-1.5 py-0.5 ${styles.tagColor}`} variant="secondary">
            {styles.tag}
          </Badge>
        )}
      </div>
    );
  };

  const formatDate = (date: string | undefined | null) => {
    if (!date) return 'Data inválida';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
      }
      return dateObj.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // Função para gerar badges de status corretos
  const getStatusBadge = (pair: ReconciliationPair) => {
    const status = classifyPairStatus(pair);
    
    switch (status) {
      case 'matched':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conciliado {pair.matchScore ? `(${(pair.matchScore * 100).toFixed(0)}%)` : ''}
          </Badge>
        );
      case 'suggested':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Sugerido {pair.matchScore ? `(${(pair.matchScore * 100).toFixed(0)}%)` : ''}
          </Badge>
        );
      case 'transfer':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <ArrowLeftRight className="w-3 h-3 mr-1" />
            Transferência {pair.matchScore ? `(${(pair.matchScore * 100).toFixed(0)}%)` : ''}
          </Badge>
        );
      case 'no_match':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Sem match
          </Badge>
        );
      default:
        return null;
    }
  };

  // Variantes padronizadas para os cards baseado no status real
  const getCardVariants = (pair: ReconciliationPair, type: 'bank' | 'system') => {
    const status = classifyPairStatus(pair);
    const baseClasses = "border transition-all duration-200 hover:shadow-md";
    
    // Cards verdes para conciliados (matches exatos)
    if (status === 'matched') {
      return type === 'bank' 
        ? `${baseClasses} border-green-200 bg-green-50 hover:border-green-300`
        : `${baseClasses} border-green-200 bg-green-50 hover:border-green-300`;
    }
    
    // Cards amarelos para sugeridos
    if (status === 'suggested') {
      return type === 'bank' 
        ? `${baseClasses} border-yellow-200 bg-yellow-50 hover:border-yellow-300`
        : `${baseClasses} border-yellow-200 bg-yellow-50 hover:border-yellow-300`;
    }
    
    // Cards azuis para transferências
    if (status === 'transfer') {
      return type === 'bank' 
        ? `${baseClasses} border-blue-200 bg-blue-50 hover:border-blue-300`
        : `${baseClasses} border-blue-200 bg-blue-50 hover:border-blue-300`;
    }
    
    // Cards brancos para sem match (visual mais limpo)
    return type === 'bank' 
      ? `${baseClasses} border-gray-200 bg-white hover:border-gray-300`
      : `${baseClasses} border-gray-200 bg-white hover:border-gray-300`;
  };

  return (
    <div className="flex gap-4 items-stretch">
      {/* Card do Extrato Bancário */}
      <Card className={cn("flex-1 min-h-[280px] flex flex-col", getCardVariants(pair, 'bank'))}>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={pair.bankTransaction ? selectedBankTransactions.has(pair.bankTransaction.id || '') : false}
                onCheckedChange={(checked: boolean) => {
                  if (pair.bankTransaction?.id) {
                    onBankTransactionCheck(pair.bankTransaction.id, checked as boolean);
                  }
                }}
              />
              <h3 className="font-semibold text-sm text-gray-900">Extrato Bancário</h3>
            </div>
            {getStatusBadge(pair)}
          </div>

          {pair.bankTransaction ? (
            <div className="space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Data</p>
                  <p className="text-sm font-medium">{formatDate(pair.bankTransaction.posted_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Valor</p>
                  <ValueDisplay 
                    amount={pair.bankTransaction.amount} 
                    transactionType={pair.bankTransaction.transaction_type}
                    showTag={true}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 font-medium">Descrição</p>
                <p className="text-sm">{pair.bankTransaction.memo || 'Sem descrição'}</p>
              </div>
              
              {pair.bankTransaction.fit_id && (
                <div>
                  <p className="text-xs text-gray-500 font-medium">FITID</p>
                  <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{pair.bankTransaction.fit_id}</p>
                </div>
              )}
              
              {pair.matchReason && (
                <div>
                  <p className="text-xs text-gray-500 font-medium">Critérios de Match</p>
                  <p className="text-xs text-blue-600">{pair.matchReason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="text-sm font-medium text-amber-600">Erro: Transação sem origem bancária</p>
                <p className="text-xs text-gray-500">Este item não deveria aparecer na conciliação</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Área Central - Botões de Ação */}
      <div className="flex flex-col items-center justify-center min-h-[200px] px-4">
        {classifyPairStatus(pair) === 'suggested' && (
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              onClick={() => onConfirm(pair, { action: 'confirm' })}
            >
              <Check className="w-4 h-4 mr-1" />
              Confirmar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onConfirm(pair, { action: 'reject' })}
            >
              <X className="w-4 h-4 mr-1" />
              Rejeitar
            </Button>
          </div>
        )}
        
        {classifyPairStatus(pair) === 'matched' && (
          <div className="flex flex-col gap-2 items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onUnlink(pair)}
            >
              <Unlink className="w-4 h-4 mr-1" />
              Desconciliar
            </Button>
          </div>
        )}
        
        {classifyPairStatus(pair) === 'transfer' && (
          <div className="flex flex-col gap-2 items-center">
            <ArrowLeftRight className="w-8 h-8 text-blue-500" />
            <Button 
              size="sm" 
              onClick={() => onConfirm(pair, { action: 'confirm_transfer' })}
            >
              <Check className="w-4 h-4 mr-1" />
              Confirmar
            </Button>
          </div>
        )}
        
        {classifyPairStatus(pair) === 'no_match' && (
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Sem correspondência</p>
          </div>
        )}
      </div>

      {/* Card do Sistema ERP */}
      <Card className={cn("flex-1 min-h-[280px] flex flex-col", getCardVariants(pair, 'system'))}>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={pair.systemTransaction ? selectedSystemTransactions.has(pair.systemTransaction.id || '') : false}
                onCheckedChange={(checked: boolean) => {
                  if (pair.systemTransaction?.id) {
                    onSystemTransactionCheck(pair.systemTransaction.id, checked as boolean);
                  }
                }}
              />
              <h3 className="font-semibold text-sm text-gray-900">Sistema ERP</h3>
            </div>
          </div>

          {pair.systemTransaction ? (
            <div className="space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Data</p>
                  <p className="text-sm font-medium">{formatDate(pair.systemTransaction.data_lancamento)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Valor</p>
                  <ValueDisplay 
                    amount={pair.systemTransaction.valor} 
                    transactionType={pair.systemTransaction.tipo}
                    showTag={true}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 font-medium">Descrição</p>
                <p className="text-sm">{pair.systemTransaction.descricao || 'Sem descrição'}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 font-medium">Tipo</p>
                <p className="text-sm capitalize">{pair.systemTransaction.tipo}</p>
              </div>
              
              {pair.systemTransaction.numero_documento && (
                <div>
                  <p className="text-xs text-gray-500 font-medium">Documento</p>
                  <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{pair.systemTransaction.numero_documento}</p>
                </div>
              )}
            </div>
          ) : pair.systemTransactions && pair.systemTransactions.length > 0 ? (
            <div className="space-y-3 flex-1">
              <p className="text-sm font-medium">{pair.systemTransactions.length} lançamentos relacionados</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pair.systemTransactions.map((tx, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <span>{formatDate(tx.data_lancamento)}</span>
                      <ValueDisplay 
                        amount={tx.valor} 
                        transactionType={tx.tipo}
                        showTag={false}
                        size="xs"
                      />
                    </div>
                    <p className="text-gray-600 truncate">{tx.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-sm">Aguardando lançamento</p>
                <p className="text-xs text-gray-400">Criar novo ou buscar existente</p>
              </div>
              
              {/* Botões de ação para transações sem match */}
              {classifyPairStatus(pair) === 'no_match' && pair.bankTransaction && (
                <div className="mt-4 w-full grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onCreateLancamento(pair.bankTransaction!)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Criar Lançamento
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onCreateTransferencia(pair.bankTransaction!)}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-1" />
                    Transferência
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onBuscarExistente(pair.bankTransaction!)}
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Buscar Existente
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onIgnorar(pair.bankTransaction!)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Ignorar
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ConciliacaoModerna;
