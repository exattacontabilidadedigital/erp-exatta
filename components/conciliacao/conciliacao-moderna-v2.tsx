// =========================================================
// CONCILIAÇÃO BANCÁRIA MODERNA - V2
// Baseado no blueprint fornecido
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
  TrendingDown,
  FileText,
  Calendar,
  Banknote
} from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LancamentosForm } from "@/components/lancamentos/lancamentos-form";

// Tipos baseados no blueprint
interface BankTransaction {
  id: string;
  fit_id: string;
  memo: string;
  payee?: string;
  amount: number;
  posted_at: string;
  transaction_type: 'DEBIT' | 'CREDIT';
  check_number?: string;
  reference_number?: string;
  bank_reference?: string;
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
  conta_bancaria_id?: string;
}

interface ReconciliationPair {
  id: string;
  bankTransaction?: BankTransaction;
  systemTransaction?: SystemTransaction;
  systemTransactions?: SystemTransaction[];
  status: 'conciliado' | 'sugerido' | 'transferencia' | 'sem_match' | 'conflito' | 'pendente';
  matchScore: number;
  matchReason: string;
  confidenceLevel: '100%' | 'provavel' | 'manual' | 'baixo';
  ruleApplied?: string;
  conflictDetails?: string;
  auditTrail?: AuditLog[];
}

interface ReconciliationSummary {
  total: number;
  conciliados: number;
  sugeridos: number;
  transferencias: number;
  sem_match: number;
  conflitos: number;
  pendentes: number;
  percentageComplete: number;
}

interface AuditLog {
  id: string;
  action: 'importacao' | 'conciliacao' | 'conflito' | 'manual' | 'auto';
  user_id: string;
  timestamp: string;
  details: {
    bank_transaction_id?: string;
    system_transaction_id?: string;
    rule_applied?: string;
    confidence_level?: string;
    conflict_reason?: string;
    [key: string]: any;
  };
}

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_atual: number;
}

interface ConciliacaoModernaV2Props {
  className?: string;
  preSelectedBankAccountId?: string;
  preSelectedBankAccountName?: string;
}

export function ConciliacaoModernaV2({ className, preSelectedBankAccountId, preSelectedBankAccountName }: ConciliacaoModernaV2Props) {
  const { toast } = useToast();
  const { userData, empresaData } = useAuth();

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(preSelectedBankAccountId || '');
  const [pairs, setPairs] = useState<ReconciliationPair[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [reconciliationId, setReconciliationId] = useState<string>('');


  // Estados para período
  const [periodo, setPeriodo] = useState<{ mes: string, ano: string }>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return { mes: pad(now.getMonth() + 1), ano: now.getFullYear().toString() };
  });

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados para modais
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false);
  const [showBuscarLancamentosModal, setShowBuscarLancamentosModal] = useState(false);
  const [selectedBankTransaction, setSelectedBankTransaction] = useState<BankTransaction | null>(null);

  // Carregar contas bancárias
  const loadBankAccounts = useCallback(async () => {
    if (!empresaData?.id) return;

    try {
      const response = await fetch(`/api/contas-bancarias?empresa_id=${empresaData.id}`);
      if (response.ok) {
        const data = await response.json();
        setContasBancarias(data);
      }
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  }, [empresaData?.id]);



  // Carregar sugestões de conciliação
  const loadSuggestions = useCallback(async () => {
    if (!selectedBankAccountId || !empresaData?.id) return;

    setLoading(true);
    try {
      const periodStart = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-01`;
      const lastDay = new Date(Number(periodo.ano), Number(periodo.mes), 0).getDate();
      const periodEnd = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const response = await fetch(
        `/api/reconciliation/suggestions?bank_account_id=${selectedBankAccountId}&period_start=${periodStart}&period_end=${periodEnd}&empresa_id=${empresaData.id}`
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar sugestões');
      }

      const data = await response.json();
      setPairs(data.pairs || []);
      setSummary(data.summary || null);
      setReconciliationId(data.reconciliation_id || '');
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar sugestões de conciliação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBankAccountId, periodo, empresaData?.id, toast]);

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
      formData.append('empresa_id', empresaData?.id || '');
      formData.append('user_id', userData?.id || '');

      const response = await fetch('/api/reconciliation/upload-ofx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no upload');
      }

      const result = await response.json();

      toast({
        title: "Upload realizado com sucesso!",
        description: `${result.imported_count || 0} transações importadas`,
      });

      // Recarregar dados
      setTimeout(() => {
        loadSuggestions();
      }, 1000);

    } catch (error) {
      toast({
        title: "Erro no Upload",
        description: error instanceof Error ? error.message : "Falha no upload do arquivo",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Filtrar pairs baseado no status
  const filteredPairs = pairs.filter(pair => {
    if (statusFilter === 'all') return true;
    return pair.status === statusFilter;
  });

  // Filtrar por termo de busca
  const searchFilteredPairs = filteredPairs.filter(pair => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      pair.bankTransaction?.memo.toLowerCase().includes(searchLower) ||
      pair.systemTransaction?.descricao.toLowerCase().includes(searchLower) ||
      pair.bankTransaction?.payee?.toLowerCase().includes(searchLower)
    );
  });

  // Funções para abrir modais
  const handleOpenLancamentoModal = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setShowLancamentoModal(true);
  };

  const handleOpenTransferenciaModal = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setShowTransferenciaModal(true);
  };

  const handleOpenBuscarLancamentosModal = (bankTransaction: BankTransaction) => {
    setSelectedBankTransaction(bankTransaction);
    setShowBuscarLancamentosModal(true);
  };

  const handleCloseModals = () => {
    setShowLancamentoModal(false);
    setShowTransferenciaModal(false);
    setShowBuscarLancamentosModal(false);
    setSelectedBankTransaction(null);
  };

  // Sistema de Decision Tree para Conciliação
  const processReconciliationDecision = async (pair: ReconciliationPair, action: string, details?: any) => {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}`,
      action: action as any,
      user_id: userData?.id || 'system',
      timestamp: new Date().toISOString(),
      details: {
        bank_transaction_id: pair.bankTransaction?.id,
        system_transaction_id: pair.systemTransaction?.id,
        rule_applied: pair.ruleApplied,
        confidence_level: pair.confidenceLevel,
        ...details
      }
    };

    try {
      // Registrar log de auditoria
      await fetch('/api/reconciliation/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditLog)
      });

      // Processar ação baseada no decision tree
      switch (action) {
        case 'auto_conciliate':
          await handleAutoConciliate(pair);
          break;
        case 'manual_conciliate':
          await handleManualConciliate(pair, details);
          break;
        case 'create_lancamento':
          await handleCreateLancamento(pair);
          break;
        case 'create_transferencia':
          await handleCreateTransferencia(pair);
          break;
        case 'resolve_conflict':
          await handleResolveConflict(pair, details);
          break;
        case 'ignore_transaction':
          await handleIgnoreTransaction(pair);
          break;
      }

      // Recarregar dados após ação
      await loadSuggestions();
      
      toast({
        title: "Ação executada com sucesso!",
        description: `Transação ${action.replace('_', ' ')} processada`,
      });

    } catch (error) {
      console.error('Erro ao processar decisão de conciliação:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar ação de conciliação",
        variant: "destructive",
      });
    }
  };

  // Handlers para cada tipo de ação
  const handleAutoConciliate = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction || !pair.systemTransaction) return;
    
    await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        system_transaction_id: pair.systemTransaction.id,
        confidence_level: pair.confidenceLevel,
        rule_applied: pair.ruleApplied
      })
    });
  };

  const handleManualConciliate = async (pair: ReconciliationPair, details: any) => {
    if (!pair.bankTransaction || !details.selectedTransaction) return;
    
    await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        system_transaction_id: details.selectedTransaction.id,
        confidence_level: 'manual',
        rule_applied: 'manual_selection'
      })
    });
  };

  const handleCreateLancamento = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction) return;
    
    // Abrir modal de lançamento
    setSelectedBankTransaction(pair.bankTransaction);
    setShowLancamentoModal(true);
  };

  const handleCreateTransferencia = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction) return;
    
    // Abrir modal de transferência
    setSelectedBankTransaction(pair.bankTransaction);
    setShowTransferenciaModal(true);
  };

  const handleResolveConflict = async (pair: ReconciliationPair, details: any) => {
    if (!pair.bankTransaction) return;
    
    await fetch('/api/reconciliation/resolve-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        resolution: details.resolution,
        selected_transaction_id: details.selectedTransactionId
      })
    });
  };

  const handleIgnoreTransaction = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction) return;
    
    await fetch('/api/reconciliation/ignore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        reason: 'user_ignored'
      })
    });
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadBankAccounts();
  }, [loadBankAccounts]);

  // Carregar dados quando conta ou período mudar
  useEffect(() => {
    if (selectedBankAccountId) {
      loadSuggestions();
    }
  }, [selectedBankAccountId, loadSuggestions]);

  return (
    <div className={`space-y-6 ${className}`}>


      {/* Resumo da Conciliação */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo da Conciliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.conciliados}</div>
                <div className="text-sm text-gray-600">Conciliados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.sugeridos}</div>
                <div className="text-sm text-gray-600">Sugeridos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.transferencias}</div>
                <div className="text-sm text-gray-600">Transferências</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{summary.sem_match}</div>
                <div className="text-sm text-gray-600">Sem Match</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.conflitos || 0}</div>
                <div className="text-sm text-gray-600">Conflitos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.pendentes || 0}</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progresso</span>
                <span>{summary.percentageComplete.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${summary.percentageComplete}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por descrição, beneficiário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="conciliado">Conciliados</SelectItem>
                <SelectItem value="sugerido">Sugeridos</SelectItem>
                <SelectItem value="transferencia">Transferências</SelectItem>
                <SelectItem value="sem_match">Sem Match</SelectItem>
                <SelectItem value="conflito">Conflitos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Conciliação */}
      <Card>
        <CardHeader>
          <CardTitle>Conciliação Bancária</CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare transações do OFX com lançamentos do sistema
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando sugestões...</span>
            </div>
          ) : searchFilteredPairs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma transação para conciliar</p>
              <p className="text-sm">Faça upload de um arquivo OFX para começar a conciliação</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchFilteredPairs.map((pair, index) => (
                <ReconciliationCard 
                  key={index} 
                  pair={pair}
                  onOpenLancamentoModal={handleOpenLancamentoModal}
                  onOpenTransferenciaModal={handleOpenTransferenciaModal}
                  onOpenBuscarLancamentosModal={handleOpenBuscarLancamentosModal}
                  onProcessReconciliationDecision={processReconciliationDecision}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      {/* Modal de Lançamento */}
      <Dialog open={showLancamentoModal} onOpenChange={setShowLancamentoModal}>
        <DialogContent className="max-w-8xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          {selectedBankTransaction && (
            <LancamentosForm
              onSuccess={handleCloseModals}
              initialData={{
                id: '',
                tipo: selectedBankTransaction.transaction_type === 'CREDIT' ? 'receita' : 'despesa',
                data_lancamento: new Date(selectedBankTransaction.posted_at),
                numero_documento: '',
                plano_conta_id: '',
                centro_custo_id: '',
                valor: selectedBankTransaction.amount,
                cliente_fornecedor_id: '',
                conta_bancaria_id: '',
                forma_pagamento_id: '',
                descricao: selectedBankTransaction.memo || '',
                status: 'pago'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Transferência */}
      <Dialog open={showTransferenciaModal} onOpenChange={setShowTransferenciaModal}>
        <DialogContent className="max-w-8xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Transferência</DialogTitle>
          </DialogHeader>
          {selectedBankTransaction && (
            <LancamentosForm
              onSuccess={handleCloseModals}
              initialData={{
                id: '',
                tipo: 'transferencia',
                data_lancamento: new Date(selectedBankTransaction.posted_at),
                numero_documento: `TRANSF-${Date.now()}-${selectedBankTransaction.transaction_type === 'CREDIT' ? 'ENTRADA' : 'SAIDA'}`,
                plano_conta_id: '',
                centro_custo_id: '',
                valor: Math.abs(selectedBankTransaction.amount),
                cliente_fornecedor_id: '',
                conta_bancaria_id: '',
                forma_pagamento_id: '',
                descricao: selectedBankTransaction.memo || '',
                status: 'pago'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Buscar Lançamentos */}
      <Dialog open={showBuscarLancamentosModal} onOpenChange={setShowBuscarLancamentosModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buscar Lançamentos</DialogTitle>
          </DialogHeader>
          {selectedBankTransaction && (
            <BuscarLancamentosModal
              bankTransaction={selectedBankTransaction}
              onSelect={(lancamento) => {
                // Criar pair temporário para processar conciliação
                const tempPair: ReconciliationPair = {
                  id: `temp_${Date.now()}`,
                  bankTransaction: selectedBankTransaction,
                  systemTransaction: lancamento,
                  status: 'sugerido',
                  matchScore: 100,
                  matchReason: 'Seleção manual',
                  confidenceLevel: 'manual'
                };
                
                processReconciliationDecision(tempPair, 'manual_conciliate', {
                  selectedTransaction: lancamento
                });
                handleCloseModals();
              }}
              onCancel={handleCloseModals}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para buscar lançamentos existentes
function BuscarLancamentosModal({ 
  bankTransaction, 
  onSelect, 
  onCancel 
}: { 
  bankTransaction: BankTransaction;
  onSelect: (lancamento: any) => void;
  onCancel: () => void;
}) {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { empresaData } = useAuth();

  // Carregar lançamentos
  const loadLancamentos = useCallback(async () => {
    if (!empresaData?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/lancamentos?empresa_id=${empresaData.id}&status=pago&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setLancamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaData?.id]);

  useEffect(() => {
    loadLancamentos();
  }, [loadLancamentos]);

  // Filtrar lançamentos por termo de busca
  const filteredLancamentos = lancamentos.filter(lancamento => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lancamento.descricao?.toLowerCase().includes(searchLower) ||
      lancamento.numero_documento?.toLowerCase().includes(searchLower)
    );
  });

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
    <div className="space-y-4">
      {/* Informações da transação bancária */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Transação Bancária</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Valor:</span>
            <span className="ml-2 font-medium">{formatCurrency(bankTransaction.amount)}</span>
          </div>
          <div>
            <span className="text-blue-700">Data:</span>
            <span className="ml-2">{formatDate(bankTransaction.posted_at)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-blue-700">Descrição:</span>
            <span className="ml-2">{bankTransaction.memo || 'Sem descrição'}</span>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Buscar lançamentos:</label>
        <Input
          placeholder="Digite a descrição ou número do documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de lançamentos */}
      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Carregando lançamentos...
          </div>
        ) : filteredLancamentos.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nenhum lançamento encontrado
          </div>
        ) : (
          <div className="divide-y">
            {filteredLancamentos.map((lancamento) => (
              <div
                key={lancamento.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect(lancamento)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{lancamento.descricao}</div>
                    <div className="text-sm text-gray-600">
                      {lancamento.numero_documento && `Doc: ${lancamento.numero_documento}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(lancamento.data_lancamento)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(parseFloat(lancamento.valor))}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {lancamento.tipo}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// Componente para card de conciliação
function ReconciliationCard({ 
  pair, 
  onOpenLancamentoModal, 
  onOpenTransferenciaModal, 
  onOpenBuscarLancamentosModal,
  onProcessReconciliationDecision
}: { 
  pair: ReconciliationPair;
  onOpenLancamentoModal: (bankTransaction: BankTransaction) => void;
  onOpenTransferenciaModal: (bankTransaction: BankTransaction) => void;
  onOpenBuscarLancamentosModal: (bankTransaction: BankTransaction) => void;
  onProcessReconciliationDecision: (pair: ReconciliationPair, action: string, details?: any) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conciliado': return 'bg-green-100 text-green-800 border-green-200';
      case 'sugerido': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'transferencia': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sem_match': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'conflito': return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'conciliado': return <CheckCircle className="h-4 w-4" />;
      case 'sugerido': return <AlertCircle className="h-4 w-4" />;
      case 'transferencia': return <ArrowLeftRight className="h-4 w-4" />;
      case 'sem_match': return <X className="h-4 w-4" />;
      case 'conflito': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pendente': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4" />;
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
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="grid grid-cols-3 gap-0 min-h-[200px]">
        {/* Lado Esquerdo - Transação OFX */}
        <div className="p-4 bg-white border-r">
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1" />
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">
                {pair.bankTransaction && formatDate(pair.bankTransaction.posted_at)}
              </div>
              <div className={`font-bold text-lg mb-2 ${
                pair.bankTransaction?.transaction_type === 'CREDIT' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {pair.bankTransaction && formatCurrency(pair.bankTransaction.amount)}
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {pair.bankTransaction?.memo || 'Sem descrição'}
                </p>
                {pair.bankTransaction?.payee && (
                  <p className="text-gray-600">
                    {pair.bankTransaction.payee}
                  </p>
                )}
                <p className="text-gray-500">
                  Origem: OFX
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="outline" className="text-orange-600 border-orange-200">
              <X className="h-4 w-4 mr-1" />
              Ignorar
            </Button>
          </div>
        </div>

        {/* Centro - Botão de Ação Inteligente */}
        <div className="p-4 bg-gray-50 flex flex-col items-center justify-center space-y-2">
          {pair.status === 'conciliado' && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Conciliado
            </Badge>
          )}
          
          {pair.status === 'sugerido' && (
            <div className="space-y-2">
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Sugerido ({pair.confidenceLevel})
              </Badge>
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => onProcessReconciliationDecision(pair, 'auto_conciliate')}
              >
                Conciliar Automaticamente
              </Button>
            </div>
          )}
          
          {pair.status === 'conflito' && (
            <div className="space-y-2">
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Conflito
              </Badge>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onProcessReconciliationDecision(pair, 'resolve_conflict')}
              >
                Resolver Conflito
              </Button>
            </div>
          )}
          
          {pair.status === 'sem_match' && (
            <div className="space-y-2">
              <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                <X className="h-3 w-3 mr-1" />
                Sem Match
              </Badge>
              <Button 
                size="sm" 
                className="bg-gray-600 hover:bg-gray-700 text-white"
                onClick={() => onProcessReconciliationDecision(pair, 'ignore_transaction')}
              >
                Ignorar
              </Button>
            </div>
          )}
          
          {pair.status === 'pendente' && (
            <div className="space-y-2">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
              <Button 
                size="sm" 
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={() => onProcessReconciliationDecision(pair, 'manual_conciliate')}
              >
                Revisar
              </Button>
            </div>
          )}
        </div>

        {/* Lado Direito - Ações */}
        <div className="p-4 bg-white border-l">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => pair.bankTransaction && onOpenLancamentoModal(pair.bankTransaction)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Lançamento
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => pair.bankTransaction && onOpenTransferenciaModal(pair.bankTransaction)}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transferência
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => pair.bankTransaction && onOpenBuscarLancamentosModal(pair.bankTransaction)}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar Lançamentos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


