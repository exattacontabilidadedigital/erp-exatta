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
import { MatchingEngine } from "@/lib/matching-engine";

// Tipos baseados no blueprint com controle de duplicidade
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
  status_conciliacao: 'pendente' | 'conciliado' | 'ignorado'; // Campo para controle de duplicidade
  bank_statement_id: string;
  bank_account_id: string;
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
  status: 'conciliado' | 'sugerido' | 'transferencia' | 'sem_match' | 'conflito' | 'pendente' | 'matched' | 'suggested' | 'transfer' | 'no_match';
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

  console.log('🏦 ConciliacaoModernaV2 inicializado com:', {
    preSelectedBankAccountId,
    preSelectedBankAccountName,
    empresaId: empresaData?.id
  });

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
    if (!selectedBankAccountId || !empresaData?.id) {
      console.warn('⚠️ Dados insuficientes para carregar sugestões:', {
        selectedBankAccountId: !!selectedBankAccountId,
        empresaId: !!empresaData?.id
      });
      return;
    }

    console.log('🔄 Carregando sugestões de conciliação...');
    setLoading(true);
    try {
      const periodStart = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-01`;
      const lastDay = new Date(Number(periodo.ano), Number(periodo.mes), 0).getDate();
      const periodEnd = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const url = `/api/reconciliation/suggestions?bank_account_id=${selectedBankAccountId}&period_start=${periodStart}&period_end=${periodEnd}&empresa_id=${empresaData.id}`;
      console.log('📡 Fazendo requisição para:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API de sugestões:', { status: response.status, error: errorText });
        throw new Error(`Erro ao carregar sugestões: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Dados recebidos da API:', {
        pairsCount: data.pairs?.length || 0,
        summary: data.summary,
        reconciliationId: data.reconciliation_id,
        samplePair: data.pairs?.[0]
      });
      
      // Verificar se os dados já estão processados (têm matchScore, status, etc.)
      const isAlreadyProcessed = data.pairs?.[0]?.matchScore !== undefined && 
                                 data.pairs?.[0]?.status !== undefined;

      if (isAlreadyProcessed) {
        console.log('✅ Dados já processados pela API, usando diretamente');
        setPairs(data.pairs || []);
      } else {
        console.log('🔧 Dados não processados, aplicando matching engine no frontend...');
        // Processar dados com o matching engine aprimorado (fallback)
        if (data.pairs && data.pairs.length > 0) {
          const processedPairs = await processWithMatchingEngine(data.pairs);
          console.log('✅ Dados processados no frontend:', { processedCount: processedPairs.length });
          setPairs(processedPairs);
        } else {
          console.log('📝 Nenhum dado para processar');
          setPairs(data.pairs || []);
        }
      }
      
      setSummary(data.summary || null);
      setReconciliationId(data.reconciliation_id || '');
      
      console.log('✅ Sugestões carregadas com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao carregar sugestões:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar sugestões de conciliação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBankAccountId, periodo, empresaData?.id, toast]);

  // Função para processar os pares com o matching engine aprimorado
  const processWithMatchingEngine = async (rawPairs: any[]) => {
    try {
      console.log('🔧 Iniciando processamento com matching engine...');
      console.log('📊 Dados recebidos:', {
        totalPairs: rawPairs.length,
        samplePair: rawPairs[0]
      });

      const matchingEngine = new MatchingEngine();
      
      // Extrair transações bancárias e do sistema dos pares
      const bankTransactions = rawPairs
        .filter(pair => pair.bankTransaction)
        .map(pair => pair.bankTransaction);
      
      const systemTransactions = rawPairs
        .filter(pair => pair.systemTransaction)
        .map(pair => pair.systemTransaction);

      console.log('🔍 Transações extraídas para matching:', {
        bankTransactionsCount: bankTransactions.length,
        systemTransactionsCount: systemTransactions.length,
        sampleBankTransaction: bankTransactions[0],
        sampleSystemTransaction: systemTransactions[0]
      });

      // Se não há dados suficientes, retornar dados originais
      if (bankTransactions.length === 0) {
        console.log('⚠️ Nenhuma transação bancária encontrada para processar');
        return rawPairs;
      }
      
      // Processar matching
      console.log('🎯 Executando algoritmo de matching...');
      const matchResults = await matchingEngine.processMatching(bankTransactions, systemTransactions);
      
      console.log('✅ Resultado do matching:', {
        resultsCount: matchResults.length,
        sampleResult: matchResults[0]
      });
      
      // Converter resultados para o formato esperado pelo componente
      const processedResults = matchResults.map((result: any) => {
        const processed = {
          id: result.bankTransaction.id,
          bankTransaction: result.bankTransaction,
          systemTransaction: result.systemTransaction,
          systemTransactions: result.systemTransactions,
          status: mapMatchStatusToComponent(result.status),
          matchScore: result.matchScore / 100, // Converter para decimal
          matchReason: result.matchReason,
          confidenceLevel: getConfidenceFromScore(result.matchScore),
          ruleApplied: result.matchReason,
        };
        
        console.log('🔄 Pair processado:', {
          id: processed.id,
          status: processed.status,
          matchScore: processed.matchScore,
          hasBankTransaction: !!processed.bankTransaction,
          hasSystemTransaction: !!processed.systemTransaction
        });
        
        return processed;
      });

      console.log('✅ Processamento concluído:', { processedCount: processedResults.length });
      return processedResults;
      
    } catch (error) {
      console.error('❌ Erro no matching engine:', error);
      console.log('🔄 Retornando dados originais devido ao erro');
      return rawPairs; // Retorna dados originais em caso de erro
    }
  };

  // Função para mapear status do matching engine para o componente
  const mapMatchStatusToComponent = (status: string) => {
    switch (status) {
      case 'conciliado': return 'matched';
      case 'sugerido': return 'suggested';
      case 'transferencia': return 'transfer';
      case 'sem_match': return 'no_match';
      default: return status;
    }
  };

  // Função para determinar nível de confiança baseado no score
  const getConfidenceFromScore = (score: number): '100%' | 'provavel' | 'manual' | 'baixo' => {
    if (score >= 95) return '100%';
    if (score >= 80) return 'provavel';
    if (score >= 60) return 'manual';
    return 'baixo';
  };

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
    console.log('🔄 Abrindo modal de transferência:', {
      transactionType: bankTransaction.transaction_type,
      amount: bankTransaction.amount,
      selectedBankAccountId,
      contaOrigemId: bankTransaction.transaction_type === 'DEBIT' ? selectedBankAccountId : '',
      contaDestinoId: bankTransaction.transaction_type === 'CREDIT' ? selectedBankAccountId : '',
    });
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

  // Função para atualizar status do pair localmente (resposta imediata)
  const updatePairStatus = (pairId: string, newStatus: string) => {
    setPairs(currentPairs => {
      const updatedPairs = currentPairs.map(pair => 
        pair.id === pairId 
          ? { ...pair, status: newStatus as any }
          : pair
      );
      
      // Atualizar summary também baseado nos novos pairs
      setSummary(currentSummary => {
        if (!currentSummary) return currentSummary;
        
        const newSummary = {
          ...currentSummary,
          conciliados: updatedPairs.filter(p => p.status === 'conciliado' || p.status === 'matched').length,
          sugeridos: updatedPairs.filter(p => p.status === 'sugerido' || p.status === 'suggested').length,
          transferencias: updatedPairs.filter(p => p.status === 'transferencia' || p.status === 'transfer').length,
          sem_match: updatedPairs.filter(p => p.status === 'sem_match' || p.status === 'no_match').length,
          percentageComplete: updatedPairs.length > 0 ? Math.round(((updatedPairs.filter(p => p.status === 'conciliado' || p.status === 'matched').length + updatedPairs.filter(p => p.status === 'transferencia' || p.status === 'transfer').length) / updatedPairs.length) * 100) : 0
        };
        
        return newSummary;
      });
      
      return updatedPairs;
    });
  };

  // Sistema de Decision Tree para Conciliação
  const processReconciliationDecision = async (pair: ReconciliationPair, action: string, details?: any) => {
    console.log('🎯 Processando decisão de conciliação:', { 
      action, 
      pairId: pair.id, 
      pairStatus: pair.status,
      hasSystemTransaction: !!pair.systemTransaction,
      hasBankTransaction: !!pair.bankTransaction,
      details 
    });

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
      // Registrar log de auditoria (não bloquear por falha aqui)
      try {
        await fetch('/api/reconciliation/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditLog)
        });
        console.log('📝 Log de auditoria registrado');
      } catch (auditError) {
        console.warn('⚠️ Falha ao registrar log de auditoria:', auditError);
      }

      // Processar ação baseada no decision tree
      switch (action) {
        case 'auto_conciliate':
          console.log('🔄 Executando conciliação automática...');
          await handleAutoConciliate(pair);
          // Atualizar estado local imediatamente
          updatePairStatus(pair.id, 'conciliado');
          
          // Para auto_conciliate, não recarregar dados - manter apenas atualização local
          toast({
            title: "Conciliação automática executada!",
            description: "Transação conciliada automaticamente",
          });
          return; // Sair sem recarregar
        case 'manual_conciliate':
          console.log('🔄 Executando conciliação manual...');
          await handleManualConciliate(pair, details);
          // Atualizar estado local imediatamente
          updatePairStatus(pair.id, 'conciliado');
          
          // Para manual_conciliate, não recarregar dados - manter apenas atualização local
          toast({
            title: "Conciliação manual executada!",
            description: "Transação conciliada manualmente",
          });
          return; // Sair sem recarregar
        case 'confirm_transfer':
          console.log('🔄 Confirmando transferência...');
          await handleConfirmTransfer(pair);
          // Atualizar estado local imediatamente
          updatePairStatus(pair.id, 'conciliado');
          
          // Para confirm_transfer, não recarregar dados - manter apenas atualização local
          toast({
            title: "Transferência conciliada com sucesso!",
            description: "Transferência confirmada",
          });
          return; // Sair sem recarregar
        case 'unlink':
          console.log('🔄 Desconciliando...');
          await handleUnlink(pair);
          // Atualizar estado local imediatamente (volta para o status anterior)
          const isOFXTransfer = pair.bankTransaction?.memo?.toUpperCase().includes('TRANSFER') || 
                                pair.bankTransaction?.payee?.toUpperCase().includes('TRANSFER');
          const isSystemTransfer = pair.systemTransaction?.tipo === 'transferencia' ||
                                   pair.systemTransaction?.descricao?.toUpperCase().includes('TRANSFER');
          const originalStatus = isOFXTransfer || isSystemTransfer 
            ? 'transfer' 
            : pair.systemTransaction ? 'suggested' : 'no_match';
          updatePairStatus(pair.id, originalStatus);
          
          // Para unlink, não recarregar dados - manter apenas atualização local
          toast({
            title: "Desconciliação executada com sucesso!",
            description: "Transação desconciliada",
          });
          return; // Sair sem recarregar
        case 'reject':
          console.log('🔄 Rejeitando sugestão...');
          await handleReject(pair);
          // Atualizar estado local imediatamente
          updatePairStatus(pair.id, 'no_match');
          
          // Toast específico para desvincular
          toast({
            title: "Sugestão desvinculada!",
            description: "A transação foi marcada como sem correspondência",
          });
          return; // Sair sem recarregar
        case 'create_lancamento':
          console.log('🔄 Criando lançamento...');
          await handleCreateLancamento(pair);
          return; // Não recarrega dados pois abre modal
        case 'create_transferencia':
          console.log('🔄 Criando transferência...');
          await handleCreateTransferencia(pair);
          return; // Não recarrega dados pois abre modal
        case 'resolve_conflict':
          console.log('🔄 Resolvendo conflito...');
          await handleResolveConflict(pair, details);
          break;
        case 'ignore_transaction':
          console.log('🔄 Ignorando transação...');
          await handleIgnoreTransaction(pair);
          // Remover pair da lista (ou marcar como ignorado)
          updatePairStatus(pair.id, 'ignored');
          break;
        default:
          console.warn('⚠️ Ação não reconhecida:', action);
          return;
      }

      // Recarregar dados após ação
      console.log('🔄 Recarregando sugestões...');
      await loadSuggestions();
      
      toast({
        title: "Ação executada com sucesso!",
        description: `Transação ${action.replace('_', ' ')} processada`,
      });

    } catch (error) {
      console.error('❌ Erro ao processar decisão de conciliação:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar ação de conciliação",
        variant: "destructive",
      });
    }
  };

  // Handlers para cada tipo de ação
  const handleAutoConciliate = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction || !pair.systemTransaction) {
      console.error('❌ Dados insuficientes para conciliação:', { 
        bankTransaction: !!pair.bankTransaction, 
        systemTransaction: !!pair.systemTransaction 
      });
      return;
    }

    // Verificar se não é uma transação sem match
    if (pair.status === 'sem_match' || pair.status === 'no_match') {
      console.error('❌ Tentativa de conciliar transação marcada como sem match');
      return;
    }
    
    console.log('🔗 Iniciando conciliação automática:', {
      bank_transaction_id: pair.bankTransaction.id,
      system_transaction_id: pair.systemTransaction.id,
      confidence_level: pair.confidenceLevel,
      rule_applied: pair.ruleApplied
    });

    const response = await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        system_transaction_id: pair.systemTransaction.id,
        confidence_level: pair.confidenceLevel,
        rule_applied: pair.ruleApplied
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API de conciliação:', errorData);
      throw new Error(errorData.error || 'Erro ao conciliar transação');
    }

    const result = await response.json();
    console.log('✅ Conciliação bem-sucedida:', result);
  };

  const handleManualConciliate = async (pair: ReconciliationPair, details: any) => {
    if (!pair.bankTransaction || !details.selectedTransaction) {
      console.error('❌ Dados insuficientes para conciliação manual:', { 
        bankTransaction: !!pair.bankTransaction, 
        selectedTransaction: !!details.selectedTransaction 
      });
      return;
    }

    // Verificar se não é uma transação sem match
    if (pair.status === 'sem_match' || pair.status === 'no_match') {
      console.error('❌ Tentativa de conciliar manualmente transação marcada como sem match');
      return;
    }
    
    console.log('🔗 Iniciando conciliação manual:', {
      bank_transaction_id: pair.bankTransaction.id,
      system_transaction_id: details.selectedTransaction.id,
      confidence_level: 'manual',
      rule_applied: 'manual_selection'
    });

    const response = await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        system_transaction_id: details.selectedTransaction.id,
        confidence_level: 'manual',
        rule_applied: 'manual_selection'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API de conciliação manual:', errorData);
      throw new Error(errorData.error || 'Erro ao conciliar transação manualmente');
    }

    const result = await response.json();
    console.log('✅ Conciliação manual bem-sucedida:', result);
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
    if (!pair.bankTransaction) {
      console.error('❌ Transação bancária não encontrada para resolver conflito');
      return;
    }
    
    console.log('🔗 Resolvendo conflito:', {
      bank_transaction_id: pair.bankTransaction.id,
      resolution: details.resolution,
      selected_transaction_id: details.selectedTransactionId
    });

    const response = await fetch('/api/reconciliation/resolve-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        resolution: details.resolution,
        selected_transaction_id: details.selectedTransactionId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API de resolução de conflito:', errorData);
      throw new Error(errorData.error || 'Erro ao resolver conflito');
    }

    const result = await response.json();
    console.log('✅ Conflito resolvido:', result);
  };

  const handleIgnoreTransaction = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction) {
      console.error('❌ Transação bancária não encontrada para ignorar');
      return;
    }
    
    console.log('🚫 Ignorando transação:', {
      bank_transaction_id: pair.bankTransaction.id,
      reason: 'user_ignored'
    });

    const response = await fetch('/api/reconciliation/ignore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        reason: 'user_ignored'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API de ignorar transação:', errorData);
      throw new Error(errorData.error || 'Erro ao ignorar transação');
    }

    const result = await response.json();
    console.log('✅ Transação ignorada:', result);
  };

  const handleConfirmTransfer = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction || !pair.systemTransaction) {
      console.error('❌ Dados insuficientes para confirmar transferência:', { 
        bankTransaction: !!pair.bankTransaction, 
        systemTransaction: !!pair.systemTransaction 
      });
      return;
    }
    
    console.log('✅ Confirmando transferência:', {
      bank_transaction_id: pair.bankTransaction.id,
      system_transaction_id: pair.systemTransaction.id,
      confidence_level: 'high',
      rule_applied: 'transfer_confirmation'
    });

    const response = await fetch('/api/reconciliation/conciliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        system_transaction_id: pair.systemTransaction.id,
        confidence_level: 'high',
        rule_applied: 'transfer_confirmation'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API de confirmação de transferência:', errorData);
      throw new Error(errorData.error || 'Erro ao confirmar transferência');
    }

    const result = await response.json();
    console.log('✅ Transferência confirmada:', result);
  };

  const handleUnlink = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction) {
      console.error('❌ Transação bancária não encontrada para desconciliar');
      return;
    }
    
    console.log('🔗 Desconciliando transação:', {
      bank_transaction_id: pair.bankTransaction.id
    });

    const response = await fetch('/api/reconciliation/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API de desconciliação:', errorData);
      throw new Error(errorData.error || 'Erro ao desconciliar transação');
    }

    const result = await response.json();
    console.log('✅ Transação desconciliada:', result);
  };

  const handleReject = async (pair: ReconciliationPair) => {
    if (!pair.bankTransaction) {
      console.error('❌ Transação bancária não encontrada para rejeitar');
      return;
    }
    
    console.log('❌ Rejeitando sugestão:', {
      bank_transaction_id: pair.bankTransaction.id,
      reason: 'user_rejected'
    });

    const response = await fetch('/api/reconciliation/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_transaction_id: pair.bankTransaction.id,
        reason: 'user_rejected'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API de rejeição:', errorData);
      throw new Error(errorData.error || 'Erro ao rejeitar sugestão');
    }

    const result = await response.json();
    console.log('✅ Sugestão rejeitada:', result);
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadBankAccounts();
  }, [loadBankAccounts]);

  // Carregar dados quando conta ou período mudar
  useEffect(() => {
    console.log('🔄 useEffect loadSuggestions triggered:', {
      selectedBankAccountId,
      hasSelectedAccount: !!selectedBankAccountId,
      periodo
    });

    if (selectedBankAccountId) {
      console.log('✅ Carregando sugestões automaticamente...');
      loadSuggestions();
    } else {
      console.log('⚠️ Nenhuma conta selecionada, não carregando sugestões');
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
                <div className="text-2xl font-bold text-orange-600">{summary.sugeridos}</div>
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
            <Button
              variant="outline"
              onClick={() => {
                console.log('🎨 Testando cores - gerando dados de exemplo...');
                const testPairs: ReconciliationPair[] = [
                  {
                    id: '1',
                    bankTransaction: {
                      id: 'bank1',
                      fit_id: 'FIT001',
                      memo: 'PIX RECEBIDO JOAO SILVA',
                      amount: 1500.00,
                      posted_at: '2024-01-15',
                      transaction_type: 'CREDIT',
                    },
                    systemTransaction: {
                      id: 'sys1',
                      descricao: 'Venda de produto - João Silva',
                      valor: 1500.00,
                      data_lancamento: '2024-01-15',
                      tipo: 'receita',
                    },
                    status: 'matched',
                    matchScore: 0.98,
                    matchReason: 'Match exato por valor e data',
                    confidenceLevel: '100%',
                  },
                  {
                    id: '2',
                    bankTransaction: {
                      id: 'bank2',
                      fit_id: 'FIT002',
                      memo: 'TED MARIA SANTOS',
                      amount: 800.50,
                      posted_at: '2024-01-14',
                      transaction_type: 'CREDIT',
                    },
                    systemTransaction: {
                      id: 'sys2',
                      descricao: 'Pagamento serviços - Maria',
                      valor: 800.50,
                      data_lancamento: '2024-01-13',
                      tipo: 'receita',
                    },
                    status: 'suggested',
                    matchScore: 0.85,
                    matchReason: 'Valor igual, data próxima',
                    confidenceLevel: 'provavel',
                  },
                  {
                    id: '3',
                    bankTransaction: {
                      id: 'bank3',
                      fit_id: 'FIT003',
                      memo: 'TRANSFERENCIA CONTA POUPANCA',
                      amount: 2000.00,
                      posted_at: '2024-01-12',
                      transaction_type: 'DEBIT',
                    },
                    status: 'transfer',
                    matchScore: 0.90,
                    matchReason: 'Detectada como transferência interna',
                    confidenceLevel: 'provavel',
                  },
                  {
                    id: '4',
                    bankTransaction: {
                      id: 'bank4',
                      fit_id: 'FIT004',
                      memo: 'SAQUE ATM BANCO 24H',
                      amount: 200.00,
                      posted_at: '2024-01-11',
                      transaction_type: 'DEBIT',
                    },
                    status: 'no_match',
                    matchScore: 0.0,
                    matchReason: 'Nenhuma correspondência encontrada',
                    confidenceLevel: 'baixo',
                  },
                ];
                console.log('📊 Definindo pairs de teste:', testPairs);
                setPairs(testPairs);
                
                const testSummary = {
                  total: 4,
                  conciliados: 1,
                  sugeridos: 1,
                  transferencias: 1,
                  sem_match: 1,
                  conflitos: 0,
                  pendentes: 0,
                  percentageComplete: 75,
                };
                console.log('📈 Definindo summary de teste:', testSummary);
                setSummary(testSummary);
                
                console.log('✅ Dados de teste aplicados com sucesso');
                
                toast({
                  title: "Dados de teste carregados!",
                  description: "4 transações de exemplo criadas para testar a interface",
                });
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Testar Cores
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔄 Forçando recarregamento de sugestões...');
                console.log('📊 Estado atual:', {
                  selectedBankAccountId,
                  empresaId: empresaData?.id,
                  periodo
                });
                
                if (selectedBankAccountId) {
                  loadSuggestions();
                } else {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma conta bancária primeiro",
                    variant: "destructive"
                  });
                }
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar API
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log('🧪 Testando matching engine com dados realistas...');
                
                // Simular dados que deveriam fazer match
                const testPairs: ReconciliationPair[] = [
                  {
                    id: '1',
                    bankTransaction: {
                      id: 'bank1',
                      fit_id: 'FIT001',
                      memo: 'PIX RECEBIDO JOAO SILVA',
                      amount: 1500.00,
                      posted_at: '2024-01-15',
                      transaction_type: 'CREDIT',
                    },
                    systemTransaction: {
                      id: 'sys1',
                      descricao: 'PIX RECEBIDO JOAO SILVA',
                      valor: 1500.00,
                      data_lancamento: '2024-01-15',
                      tipo: 'receita',
                    },
                    status: 'matched',
                    matchScore: 1.0,
                    matchReason: 'Match exato por valor, data e descrição',
                    confidenceLevel: '100%',
                  },
                  {
                    id: '2',
                    bankTransaction: {
                      id: 'bank2',
                      fit_id: 'FIT002',
                      memo: 'TED MARIA SANTOS',
                      amount: 800.50,
                      posted_at: '2024-01-14',
                      transaction_type: 'CREDIT',
                    },
                    systemTransaction: {
                      id: 'sys2',
                      descricao: 'Pagamento serviços - Maria Santos',
                      valor: 800.50,
                      data_lancamento: '2024-01-13', // 1 dia de diferença
                      tipo: 'receita',
                    },
                    status: 'suggested',
                    matchScore: 0.85,
                    matchReason: 'Valor igual, data próxima (1 dia)',
                    confidenceLevel: 'provavel',
                  },
                  {
                    id: '3',
                    bankTransaction: {
                      id: 'bank3',
                      fit_id: 'FIT003',
                      memo: 'SAQUE ATM BANCO 24H',
                      amount: 200.00,
                      posted_at: '2024-01-11',
                      transaction_type: 'DEBIT',
                    },
                    status: 'no_match',
                    matchScore: 0.0,
                    matchReason: 'Nenhuma correspondência encontrada',
                    confidenceLevel: 'baixo',
                  },
                ];

                console.log('📊 Aplicando dados de teste realistas:', testPairs);
                setPairs(testPairs);
                
                const testSummary = {
                  total: 3,
                  conciliados: 1,
                  sugeridos: 1,
                  transferencias: 0,
                  sem_match: 1,
                  conflitos: 0,
                  pendentes: 0,
                  percentageComplete: 66.7,
                };
                setSummary(testSummary);
                
                toast({
                  title: "Teste de Matching Aplicado!",
                  description: "Dados realistas criados para testar o algoritmo de matching",
                });
              }}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Testar Matching
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
                // Lógica para conta origem/destino baseada no tipo da transação
                conta_origem_id: selectedBankTransaction.transaction_type === 'DEBIT' ? selectedBankAccountId : '', // Se é saída (DEBIT), a conta do OFX é origem
                conta_destino_id: selectedBankTransaction.transaction_type === 'CREDIT' ? selectedBankAccountId : '', // Se é entrada (CREDIT), a conta do OFX é destino
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
      // Buscar lançamentos que correspondem ao valor da transação bancária
      const valorTransacao = Math.abs(bankTransaction.amount);
      const isTransferTransaction = bankTransaction.memo?.includes('TRANSFER') || 
                                   bankTransaction.payee?.includes('TRANSFER') ||
                                   bankTransaction.memo?.toLowerCase().includes('transfer') ||
                                   bankTransaction.payee?.toLowerCase().includes('transfer');
      
      console.log('🔍 Buscando lançamentos para:', {
        valor: valorTransacao,
        memo: bankTransaction.memo,
        payee: bankTransaction.payee,
        isTransferTransaction
      });
      
      // Buscar lançamentos com valor exato (±0.01 para precision) e status pago
      const response = await fetch(`/api/lancamentos?empresa_id=${empresaData.id}&status=pago&valor_min=${valorTransacao - 0.01}&valor_max=${valorTransacao + 0.01}&limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Lançamentos encontrados:', data.length);
        
        // Filtrar e ordenar por relevância
        const lancamentosFiltrados = data
          .filter((lancamento: any) => {
            const valorLancamento = Math.abs(parseFloat(lancamento.valor));
            
            // Para transações TRANSFER, buscar especificamente transferências
            if (isTransferTransaction) {
              const isTransferLancamento = lancamento.tipo === 'transferencia' ||
                                         lancamento.descricao?.includes('TRANSFERÊNCIA') ||
                                         lancamento.descricao?.includes('TRANSFER') ||
                                         lancamento.numero_documento?.includes('TRANSF-');
              
              // Verificar valor exato para transferências
              const isExactValue = Math.abs(valorLancamento - valorTransacao) < 0.01;
              
              console.log('🔄 Verificando transferência:', {
                lancamentoId: lancamento.id,
                tipo: lancamento.tipo,
                descricao: lancamento.descricao,
                valor: valorLancamento,
                isTransferLancamento,
                isExactValue
              });
              
              return isTransferLancamento && isExactValue;
            }
            
            // Para outras transações, incluir todos com valor exato
            const isExactValue = Math.abs(valorLancamento - valorTransacao) < 0.01;
            return isExactValue;
          })
          .sort((a: any, b: any) => {
            // Priorizar transferências se a transação bancária é transfer
            if (isTransferTransaction) {
              const aIsTransfer = a.tipo === 'transferencia' || a.descricao?.includes('TRANSFERÊNCIA');
              const bIsTransfer = b.tipo === 'transferencia' || b.descricao?.includes('TRANSFERÊNCIA');
              
              if (aIsTransfer && !bIsTransfer) return -1;
              if (!aIsTransfer && bIsTransfer) return 1;
            }
            
            // Ordenar por proximidade de valor
            const diffA = Math.abs(parseFloat(a.valor) - valorTransacao);
            const diffB = Math.abs(parseFloat(b.valor) - valorTransacao);
            return diffA - diffB;
          });
        
        console.log('✅ Lançamentos filtrados:', lancamentosFiltrados.length);
        setLancamentos(lancamentosFiltrados);
      }
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaData?.id, bankTransaction.amount, bankTransaction.memo, bankTransaction.payee, bankTransaction.posted_at]);

  useEffect(() => {
    loadLancamentos();
  }, [loadLancamentos]);

  // Filtrar lançamentos por termo de busca
  const filteredLancamentos = lancamentos.filter(lancamento => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lancamento.descricao?.toLowerCase().includes(searchLower) ||
      lancamento.numero_documento?.toLowerCase().includes(searchLower) ||
      lancamento.tipo?.toLowerCase().includes(searchLower)
    );
  });

  // Priorizar transferências se o memo contém "TRANSFER"
  const sortedLancamentos = [...filteredLancamentos].sort((a, b) => {
    // Detectar se é transação TRANSFER
    const isTransferTransaction = bankTransaction.memo?.includes('TRANSFER') || 
                                 bankTransaction.payee?.includes('TRANSFER') ||
                                 bankTransaction.memo?.toLowerCase().includes('transfer') ||
                                 bankTransaction.payee?.toLowerCase().includes('transfer');
    
    // Se é transação TRANSFER, priorizar transferências
    if (isTransferTransaction) {
      const aIsTransfer = a.tipo === 'transferencia' || 
                         a.descricao?.includes('TRANSFERÊNCIA') ||
                         a.descricao?.includes('TRANSFER');
      const bIsTransfer = b.tipo === 'transferencia' || 
                         b.descricao?.includes('TRANSFERÊNCIA') ||
                         b.descricao?.includes('TRANSFER');
      
      if (aIsTransfer && !bIsTransfer) return -1;
      if (!aIsTransfer && bIsTransfer) return 1;
    }
    
    // Ordenar por proximidade de valor
    const valorTransacao = Math.abs(bankTransaction.amount);
    const diffA = Math.abs(parseFloat(a.valor) - valorTransacao);
    const diffB = Math.abs(parseFloat(b.valor) - valorTransacao);
    return diffA - diffB;
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

      {/* Busca e informações */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Buscar lançamentos:</label>
        <Input
          placeholder="Digite a descrição ou número do documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {/* Mostrar informação sobre filtro automático para transferências */}
        {(bankTransaction.memo?.includes('TRANSFER') || 
          bankTransaction.payee?.includes('TRANSFER') ||
          bankTransaction.memo?.toLowerCase().includes('transfer') ||
          bankTransaction.payee?.toLowerCase().includes('transfer')) && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Priorizando transferências devido à descrição "TRANSFER" detectada</span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de lançamentos */}
      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Carregando lançamentos...
          </div>
        ) : sortedLancamentos.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {!searchTerm ? 'Nenhum lançamento encontrado' : 'Nenhum lançamento encontrado para sua busca'}
          </div>
        ) : (
          <div className="divide-y">
            {sortedLancamentos.map((lancamento) => (
              <div
                key={lancamento.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  (lancamento.tipo === 'transferencia' || 
                   lancamento.descricao?.includes('TRANSFERÊNCIA') ||
                   lancamento.descricao?.includes('TRANSFER')) && 
                  (bankTransaction.memo?.includes('TRANSFER') || 
                   bankTransaction.payee?.includes('TRANSFER') ||
                   bankTransaction.memo?.toLowerCase().includes('transfer') ||
                   bankTransaction.payee?.toLowerCase().includes('transfer'))
                    ? 'border-l-4 border-l-blue-500 bg-blue-50' 
                    : ''
                }`}
                onClick={() => onSelect(lancamento)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{lancamento.descricao}</div>
                      {(lancamento.tipo === 'transferencia' || 
                        lancamento.descricao?.includes('TRANSFERÊNCIA') ||
                        lancamento.descricao?.includes('TRANSFER')) && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          TRANSFERÊNCIA
                        </span>
                      )}
                    </div>
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
      case 'matched': return 'bg-green-100 text-green-800 border-green-200';
      case 'conciliado': return 'bg-green-100 text-green-800 border-green-200';
      case 'suggested': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'sugerido': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'transfer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transferencia': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no_match': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'sem_match': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'conflito': return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched': return <CheckCircle className="h-4 w-4" />;
      case 'conciliado': return <CheckCircle className="h-4 w-4" />;
      case 'suggested': return <X className="h-4 w-4 text-orange-600" />;
      case 'sugerido': return <X className="h-4 w-4 text-orange-600" />;
      case 'transfer': return <ArrowLeftRight className="h-4 w-4" />;
      case 'transferencia': return <ArrowLeftRight className="h-4 w-4" />;
      case 'no_match': return <X className="h-4 w-4" />;
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

  // Função para detectar se é transferência pela descrição
  const isTransferOFX = (bankTransaction: BankTransaction | undefined) => {
    if (!bankTransaction) return false;
    
    const memo = (bankTransaction.memo || '').toUpperCase();
    const payee = (bankTransaction.payee || '').toUpperCase();
    
    const transferKeywords = [
      'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
      'TRANSF-', 'DOC', 'TED', 'PIX',
      'ENVIO', 'RECEBIMENTO', 'REMESSA',
      'TRANSFER NCIA ENTRADA', 'TRANSFER NCIA SAIDA'
    ];
    
    return transferKeywords.some(keyword => 
      memo.includes(keyword) || payee.includes(keyword)
    );
  };

  const isTransferSystem = (systemTransaction: SystemTransaction | undefined) => {
    if (!systemTransaction) return false;
    
    const descricao = (systemTransaction.descricao || '').toUpperCase();
    const numeroDoc = (systemTransaction.numero_documento || '').toUpperCase();
    
    const transferKeywords = [
      'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
      'TRANSF-', '[TRANSFERÊNCIA ENTRADA]', '[TRANSFERÊNCIA SAIDA]'
    ];
    
    return systemTransaction.tipo === 'transferencia' ||
           transferKeywords.some(keyword => 
             descricao.includes(keyword) || numeroDoc.includes(keyword)
           );
  };

  // Função para obter as cores do card baseado no status
  const getCardBackgroundColor = (status: string) => {
    // Verificar se a transação já foi conciliada anteriormente
    const isAlreadyConciliated = pair.bankTransaction?.status_conciliacao === 'conciliado';
    
    if (isAlreadyConciliated) {
      return 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-80'; // Esmaecido para já conciliadas
    }
    
    // PRIORIDADE 1: Status de conciliação (sempre prioritário)
    switch (status) {
      case 'matched':
      case 'conciliado': 
        return 'bg-green-100 border-green-300 hover:bg-green-150'; // Verde claro para conciliados
      case 'suggested':
      case 'sugerido': 
        return 'bg-orange-50 border-orange-300 hover:bg-orange-100'; // Laranja claro para sugeridos
      case 'conflito': 
        return 'bg-red-100 border-red-300 hover:bg-red-150'; // Vermelho para conflitos
      case 'pendente': 
        return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-150'; // Amarelo para pendentes
    }
    
    // PRIORIDADE 2: Verificar se é transferência (apenas para não conciliados)
    const isTransferOFXCard = isTransferOFX(pair.bankTransaction);
    const isTransferSystemCard = isTransferSystem(pair.systemTransaction);
    
    if (isTransferOFXCard || isTransferSystemCard || status === 'transfer' || status === 'transferencia') {
      return 'bg-blue-50 border-blue-400 border-l-4 border-l-blue-500 hover:bg-blue-100'; // Azul com borda lateral para transferências
    }
    
    // PRIORIDADE 3: Outros status
    switch (status) {
      case 'no_match':
      case 'sem_match': 
        return 'bg-white border-gray-300 hover:bg-gray-50'; // Branco para sem match
      default: 
        return 'bg-white border-gray-300 hover:bg-gray-50';
    }
  };

  return (
    <div className="flex gap-3 items-center min-h-[100px] mb-4">
      {/* Card Esquerdo - Transação OFX */}
      <div className={`flex-1 p-4 rounded-lg border-2 ${getCardBackgroundColor(pair.status)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1" />
            <div className="flex-1">
              <div className="text-sm text-gray-700 mb-1">
                {pair.bankTransaction && formatDate(pair.bankTransaction.posted_at)}
              </div>
              <div className={`font-bold text-lg mb-2 ${
                pair.bankTransaction?.transaction_type === 'CREDIT' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {pair.bankTransaction && formatCurrency(pair.bankTransaction.amount)}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  {pair.bankTransaction?.memo || 'Sem descrição'}
                </p>
                {pair.bankTransaction?.payee && (
                  <p className="text-sm text-gray-600">
                    {pair.bankTransaction.payee}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    Origem: OFX
                  </p>
                  {/* Badge de transferência para OFX */}
                  {isTransferOFX(pair.bankTransaction) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      TRANSFER
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Botão Ignorar apenas para sem match */}
          {(pair.status === 'no_match' || pair.status === 'sem_match') && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-orange-500 hover:text-orange-600"
              onClick={() => onProcessReconciliationDecision(pair, 'ignore_transaction')}
            >
              <X className="h-4 w-4 mr-1" />
              Ignorar
            </Button>
          )}
        </div>
      </div>

      {/* Área Central - Status e Ações */}
      <div className="flex flex-col items-center justify-center min-w-[140px] space-y-2">
        {/* Verificar se já foi conciliado anteriormente */}
        {pair.bankTransaction?.status_conciliacao === 'conciliado' && (
          <>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <span className="text-xs text-gray-500 font-medium">já conciliado</span>
            </div>
            <div className="text-xs text-center text-gray-400 px-2">
              Esta transação já foi conciliada anteriormente
            </div>
          </>
        )}
        
        {/* Status normal: conciliado na sessão atual */}
        {pair.bankTransaction?.status_conciliacao !== 'conciliado' && (pair.status === 'matched' || pair.status === 'conciliado') && (
          <>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <span className="text-xs text-green-600 font-medium">conciliado</span>
            </div>
            <Button 
              size="sm" 
              className="bg-gray-900 text-white w-36"
              onClick={() => onProcessReconciliationDecision(pair, 'unlink')}
            >
              desconciliar
            </Button>
          </>
        )}
        
        {pair.bankTransaction?.status_conciliacao !== 'conciliado' && (pair.status === 'suggested' || pair.status === 'sugerido') && (
          <>
            <div className="text-center">
              <X className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <span className="text-xs text-orange-500 font-medium">sugerido</span>
            </div>
            <Button 
              size="sm" 
              className="bg-gray-800 text-white w-36"
              onClick={() => onProcessReconciliationDecision(pair, 'auto_conciliate')}
            >
              Conciliar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="w-36 border-orange-300 text-gray-800 bg-white"
              onClick={() => onProcessReconciliationDecision(pair, 'reject')}
            >
              <X className="w-4 h-4 mr-2 text-orange-500" />
              desvincular
            </Button>
          </>
        )}
        
        {pair.bankTransaction?.status_conciliacao !== 'conciliado' && (pair.status === 'transfer' || pair.status === 'transferencia') && (
          <>
            <div className="text-center">
              <ArrowLeftRight className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <span className="text-xs text-blue-500 font-medium">transferencia</span>
            </div>
            <Button 
              size="sm" 
              className="bg-gray-800 text-white w-36"
              onClick={() => onProcessReconciliationDecision(pair, 'confirm_transfer')}
            >
              Conciliar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="w-36 border-blue-300 text-gray-800 bg-white"
              onClick={() => onProcessReconciliationDecision(pair, 'reject')}
            >
              desvincular
            </Button>
          </>
        )}
        
        {pair.bankTransaction?.status_conciliacao !== 'conciliado' && (pair.status === 'no_match' || pair.status === 'sem_match') && (
          <div className="space-y-2">
            <div className="text-center">
              <X className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <span className="text-xs text-gray-500 font-medium">sem match</span>
            </div>
            <Button 
              size="sm" 
              className="bg-gray-500 text-white hover:bg-gray-600 w-36"
              onClick={() => onProcessReconciliationDecision(pair, 'ignore_transaction')}
            >
              Ignorar
            </Button>
          </div>
        )}
      </div>

      {/* Card Direito - Sistema ERP */}
      <div className={`flex-1 p-4 rounded-lg border-2 ${getCardBackgroundColor(pair.status)}`}>
        {/* Se há correspondência, mostrar dados do lançamento */}
        {((pair.status === 'matched' || pair.status === 'conciliado' || 
          pair.status === 'suggested' || pair.status === 'sugerido' ||
          pair.status === 'transfer' || pair.status === 'transferencia') && pair.systemTransaction) ? (
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1" />
            <div className="flex-1">
              <div className="text-sm text-gray-700 mb-1">
                {formatDate(pair.systemTransaction.data_lancamento)}
              </div>
              <div className={`font-bold text-lg mb-2 ${
                pair.systemTransaction.tipo === 'receita' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(pair.systemTransaction.valor)}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  {pair.systemTransaction.descricao || 'Sem descrição'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    Origem: sistema
                  </p>
                  {/* Badge de transferência para Sistema */}
                  {isTransferSystem(pair.systemTransaction) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      TRANSFERÊNCIA
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Se não há correspondência, mostrar apenas checkbox e botões */
          <div className="flex flex-col h-full">
            <div className="flex items-start gap-3 mb-3">
              <input type="checkbox" className="mt-1" disabled />
            </div>
            
            {/* Botões de ação para criar lançamentos */}
            <div className="space-y-2 mt-auto">
              <Button 
                size="sm" 
                className="bg-gray-800 text-white hover:bg-gray-900 justify-start w-full"
                onClick={() => pair.bankTransaction && onOpenLancamentoModal(pair.bankTransaction)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Lançamento
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="justify-start w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => pair.bankTransaction && onOpenTransferenciaModal(pair.bankTransaction)}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Transferência
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="justify-start w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => pair.bankTransaction && onOpenBuscarLancamentosModal(pair.bankTransaction)}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar Lançamentos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


