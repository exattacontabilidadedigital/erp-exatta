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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  Banknote,
  Eye
} from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LancamentosForm } from "@/components/lancamentos/lancamentos-form";
import { MatchingEngine } from "@/lib/matching-engine";
import BuscarLancamentosModalComponent from './buscar-lancamentos-modal';

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
  status_conciliacao: 'pendente' | 'conciliado' | 'desconciliado' | 'desvinculado' | 'ignorado'; // Ações do usuário
  reconciliation_status: 'sugerido' | 'transferencia' | 'sem_match' ; // ✅ CORREÇÃO: usar reconciliation_status (nome real da coluna)
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


  // Estados para período - correção de hidratação
  const [isClient, setIsClient] = useState(false);
  const [periodo, setPeriodo] = useState<{ mes: string, ano: string }>({
    mes: '01', // Valor padrão estático para evitar problemas de hidratação
    ano: '2024'
  });

  // Inicializar período após hidratação
  useEffect(() => {
    setIsClient(true);
    const hoje = new Date();
    const mesAtual = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const anoAtual = hoje.getFullYear().toString();
    
    console.log('📅 Inicializando período após hidratação:', { 
      hoje: hoje.toISOString(), 
      mesAtual, 
      anoAtual,
      dataCompleta: `${anoAtual}-${mesAtual}`
    });
    
    setPeriodo({ mes: mesAtual, ano: anoAtual });
  }, []);

  // Função para gerar lista de anos (últimos 5 anos + próximos 2 anos)
  const gerarListaAnos = () => {
    if (!isClient) return ['2024']; // Valor padrão durante hidratação
    
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let i = anoAtual - 5; i <= anoAtual + 2; i++) {
      anos.push(i.toString());
    }
    return anos;
  };

  // Lista de meses
  const meses = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" }
  ];

  // Função para alterar período e recarregar dados
  const handlePeriodoChange = useCallback((novoMes: string, novoAno: string) => {
    console.log('🔄 handlePeriodoChange chamado:', { 
      novoMes, 
      novoAno,
      periodoAnterior: periodo,
      timestamp: new Date().toISOString()
    });
    
    setPeriodo({ mes: novoMes, ano: novoAno });
    
    // Atualizar filtros de data automaticamente para o novo período
    const periodStart = `${novoAno}-${novoMes.padStart(2, '0')}-01`;
    const lastDay = new Date(Number(novoAno), Number(novoMes), 0).getDate();
    const periodEnd = `${novoAno}-${novoMes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    console.log('📅 Novo período calculado:', {
      novoMes,
      novoAno,
      periodStart,
      periodEnd,
      lastDay
    });
    
    setDataInicio(periodStart);
    setDataFim(periodEnd);
    
    // Limpar dados atuais para forçar recarregamento
    setPairs([]);
    setSummary(null);
    
    console.log('✅ Estado limpo, useEffect deve disparar automaticamente');
    // Recarregar dados com novo período será feito automaticamente pelo useEffect
  }, []);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [includeReconciled, setIncludeReconciled] = useState(true);
  const [includeIgnored, setIncludeIgnored] = useState(false);
  
  // Estados para filtro de data
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [usarFiltroPeriodo, setUsarFiltroPeriodo] = useState<boolean>(false);

  // Estados adicionais para filtros
  const [filtroStatus, setFiltroStatus] = useState({
    sugeridos: true,
    conciliados: true,
    pendentes: true,
    transferencias: true
  });
  const [valorMinimo, setValorMinimo] = useState<string>('');
  const [valorMaximo, setValorMaximo] = useState<string>('');
  const [termoBusca, setTermoBusca] = useState<string>('');

  // Função para validar e definir data de início
  const handleDataInicioChange = (novaData: string) => {
    setDataInicio(novaData);
    // Se a data de fim já estiver definida e for menor que a nova data de início, ajustar
    if (dataFim && novaData && novaData > dataFim) {
      setDataFim(novaData);
    }
  };

  // Função para validar e definir data de fim
  const handleDataFimChange = (novaData: string) => {
    setDataFim(novaData);
    // Se a data de início já estiver definida e for maior que a nova data de fim, ajustar
    if (dataInicio && novaData && novaData < dataInicio) {
      setDataInicio(novaData);
    }
  };

  // Funções para filtros
  const aplicarFiltros = useCallback(() => {
    console.log('🔍 Aplicando filtros:', {
      usarFiltroPeriodo,
      dataInicio,
      dataFim,
      filtroStatus,
      valorMinimo,
      valorMaximo,
      termoBusca
    });
    
    // A lógica de filtros será aplicada automaticamente pelos useEffect
    // que monitoram essas variáveis de estado
    toast({
      title: "Filtros Aplicados",
      description: "Os filtros foram aplicados aos dados de conciliação",
    });
  }, [usarFiltroPeriodo, dataInicio, dataFim, filtroStatus, valorMinimo, valorMaximo, termoBusca, toast]);

  const limparFiltros = useCallback(() => {
    console.log('🧹 Limpando todos os filtros...');
    setUsarFiltroPeriodo(false);
    setDataInicio('');
    setDataFim('');
    setFiltroStatus({
      sugeridos: true,
      conciliados: true,
      pendentes: true,
      transferencias: true
    });
    setValorMinimo('');
    setValorMaximo('');
    setTermoBusca('');
    
    toast({
      title: "Filtros Limpos",
      description: "Todos os filtros foram removidos",
    });
  }, [toast]);

  // Estados para upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados para modais
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false);
  const [showBuscarLancamentosModal, setShowBuscarLancamentosModal] = useState(false);
  const [selectedBankTransaction, setSelectedBankTransaction] = useState<BankTransaction | null>(null);

  // Estado para keywords configuráveis
  const [transferKeywords, setTransferKeywords] = useState<{ [key: string]: string[] }>({});

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

  // 🔍 FUNÇÃO PARA BUSCAR MÚLTIPLOS LANÇAMENTOS RELACIONADOS
  const fetchMultipleTransactionsForConciliated = useCallback(async (bankTransactionId: string, matchedLancamentoId: string) => {
    try {
      console.log('🔍 Buscando múltiplos lançamentos para transação conciliada:', {
        bankTransactionId,
        matchedLancamentoId
      });

      // Buscar na tabela transaction_matches para ver se há múltiplos matches
      const response = await fetch(`/api/reconciliation/multiple-transactions?bank_transaction_id=${bankTransactionId}&primary_lancamento_id=${matchedLancamentoId}`);
      
      if (!response.ok) {
        console.warn('⚠️ API para múltiplos lançamentos não disponível ou erro:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.transactions && data.transactions.length > 1) {
        console.log('✅ Múltiplos lançamentos encontrados via API:', {
          count: data.transactions.length,
          totalValue: data.totalValue,
          transactions: data.transactions.map((t: any) => ({ id: t.id, descricao: t.descricao, valor: t.valor }))
        });
        
        return data.transactions;
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Erro ao buscar múltiplos lançamentos (não crítico):', error);
      return null;
    }
  }, []);

  // Função para obter keywords específicas por banco/instituição
  const getTransferKeywordsByBank = (bankAccountId: string): string[] | null => {
    // Mapeamento de keywords por banco
    const bankKeywordsMap: { [key: string]: string[] } = {
      // Banco do Brasil
      'bb': [
        'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
        'DOC', 'TED', 'PIX', 'TRANSF ENTRE CONTAS',
        'APLICACAO BB', 'RESGATE BB', 'MOVIMENTACAO INTERNA BB'
      ],
      // Itaú
      'itau': [
        'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA', 
        'DOC', 'TED', 'PIX', 'TRANSF-',
        'APLICACAO ITAU', 'RESGATE ITAU', 'INVEST EASY'
      ],
      // Bradesco  
      'bradesco': [
        'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
        'DOC', 'TED', 'PIX', 'TRANSF-',
        'APLICACAO BRADESCO', 'PRIME', 'EXCLUSIVE'
      ],
      // Santander
      'santander': [
        'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
        'DOC', 'TED', 'PIX', 'TRANSF-',
        'APLICACAO SANTANDER', 'SELECT', 'VAN GOGH'
      ],
      // Caixa
      'caixa': [
        'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
        'DOC', 'TED', 'PIX', 'TRANSF-',
        'APLICACAO CAIXA', 'POUPANCA CAIXA'
      ]
    };
    
    // Identificar banco pela conta (você pode implementar lógica mais robusta)
    const accountId = bankAccountId?.toLowerCase();
    
    // Verificar se existe mapeamento específico
    for (const [bankKey, keywords] of Object.entries(bankKeywordsMap)) {
      if (accountId?.includes(bankKey)) {
        console.log(`🏦 Keywords específicas encontradas para ${bankKey}:`, keywords);
        return keywords;
      }
    }
    
    // Retornar null para usar keywords padrão
    return null;
  };

  // Carregar keywords de configuração
  const loadTransferKeywords = useCallback(async () => {
    try {
      const response = await fetch('/api/config/transfer-keywords');
      if (response.ok) {
        const keywordsConfig = await response.json();
        setTransferKeywords(keywordsConfig);
        console.log('📝 Keywords de transferência carregadas:', keywordsConfig);
      }
    } catch (error) {
      console.warn('⚠️ Falha ao carregar keywords configuráveis, usando padrão:', error);
      // Usar keywords padrão em caso de erro
      setTransferKeywords({
        default: [
          'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
          'TRANSF-', 'DOC', 'TED', 'PIX',
          'ENVIO', 'RECEBIMENTO', 'REMESSA'
        ]
      });
    }
  }, []);

  // Carregar keywords na inicialização
  useEffect(() => {
    loadTransferKeywords();
  }, [loadTransferKeywords]);



  // Carregar sugestões de conciliação
  const loadSuggestions = useCallback(async () => {
    console.log('🚀 loadSuggestions iniciado (v5.0):', {
      selectedBankAccountId,
      empresaData,
      periodo,
      hasSelectedAccount: !!selectedBankAccountId,
      hasEmpresaData: !!empresaData?.id,
      timestampLoad: new Date().toISOString()
    });

    if (!selectedBankAccountId || !empresaData?.id) {
      console.warn('⚠️ Dados insuficientes para carregar sugestões (v5.0):', {
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

      console.log('📊 PERÍODO USADO NA API:', { periodo, periodStart, periodEnd });

      const url = `/api/reconciliation/suggestions?bank_account_id=${selectedBankAccountId}&period_start=${periodStart}&period_end=${periodEnd}&empresa_id=${empresaData.id}&include_reconciled=true`;
      console.log('📡 Fazendo requisição para:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API de sugestões - Status:', response.status);
        console.error('❌ Erro na API de sugestões - Error:', errorText);
        throw new Error(`Erro ao carregar sugestões: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Dados recebidos da API:', {
        pairsCount: data.pairs?.length || 0,
        summary: data.summary,
        reconciliationId: data.reconciliation_id,
        samplePair: data.pairs?.[0],
        statusConciliacaoDistribution: data.pairs?.reduce((acc: any, pair: any) => {
          const status = pair.bankTransaction?.status_conciliacao || 'undefined';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        // ✅ NOVO: Distribuição do reconciliation_status
        reconciliationStatusDistribution: data.pairs?.reduce((acc: any, pair: any) => {
          const status = pair.bankTransaction?.reconciliation_status || 'undefined';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      });
      
      // ✅ CORREÇÃO CRÍTICA: Usar dados DIRETAMENTE da API (estado real do banco)
      console.log('✅ Usando dados diretamente da API (estado real do banco de dados)');
      
      // ✅ CORREÇÃO COMPLETA: Mapear status baseado EXCLUSIVAMENTE no reconciliation_status
      const correctedPairs = (data.pairs || []).map((pair: any) => {
        const bankStatus = pair.bankTransaction?.status_conciliacao;
        const reconciliationStatus = pair.bankTransaction?.reconciliation_status; // ✅ CORREÇÃO: usar reconciliation_status
        const hasSystemMatch = !!pair.systemTransaction;
        
        let frontendStatus = 'sem_match'; // padrão
        
        console.log('📊 Mapeando status do pair com reconciliation_status:', {
          bankTransactionId: pair.bankTransaction?.id,
          bankStatus,
          reconciliationStatus, // ✅ NOVO: log do reconciliation_status
          hasSystemMatch,
          originalStatus: pair.status,
          matchedLancamentoId: pair.bankTransaction?.matched_lancamento_id
        });
        
        // ✅ CORREÇÃO CRÍTICA: Para pairs conciliados, reconstituir systemTransaction e systemTransactions
        if (bankStatus === 'conciliado' && !pair.systemTransaction && pair.bankTransaction?.matched_lancamento_id) {
          console.log('🔧 RECONSTITUINDO systemTransaction para pair conciliado:', {
            bankTransactionId: pair.bankTransaction.id,
            matchedLancamentoId: pair.bankTransaction.matched_lancamento_id
          });
          
          // Buscar o systemTransaction baseado no matched_lancamento_id
          const allSystemTransactions = data.pairs?.flatMap((p: any) => p.systemTransactions || []).filter(Boolean) || [];
          let matchedSystemTransaction = allSystemTransactions.find((st: any) => st.id === pair.bankTransaction.matched_lancamento_id);
          
          console.log('🔍 DADOS DE DEBUG para reconstituição:', {
            allSystemTransactionsCount: allSystemTransactions.length,
            matchedLancamentoId: pair.bankTransaction.matched_lancamento_id,
            foundMatch: !!matchedSystemTransaction,
            allSystemTransactionIds: allSystemTransactions.map(st => st.id),
            systemTransactionFound: matchedSystemTransaction
          });
          
          // 🆘 CORREÇÃO CRÍTICA: Se não encontrou na lista, criar um systemTransaction básico
          // baseado nos dados da conciliação para permitir exibição no card
          if (!matchedSystemTransaction) {
            console.log('🆘 CRIANDO systemTransaction básico para exibição no card');
            
            // Buscar informações básicas do banco de dados ou criar um objeto mínimo
            matchedSystemTransaction = {
              id: pair.bankTransaction.matched_lancamento_id,
              descricao: `Lançamento Conciliado (${pair.bankTransaction.memo || pair.bankTransaction.payee || 'Sem descrição'})`,
              valor: pair.bankTransaction.amount || pair.bankTransaction.value || 0,
              tipo: 'debito', // Assumir tipo baseado no valor
              data_lancamento: pair.bankTransaction.posted_at || pair.bankTransaction.date,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            console.log('✅ SystemTransaction básico criado:', {
              id: matchedSystemTransaction.id,
              descricao: matchedSystemTransaction.descricao,
              valor: matchedSystemTransaction.valor
            });
          }
          
          if (matchedSystemTransaction) {
            pair.systemTransaction = matchedSystemTransaction;
            
            // ✅ CORREÇÃO MÚLTIPLOS LANÇAMENTOS: Verificar se há outros lançamentos relacionados
            if (!pair.systemTransactions || pair.systemTransactions.length === 0) {
              // Inicializar com o lançamento encontrado
              pair.systemTransactions = [matchedSystemTransaction];
              
              // 🔍 BUSCAR MÚLTIPLOS: Estratégia melhorada para encontrar lançamentos relacionados
              // 1. Primeiro, verificar se há outros pairs com a mesma transação bancária
              const relatedPairs = data.pairs?.filter((otherPair: any) => {
                return otherPair.bankTransaction?.id === pair.bankTransaction.id && 
                       otherPair.systemTransaction && 
                       otherPair.systemTransaction.id !== matchedSystemTransaction.id;
              }) || [];
              
              // 2. Se não encontrou via pairs, buscar na lista completa de systemTransactions
              // usando critérios de proximidade (mesmo valor, data próxima)
              if (relatedPairs.length === 0) {
                const allSystemTransactions = data.pairs?.flatMap((p: any) => p.systemTransactions || []).filter(Boolean) || [];
                const bankValue = Math.abs(pair.bankTransaction?.value || pair.bankTransaction?.amount || 0);
                const bankDate = pair.bankTransaction?.posted_at || pair.bankTransaction?.date;
                
                // Buscar lançamentos com valor similar e não já incluídos
                const potentialMatches = allSystemTransactions.filter((st: any) => {
                  if (st.id === matchedSystemTransaction.id) return false; // Não incluir o já matched
                  
                  const systemValue = Math.abs(st.valor || 0);
                  const valueDiff = Math.abs(bankValue - systemValue);
                  const isValueClose = valueDiff < 0.01; // Valores muito próximos
                  
                  // Verificar se não está já conciliado com outra transação
                  const isAlreadyMatched = data.pairs?.some((p: any) => 
                    p.bankTransaction?.id !== pair.bankTransaction.id && 
                    p.systemTransaction?.id === st.id
                  );
                  
                  return isValueClose && !isAlreadyMatched;
                });
                
                console.log('🔍 BUSCA AVANÇADA de múltiplos lançamentos:', {
                  bankValue,
                  potentialMatchesFound: potentialMatches.length,
                  potentialMatches: potentialMatches.map((st: any) => ({
                    id: st.id,
                    valor: st.valor,
                    descricao: st.descricao
                  }))
                });
                
                // Se encontrou lançamentos potenciais, adicionar aos systemTransactions
                if (potentialMatches.length > 0) {
                  pair.systemTransactions = [matchedSystemTransaction, ...potentialMatches];
                  
                  console.log('🎯 MÚLTIPLOS LANÇAMENTOS DETECTADOS via busca avançada:', {
                    totalCount: pair.systemTransactions.length,
                    matchedIds: pair.systemTransactions.map((st: any) => st.id)
                  });
                }
              } else {
                // Adicionar os lançamentos relacionados encontrados via pairs
                const additionalTransactions = relatedPairs.map((rp: any) => rp.systemTransaction).filter(Boolean);
                pair.systemTransactions = [...pair.systemTransactions, ...additionalTransactions];
                
                console.log('💰 MÚLTIPLOS LANÇAMENTOS ENCONTRADOS via pairs relacionados:', {
                  primaryTransactionId: matchedSystemTransaction.id,
                  relatedCount: additionalTransactions.length,
                  totalCount: pair.systemTransactions.length,
                  individual: pair.systemTransactions.map((tx: any) => ({
                    id: tx.id,
                    descricao: tx.descricao,
                    valor: tx.valor
                  }))
                });
              }
              
              // Log final do que foi reconstituído
              console.log('� RECONSTITUIÇÃO FINAL de múltiplos lançamentos:', {
                bankTransactionId: pair.bankTransaction.id,
                systemTransactionsCount: pair.systemTransactions.length,
                totalValue: pair.systemTransactions.reduce((total: number, tx: any) => total + Math.abs(tx.valor), 0),
                isMultiple: pair.systemTransactions.length > 1
              });
            }
            
            console.log('✅ SystemTransaction reconstituído:', {
              id: matchedSystemTransaction.id,
              descricao: matchedSystemTransaction.descricao,
              valor: matchedSystemTransaction.valor
            });
          } else {
            console.warn('⚠️ Não foi possível reconstituir systemTransaction para:', pair.bankTransaction.matched_lancamento_id);
            console.warn('⚠️ SystemTransactions disponíveis:', allSystemTransactions.map(st => ({ id: st.id, descricao: st.descricao })));
          }
        }
        
        // ✅ PRIORIDADE: Se já foi conciliado pelo usuário, mostrar verde
        if (bankStatus === 'conciliado') {
          frontendStatus = 'conciliado'; // Verde - já foi conciliado pelo usuário
        }
        // ✅ NOVA LÓGICA: Para transações pendentes, usar reconciliation_status do banco
        else if (bankStatus === 'pendente') {
          switch (reconciliationStatus) {
            case 'transferencia':
              frontendStatus = 'transferencia'; // Azul - transferência identificada automaticamente
              console.log('🔵 Transferência identificada via reconciliation_status:', {
                bankId: pair.bankTransaction?.id,
                fit_id: pair.bankTransaction?.fit_id,
                payee: pair.bankTransaction?.payee,
                reconciliationStatus
              });
              break;
            case 'sugerido':
              frontendStatus = 'sugerido'; // Amarelo - sugestão de match automática
              break;
            case 'sem_match':
            default:
              frontendStatus = 'sem_match'; // Cinza - sem match
              break;
          }
        }
        // Casos especiais
        else if (bankStatus === 'ignorado') {
          frontendStatus = 'sem_match'; // Cinza - foi ignorado pelo usuário
        }
        else {
          // Status não reconhecido - tratar como pendente sem match
          frontendStatus = 'sem_match';
        }
        
        console.log('✅ Status mapeado com reconciliation_status:', {
          bankTransactionId: pair.bankTransaction?.id,
          bankStatus,
          reconciliationStatus,
          frontendStatus,
          shouldShowConciliarButton: frontendStatus === 'sugerido' || frontendStatus === 'transferencia'
        });
        
        return {
          ...pair,
          status: frontendStatus
        };
      });
      
      // ✅ STATUS JÁ CORRIGIDOS - USAR TODOS OS PAIRS SEM FILTROS
      const filteredPairs = correctedPairs.filter((pair: any) => {
        // ✅ CORREÇÃO: Manter pairs conciliados mesmo sem systemTransaction
        if (pair.bankTransaction?.status_conciliacao === 'conciliado') {
          return true; // Manter pairs conciliados para mostrar no frontend
        }
        
        // Para pairs não conciliados, aplicar filtros normais
        if (!pair.bankTransaction) {
          console.warn('⚠️ REMOVENDO PAIR SEM BANK TRANSACTION:', {
            pairId: pair.id,
            hasSystemTransaction: !!pair.systemTransaction
          });
          return false;
        }
        
        return true;
      });

      console.log('📊 Status finais baseados exclusivamente no banco:', {
        totalPairs: filteredPairs.length,
        statusDistribution: filteredPairs.reduce((acc: any, pair: any) => {
          acc[pair.status] = (acc[pair.status] || 0) + 1;
          return acc;
        }, {}),
        bankStatusDistribution: filteredPairs.reduce((acc: any, pair: any) => {
          const status = pair.bankTransaction?.status_conciliacao || 'undefined';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      });
      
      setPairs(filteredPairs);
      
      // ✅ CORREÇÃO: Recalcular summary baseado no reconciliation_status
      const totalPairs = filteredPairs.length;
      const conciliados = filteredPairs.filter((p: any) => p.bankTransaction?.status_conciliacao === 'conciliado').length;
      const sugeridos = filteredPairs.filter((p: any) => 
        p.bankTransaction?.status_conciliacao === 'pendente' && 
        p.bankTransaction?.reconciliation_status === 'sugerido' // ✅ CORREÇÃO: usar reconciliation_status
      ).length;
      const transferencias = filteredPairs.filter((p: any) => 
        p.bankTransaction?.reconciliation_status === 'transferencia' // ✅ CORREÇÃO: usar reconciliation_status
      ).length;
      const sem_match = filteredPairs.filter((p: any) => 
        p.bankTransaction?.reconciliation_status === 'sem_match' || // ✅ CORREÇÃO: usar reconciliation_status
        p.bankTransaction?.status_conciliacao === 'ignorado'
      ).length;
      const conflitos = 0; // Será calculado pela API se necessário
      const pendentes = filteredPairs.filter((p: any) => 
        p.bankTransaction?.status_conciliacao === 'pendente' && 
        p.bankTransaction?.reconciliation_status === 'sem_match' // ✅ CORREÇÃO: usar reconciliation_status
      ).length;
      
      const realSummary: ReconciliationSummary = {
        total: totalPairs,
        conciliados,
        sugeridos,
        transferencias,
        sem_match,
        conflitos,
        pendentes,
        percentageComplete: totalPairs > 0 ? Math.round((conciliados / totalPairs) * 100) : 0
      };
      
      console.log('📊 Summary recalculado baseado no banco:', {
        apiSummary: data.summary,
        realSummary,
        diferenca: {
          conciliados: (data.summary?.conciliados || 0) - realSummary.conciliados,
          sugeridos: (data.summary?.sugeridos || 0) - realSummary.sugeridos
        }
      });
      
      // Usar o summary recalculado em vez do da API
      setSummary(realSummary);
      setReconciliationId(data.reconciliation_id || '');
      
      console.log('✅ Sugestões carregadas com sucesso');
      
    } catch (error) {
      // Tratamento de erro melhorado para loadSuggestions
      const errorDetails = {
        function: 'loadSuggestions',
        selectedBankAccountId,
        periodo,
        errorType: error?.constructor?.name || 'UnknownError',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      };

      console.error('❌ Erro ao carregar sugestões:', errorDetails);
      
      toast({
        title: "Erro",
        description: "Falha ao carregar sugestões de conciliação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBankAccountId, periodo, empresaData?.id, includeReconciled, includeIgnored, toast]);

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

  // ✅ Função ATUALIZADA: Validação de transferências conforme especificação
  const isValidTransfer = useCallback((
    bankTransaction: BankTransaction | undefined, 
    systemTransaction: SystemTransaction | undefined
  ) => {
    if (!bankTransaction || !systemTransaction) return false;
    
    console.log('🔍 Verificando regra de transferência para:', {
      bankId: bankTransaction.id,
      systemId: systemTransaction.id,
      bankMemo: bankTransaction.memo || bankTransaction.payee,
      systemDesc: systemTransaction.descricao,
      bankAmount: bankTransaction.amount,
      systemAmount: systemTransaction.valor,
      bankDate: bankTransaction.posted_at,
      systemDate: systemTransaction.data_lancamento
    });
    
    // ✅ CRITÉRIO 1: Descrição contendo termos de transferência
    const TRANSFER_KEYWORDS = [
      'TRANSF', 'TRANSFERÊNCIA', 'TRANSFERENCIA',
      'TED', 'DOC', 'PIX TRANSF', 'TRANSFER',
      'TRANSFER NCIA', 'TRANSFER NCIA ENTRADA', 'TRANSFER NCIA SA DA'
    ];
    
    const hasTransferTerms = (text: string) => {
      if (!text) return false;
      const upperText = text.toUpperCase();
      return TRANSFER_KEYWORDS.some(keyword => upperText.includes(keyword));
    };
    
    // Verificar se PELO MENOS UM dos lançamentos (OFX ou Sistema) contém termos de transferência
    const bankHasTransferTerms = hasTransferTerms(bankTransaction.memo || '') || 
                                hasTransferTerms(bankTransaction.payee || '') ||
                                (bankTransaction.fit_id && bankTransaction.fit_id.includes('TRANSF-'));
    
    const systemHasTransferTerms = systemTransaction.tipo === 'transferencia' ||
                                  hasTransferTerms(systemTransaction.descricao || '') ||
                                  hasTransferTerms(systemTransaction.numero_documento || '');
    
    const hasAnyTransferTerm = bankHasTransferTerms || systemHasTransferTerms;
    
    if (!hasAnyTransferTerm) {
      console.log('🚫 Transferência rejeitada - sem termos de transferência:', {
        bankHasTransferTerms,
        systemHasTransferTerms,
        bankTexts: [bankTransaction.memo, bankTransaction.payee, bankTransaction.fit_id],
        systemTexts: [systemTransaction.descricao, systemTransaction.numero_documento, systemTransaction.tipo]
      });
      return false;
    }
    
    // ✅ CRITÉRIO 2: Data exatamente igual (mesmo dia)
    const bankDate = new Date(bankTransaction.posted_at);
    const systemDate = new Date(systemTransaction.data_lancamento);
    
    if (isNaN(bankDate.getTime()) || isNaN(systemDate.getTime())) {
      console.log('🚫 Transferência rejeitada - datas inválidas:', {
        bankDate: bankTransaction.posted_at,
        systemDate: systemTransaction.data_lancamento
      });
      return false;
    }
    
    // Comparar apenas a parte da data (ignorar horário)
    const bankDateStr = bankDate.toISOString().split('T')[0];
    const systemDateStr = systemDate.toISOString().split('T')[0];
    const exactSameDate = bankDateStr === systemDateStr;
    
    if (!exactSameDate) {
      console.log('🚫 Transferência rejeitada - datas diferentes:', {
        bankDate: bankDateStr,
        systemDate: systemDateStr,
        requirement: 'Data deve ser exatamente igual (mesmo dia)'
      });
      return false;
    }
    
    // ✅ CRITÉRIO 3: Valores iguais e opostos
    const bankAmount = bankTransaction.amount;
    const systemAmount = systemTransaction.valor;
    
    // Verificar se os valores são iguais em absoluto
    const absoluteBankAmount = Math.abs(bankAmount);
    const absoluteSystemAmount = Math.abs(systemAmount);
    const amountDifference = Math.abs(absoluteBankAmount - absoluteSystemAmount);
    const amountTolerance = 0.01; // Tolerância de 1 centavo
    
    const valuesAreEqual = amountDifference <= amountTolerance;
    
    if (!valuesAreEqual) {
      console.log('🚫 Transferência rejeitada - valores não são iguais:', {
        bankAmount: absoluteBankAmount,
        systemAmount: absoluteSystemAmount,
        difference: amountDifference,
        tolerance: amountTolerance
      });
      return false;
    }
    
    // Verificar se os valores têm sinais opostos (um positivo, outro negativo)
    const haveOppositeSigns = (bankAmount > 0 && systemAmount < 0) || 
                             (bankAmount < 0 && systemAmount > 0);
    
    if (!haveOppositeSigns) {
      console.log('🚫 Transferência rejeitada - valores não têm sinais opostos:', {
        bankAmount,
        systemAmount,
        requirement: 'Valores devem ter sinais opostos'
      });
      return false;
    }
    
    // ✅ TODAS AS VERIFICAÇÕES PASSARAM
    console.log('✅ Transferência VÁLIDA identificada (todas as regras atendidas):', {
      bankTransactionId: bankTransaction.id,
      systemTransactionId: systemTransaction.id,
      bankAmount,
      systemAmount,
      bankDate: bankDateStr,
      systemDate: systemDateStr,
      bankTexts: [bankTransaction.memo, bankTransaction.payee],
      systemTexts: [systemTransaction.descricao, systemTransaction.tipo],
      criteria: {
        keywords: '✅ Pelo menos um lado contém termos de transferência',
        dates: '✅ Data exatamente igual (mesmo dia)',
        values: '✅ Valores iguais e com sinais opostos'
      }
    });
    
    return true;
  }, []);

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

  // Função para limpar conflitos de conciliação
  const handleCleanConflicts = async () => {
    if (!selectedBankAccountId || !empresaData?.id) {
      toast({
        title: "Erro",
        description: "Selecione uma conta bancária primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/reconciliation/clean-conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaData.id,
          bank_account_id: selectedBankAccountId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao limpar conflitos');
      }

      const result = await response.json();
      
      toast({
        title: "Conflitos Limpos",
        description: result.message,
        variant: "default",
      });

      // Recarregar dados após limpeza
      if (selectedBankAccountId) {
        loadSuggestions();
      }

    } catch (error) {
      console.error('❌ Erro ao limpar conflitos:', error);
      toast({
        title: "Erro na Limpeza",
        description: error instanceof Error ? error.message : "Falha ao limpar conflitos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pairs baseado no status
  const filteredPairs = pairs.filter(pair => {
    // ✅ CORREÇÃO: Filtros separados para conciliados e ignorados
    const isReconciled = pair.bankTransaction?.status_conciliacao === 'conciliado';
    const isIgnored = pair.bankTransaction?.status_conciliacao === 'ignorado';
    
    // Filtrar conciliados
    if (!includeReconciled && isReconciled) {
      console.log('🚫 Filtrando transação conciliada:', {
        pairId: pair.id,
        status: pair.status,
        bankTransactionStatus: pair.bankTransaction?.status_conciliacao,
        includeReconciled
      });
      return false;
    }
    
    // Filtrar ignorados separadamente
    if (!includeIgnored && isIgnored) {
      console.log('🚫 Filtrando transação ignorada:', {
        pairId: pair.id,
        status: pair.status,
        reconciliationStatus: pair.bankTransaction?.reconciliation_status,
        includeIgnored
      });
      return false;
    }
    
    // Depois, filtrar baseado no status selecionado
    if (statusFilter === 'all') return true;
    return pair.status === statusFilter;
  });

  // Filtrar por termo de busca
  const searchFilteredPairs = filteredPairs.filter(pair => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Busca por texto (descrição, memo, beneficiário)
    const textMatch = (
      pair.bankTransaction?.memo.toLowerCase().includes(searchLower) ||
      pair.systemTransaction?.descricao.toLowerCase().includes(searchLower) ||
      pair.bankTransaction?.payee?.toLowerCase().includes(searchLower)
    );
    
    // Busca por valor (permite buscar valor exato ou parcial)
    const valueMatch = (
      pair.bankTransaction?.amount.toString().includes(searchTerm) ||
      pair.systemTransaction?.valor.toString().includes(searchTerm) ||
      // Busca por valor formatado (com vírgula como decimal)
      pair.bankTransaction?.amount.toFixed(2).replace('.', ',').includes(searchTerm) ||
      pair.systemTransaction?.valor.toFixed(2).replace('.', ',').includes(searchTerm) ||
      // Busca por valor absoluto (sem considerar sinal negativo)
      Math.abs(pair.bankTransaction?.amount || 0).toString().includes(searchTerm) ||
      Math.abs(pair.systemTransaction?.valor || 0).toString().includes(searchTerm)
    );
    
    return textMatch || valueMatch;
  });

  // Log para debug dos filtros
  if (pairs.length > 0) {
    console.log('🔍 Estados dos filtros:', {
      totalPairs: pairs.length,
      afterStatusFilter: filteredPairs.length,
      afterSearchFilter: searchFilteredPairs.length,
      usarFiltroPeriodo,
      dataInicio,
      dataFim,
      statusFilter,
      searchTerm,
      includeReconciled,
      reconciledCount: pairs.filter(p => p.bankTransaction?.status_conciliacao === 'conciliado').length
    });
  }

  // Filtrar por período de data (quando ativado)
  const dateFilteredPairs = searchFilteredPairs.filter(pair => {
    if (!usarFiltroPeriodo || (!dataInicio && !dataFim)) return true;

    // Obter a data da transação (preferência: bancária, depois sistema)
    let transactionDate = '';
    if (pair.bankTransaction?.posted_at) {
      transactionDate = pair.bankTransaction.posted_at;
    } else if (pair.systemTransaction?.data_lancamento) {
      transactionDate = pair.systemTransaction.data_lancamento;
    }

    if (!transactionDate) {
      return true;
    }

    // Converter para formato de comparação (YYYY-MM-DD)
    const date = new Date(transactionDate);
    const dateStr = date.toISOString().split('T')[0];

    // Verificar se está dentro do período
    let withinPeriod = true;
    if (dataInicio) {
      withinPeriod = withinPeriod && dateStr >= dataInicio;
    }
    if (dataFim) {
      withinPeriod = withinPeriod && dateStr <= dataFim;
    }

    return withinPeriod;
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

  // ✅ FUNÇÃO COORDENADA: Criar sugestão de conciliação
  const handleCreateSuggestion = async (
    bankTransaction: BankTransaction, 
    suggestionData: {
      selectedLancamentos: any[];
      primaryLancamento?: any; // ✅ ADICIONAR: lançamento com dados agregados
      primaryLancamentoId?: string | null;
      isValidMatch: boolean;
      totalValue: number;
      hasDiscrepancy: boolean;
      useExistingHandling?: boolean;
      matchType?: 'exact_match' | 'manual' | 'multiple_transactions';
      confidenceLevel?: 'high' | 'medium' | 'low';
      validation?: any;
      summary?: any;
    }
  ) => {
    try {
      console.log('🎯 Criando sugestão de conciliação - COORDENADO:', {
        bankTransaction: bankTransaction ? {
          id: bankTransaction.id,
          amount: bankTransaction.amount,
          transaction_type: bankTransaction.transaction_type,
          posted_at: bankTransaction.posted_at
        } : 'null/undefined',
        suggestionData: {
          selectedLancamentosCount: suggestionData?.selectedLancamentos?.length || 0,
          selectedLancamentosIds: suggestionData?.selectedLancamentos?.map(l => l.id) || [],
          isValidMatch: suggestionData?.isValidMatch,
          hasDiscrepancy: suggestionData?.hasDiscrepancy,
          totalValue: suggestionData?.totalValue,
          matchType: suggestionData?.matchType || 'manual',
          confidenceLevel: suggestionData?.confidenceLevel || 'medium',
          useExistingHandling: suggestionData?.useExistingHandling
        }
      });

      // Validação inicial
      if (!bankTransaction) {
        console.error('❌ bankTransaction é null/undefined:', { bankTransaction });
        throw new Error('Transação bancária não fornecida');
      }
      
      if (!bankTransaction.id) {
        console.error('❌ bankTransaction.id é null/undefined:', { 
          bankTransaction,
          hasId: !!bankTransaction.id,
          idValue: bankTransaction.id 
        });
        throw new Error('Transação bancária sem ID válido');
      }

      if (!suggestionData || !suggestionData.selectedLancamentos || suggestionData.selectedLancamentos.length === 0) {
        throw new Error('Dados de sugestão inválidos ou sem lançamentos selecionados');
      }

      const lancamentosSelecionados = suggestionData.selectedLancamentos;
      
      // ✅ DETERMINAR STATUS baseado na validação de transferência
      let statusFinal: 'sugerido' | 'transferencia' = 'sugerido';
      let statusConciliacao: 'pendente' | 'conciliado' = 'pendente';
      
      // Se é um match válido de 1 lançamento, verificar se é transferência
      if (lancamentosSelecionados.length === 1 && suggestionData.isValidMatch) {
        const isTransfer = isValidTransfer(bankTransaction, lancamentosSelecionados[0]);
        
        if (isTransfer) {
          statusFinal = 'transferencia';
          console.log('🔵 Transferência detectada automaticamente:', {
            bankId: bankTransaction.id,
            systemId: lancamentosSelecionados[0].id,
            bankMemo: bankTransaction.memo,
            systemDesc: lancamentosSelecionados[0].descricao
          });
        }
      }

      console.log('📊 Status determinado:', {
        statusFinal,
        statusConciliacao,
        isTransfer: statusFinal === 'transferencia',
        selectedCount: lancamentosSelecionados.length
      });

      // ✅ CHAMAR API para gravar na tabela transaction_matches e atualizar bank_transactions
      const response = await fetch('/api/reconciliation/create-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: bankTransaction.id,
          system_transaction_ids: lancamentosSelecionados.map(l => l.id),
          primary_transaction_id: suggestionData.primaryLancamentoId || lancamentosSelecionados[0]?.id,
          reconciliation_status: statusFinal, // ✅ CORREÇÃO: usar reconciliation_status (nome correto da coluna)
          match_type: suggestionData.matchType || (suggestionData.isValidMatch ? 'exact_match' : 'manual'),
          confidence_level: suggestionData.confidenceLevel || (suggestionData.isValidMatch ? 'high' : 'medium'),
          has_discrepancy: suggestionData.hasDiscrepancy,
          total_value: suggestionData.totalValue,
          validation_data: suggestionData.validation
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sugestão');
      }

      const result = await response.json();
      console.log('✅ Sugestão criada com sucesso na API:', result);

      // ✅ ATUALIZAR ESTADO LOCAL imediatamente (UX responsivo)
      setPairs(currentPairs => {
        const updatedPairs = currentPairs.map(pair => {
          if (pair.bankTransaction?.id === bankTransaction.id) {
            if (!pair.bankTransaction) {
              console.error('❌ bankTransaction não encontrado no pair');
              return pair;
            }

            console.log('🔄 Atualizando pair local:', {
              pairId: pair.id,
              bankTransactionId: pair.bankTransaction.id,
              statusFinal,
              currentStatus: pair.status
            });

            // ✅ CORREÇÃO: Usar primaryLancamento para múltiplos lançamentos
            const primaryLancamentoForCard = suggestionData.primaryLancamento || {
              ...lancamentosSelecionados[0],
              valor: suggestionData.totalValue, // Usar valor total para múltiplos lançamentos
              descricao: lancamentosSelecionados.length > 1 
                ? `${lancamentosSelecionados.length} lançamentos selecionados`
                : lancamentosSelecionados[0].descricao
            };

            console.log('🎯 Card primaryLancamento criado:', {
              isMultiple: lancamentosSelecionados.length > 1,
              originalFirstValue: lancamentosSelecionados[0]?.valor,
              newTotalValue: primaryLancamentoForCard.valor,
              totalValue: suggestionData.totalValue
            });

            return {
              ...pair,
              status: statusFinal as 'conciliado' | 'sugerido' | 'transferencia' | 'sem_match' | 'conflito' | 'pendente' | 'matched' | 'suggested' | 'transfer' | 'no_match',
              systemTransaction: primaryLancamentoForCard, // ✅ CORREÇÃO: Usar lançamento com valor total
              systemTransactions: lancamentosSelecionados, // Todos os lançamentos
              matchScore: statusFinal === 'transferencia' ? 100 : 75,
              matchReason: statusFinal === 'transferencia' ? 'Transferência automática' : 'Sugestão manual',
              confidenceLevel: (suggestionData.confidenceLevel || (statusFinal === 'transferencia' ? '100%' : 'manual')) as '100%' | 'provavel' | 'manual' | 'baixo',
              bankTransaction: {
                ...pair.bankTransaction,
                transation_status: statusFinal, // ✅ CORREÇÃO: usar transation_status
                status_conciliacao: statusConciliacao
              }
            };
          }
          return pair;
        });
        
        console.log('✅ Estado pairs atualizado com sucesso');
        return updatedPairs;
      });

      // ✅ ATUALIZAR SUMMARY baseado no novo status
      setSummary(currentSummary => {
        if (!currentSummary) return currentSummary;
        
        const newSummary = {
          ...currentSummary,
          sugeridos: statusFinal === 'sugerido' ? currentSummary.sugeridos + 1 : currentSummary.sugeridos,
          transferencias: statusFinal === 'transferencia' ? currentSummary.transferencias + 1 : currentSummary.transferencias,
          sem_match: Math.max(0, currentSummary.sem_match - 1), // Diminuir sem_match
        };
        
        // Recalcular percentual
        newSummary.percentageComplete = newSummary.total > 0 ? 
          Math.round(((newSummary.conciliados + newSummary.transferencias) / newSummary.total) * 100) : 0;
        
        return newSummary;
      });

      // ✅ TOAST DE SUCESSO
      toast({
        title: statusFinal === 'transferencia' ? "Transferência Identificada" : "Sugestão Criada",
        description: `${lancamentosSelecionados.length} lançamento${lancamentosSelecionados.length > 1 ? 's' : ''} vinculado${lancamentosSelecionados.length > 1 ? 's' : ''} com sucesso`,
      });

      console.log('✅ Processo coordenado concluído com sucesso');

    } catch (error) {
      console.error('❌ Erro ao criar sugestão coordenada:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Falha ao criar sugestão de conciliação";
      toast({
        title: "Erro",
        description: `Erro ao criar sugestão: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Função para atualizar status do pair localmente (resposta imediata)
  const updatePairStatus = (pairId: string, newStatus: string) => {
    setPairs(currentPairs => {
      const updatedPairs = currentPairs.map(pair => 
        pair.id === pairId 
          ? { 
              ...pair, 
              status: newStatus as any,
              // ✅ CORREÇÃO: Mapear corretamente para reconciliation_status
              bankTransaction: pair.bankTransaction ? {
                ...pair.bankTransaction,
                status_conciliacao: (newStatus === 'conciliado' || newStatus === 'matched' ? 'conciliado' : 
                                   newStatus === 'ignored' ? 'ignorado' :
                                   newStatus === 'no_match' || newStatus === 'sem_match' ? 'pendente' : 'pendente') as 'pendente' | 'conciliado' | 'ignorado',
                reconciliation_status: (newStatus === 'conciliado' || newStatus === 'matched' ? 'sugerido' : 
                                  newStatus === 'transferencia' || newStatus === 'transfer' ? 'transferencia' :
                                  newStatus === 'sugerido' || newStatus === 'suggested' ? 'sugerido' :
                                  'sem_match') as 'sugerido' | 'transferencia' | 'sem_match' | 'conciliado' | 'pending' // ✅ CORREÇÃO: usar reconciliation_status
              } : pair.bankTransaction
            }
          : pair
      );
      
      // ✅ CORREÇÃO: Filtros separados para conciliados e ignorados
      const filteredPairs = updatedPairs.filter(pair => {
        const isReconciled = pair.bankTransaction?.status_conciliacao === 'conciliado';
        const isIgnored = pair.bankTransaction?.status_conciliacao === 'ignorado';
        
        // Filtrar conciliados
        if (!includeReconciled && isReconciled) {
          return false;
        }
        
        // Filtrar ignorados
        if (!includeIgnored && isIgnored) {
          return false;
        }
        
        return true;
      });
      
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
      
      return filteredPairs;
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
          
          try {
            await handleAutoConciliate(pair);
            
            // ✅ AGUARDAR processamento completo antes de recarregar
            console.log('⏳ Aguardando processamento completo...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // ✅ VERIFICAR se foi realmente conciliado
            console.log('🔍 Verificando se foi persistido no banco...');
            const verifyResponse = await fetch(`/api/reconciliation/status/${pair.bankTransaction?.id}`);
            if (verifyResponse.ok) {
              const statusData = await verifyResponse.json();
              console.log('📊 Status após conciliação:', statusData);
              
              if (statusData.status_conciliacao !== 'conciliado') {
                console.warn('⚠️ ATENÇÃO: Conciliação não foi persistida!');
                toast({
                  title: "Aviso",
                  description: "A conciliação pode não ter sido persistida. Recarregue a página para verificar.",
                  variant: "destructive",
                });
              } else {
                console.log('✅ Conciliação confirmada no banco de dados');
                toast({
                  title: "Conciliação automática executada!",
                  description: "Transação conciliada automaticamente",
                });
              }
            }
            
            // ✅ RECARREGAR dados do banco
            console.log('🔄 RECARREGANDO dados do banco após conciliação automática...');
            await loadSuggestions();
            
          } catch (error) {
            console.error('❌ Erro na conciliação automática:', error);
            toast({
              title: "Erro na Conciliação",
              description: error instanceof Error ? error.message : "Erro desconhecido na conciliação",
              variant: "destructive",
            });
          }
          return;
        case 'manual_conciliate':
          console.log('🔄 Executando conciliação manual...');
          await handleManualConciliate(pair, details);
          
          // ✅ CORREÇÃO: RECARREGAR dados do banco em vez de apenas atualizar local
          console.log('🔄 RECARREGANDO dados do banco após conciliação manual...');
          await loadSuggestions();
          
          toast({
            title: "Conciliação manual executada!",
            description: "Transação conciliada manualmente",
          });
          return;
        case 'confirm_transfer':
          console.log('🔄 Confirmando transferência...');
          
          try {
            await handleConfirmTransfer(pair);
            
            // ✅ AGUARDAR processamento completo antes de recarregar
            console.log('⏳ Aguardando processamento completo da transferência...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // ✅ VERIFICAR se foi realmente conciliado
            console.log('🔍 Verificando se transferência foi persistida no banco...');
            const verifyResponse = await fetch(`/api/reconciliation/status/${pair.bankTransaction?.id}`);
            if (verifyResponse.ok) {
              const statusData = await verifyResponse.json();
              console.log('📊 Status após confirmação de transferência:', statusData);
              
              if (statusData.status_conciliacao !== 'conciliado') {
                console.warn('⚠️ ATENÇÃO: Transferência não foi persistida!');
                toast({
                  title: "Aviso",
                  description: "A confirmação da transferência pode não ter sido persistida. Recarregue a página para verificar.",
                  variant: "destructive",
                });
              } else {
                console.log('✅ Transferência confirmada no banco de dados');
                toast({
                  title: "Transferência conciliada com sucesso!",
                  description: "Transferência confirmada",
                });
              }
            }
            
            // ✅ RECARREGAR dados do banco
            console.log('🔄 RECARREGANDO dados do banco após confirmação de transferência...');
            await loadSuggestions();
            
          } catch (error) {
            console.error('❌ Erro na confirmação de transferência:', error);
            toast({
              title: "Erro na Confirmação",
              description: error instanceof Error ? error.message : "Erro desconhecido na confirmação",
              variant: "destructive",
            });
          }
          return;
        case 'unlink':
          console.log('🔄 Desconciliando...');
          console.log('📊 Dados do pair para desconciliação:', {
            id: pair.id,
            status: pair.status,
            bankTransaction: pair.bankTransaction ? {
              id: pair.bankTransaction.id,
              memo: pair.bankTransaction.memo,
              amount: pair.bankTransaction.amount,
              status_conciliacao: pair.bankTransaction.status_conciliacao
            } : null,
            systemTransaction: pair.systemTransaction ? {
              id: pair.systemTransaction.id,
              descricao: pair.systemTransaction.descricao
            } : null
          });
          
          try {
            console.log('🚀 Chamando handleUnlink...');
            await handleUnlink(pair);
            
            console.log('✅ handleUnlink executado com sucesso');
            
            // ✅ CORREÇÃO CRÍTICA: Atualizar estado local IMEDIATAMENTE para feedback visual
            console.log('🔄 Atualizando estado local para atualização imediata da cor...');
            setPairs(currentPairs => {
              return currentPairs.map(p => {
                if (p.id === pair.id) {
                  return {
                    ...p,
                    status: 'sem_match',
                    systemTransaction: null,
                    systemTransactions: [],
                    bankTransaction: p.bankTransaction ? {
                      ...p.bankTransaction,
                      status_conciliacao: 'pendente',
                      transation_status: 'sem_match' // ✅ Atualizar transation_status para sem_match
                    } : p.bankTransaction
                  };
                }
                return p;
              });
            });

            // ✅ Atualizar summary local
            setSummary(currentSummary => {
              if (!currentSummary) return currentSummary;
              
              const newSummary = { ...currentSummary };
              
              // Decrementar do status atual
              if (pair.status === 'sugerido') {
                newSummary.sugeridos = Math.max(0, newSummary.sugeridos - 1);
              } else if (pair.status === 'transferencia') {
                newSummary.transferencias = Math.max(0, newSummary.transferencias - 1);
              } else if (pair.status === 'conciliado') {
                newSummary.conciliados = Math.max(0, newSummary.conciliados - 1);
              }
              
              // Incrementar sem_match
              newSummary.sem_match = newSummary.sem_match + 1;
              
              // Recalcular percentual
              newSummary.percentageComplete = newSummary.total > 0 ? 
                Math.round(((newSummary.conciliados + newSummary.transferencias) / newSummary.total) * 100) : 0;
              
              return newSummary;
            });
            
            toast({
              title: "Transação desvinculada!",
              description: "A transação foi desvinculada com sucesso",
            });
            console.log('✅ Unlink concluído com atualização local imediata');
            return;
          } catch (unlinkError) {
            console.error('💥 Erro específico no handleUnlink:', unlinkError);
            throw unlinkError; // Re-throw para ser capturado pelo catch geral
          }
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

  // ✅ FUNÇÃO DE TESTE: Verificar se API de conciliação está funcionando
  const testConciliationAPI = async (bankTransactionId: string, systemTransactionId: string) => {
    console.log('🧪 TESTE: Verificando API de conciliação...');
    
    try {
      // 1. Verificar status antes
      console.log('1️⃣ Verificando status ANTES da conciliação...');
      const beforeResponse = await fetch(`/api/reconciliation/status/${bankTransactionId}`);
      const beforeData = beforeResponse.ok ? await beforeResponse.json() : null;
      console.log('📊 Status ANTES:', beforeData?.status_conciliacao || 'não verificado');
      
      // 2. Chamar API de conciliação
      console.log('2️⃣ Chamando API de conciliação...');
      const conciliateResponse = await fetch('/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: bankTransactionId,
          system_transaction_id: systemTransactionId,
          confidence_level: 'high',
          rule_applied: 'manual_test'
        })
      });
      
      console.log('📡 Resposta da conciliação:', {
        status: conciliateResponse.status,
        statusText: conciliateResponse.statusText,
        ok: conciliateResponse.ok
      });
      
      if (!conciliateResponse.ok) {
        const errorText = await conciliateResponse.text();
        console.error('❌ API retornou erro:', errorText);
        return;
      }
      
      const conciliateResult = await conciliateResponse.json();
      console.log('✅ Resultado da conciliação:', conciliateResult);
      
      // 3. Verificar status depois
      console.log('3️⃣ Verificando status DEPOIS da conciliação...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      
      const afterResponse = await fetch(`/api/reconciliation/status/${bankTransactionId}`);
      const afterData = afterResponse.ok ? await afterResponse.json() : null;
      console.log('📊 Status DEPOIS:', afterData?.status_conciliacao || 'não verificado');
      
      // 4. Resultado do teste
      const statusMudou = beforeData?.status_conciliacao !== afterData?.status_conciliacao;
      const ficouConciliado = afterData?.status_conciliacao === 'conciliado';
      
      console.log('🎯 RESULTADO DO TESTE:', {
        statusAntes: beforeData?.status_conciliacao,
        statusDepois: afterData?.status_conciliacao,
        statusMudou,
        ficouConciliado,
        apiEstaFuncionando: statusMudou && ficouConciliado
      });
      
      if (!statusMudou) {
        console.error('🚨 PROBLEMA: API não alterou o status na tabela bank_transactions');
        console.error('🔧 SOLUÇÃO: Verificar implementação da API /api/reconciliation/conciliate');
      } else if (!ficouConciliado) {
        console.warn('⚠️ AVISO: Status mudou mas não ficou "conciliado"');
      } else {
        console.log('🎉 SUCESSO: API está funcionando corretamente!');
      }
      
    } catch (error) {
      console.error('💥 Erro no teste:', error);
    }
  };

  // Handlers para cada tipo de ação
  const handleAutoConciliate = async (pair: ReconciliationPair) => {
    console.log('🚀 handleAutoConciliate iniciado:', {
      pair: {
        id: pair.id,
        status: pair.status,
        bankTransactionId: pair.bankTransaction?.id,
        systemTransactionId: pair.systemTransaction?.id,
        bankTransactionFitId: pair.bankTransaction?.fit_id,
        bankTransactionMemo: pair.bankTransaction?.memo,
        bankTransactionAmount: pair.bankTransaction?.amount,
        bankTransactionStatus: pair.bankTransaction?.status_conciliacao,
        systemTransactionDesc: pair.systemTransaction?.descricao,
        systemTransactionValue: pair.systemTransaction?.valor
      }
    });

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

    // Validar se os IDs são UUIDs válidos
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const bankIdValid = uuidRegex.test(pair.bankTransaction.id);
    const systemIdValid = uuidRegex.test(pair.systemTransaction.id);
    
    if (!bankIdValid) {
      const errorMsg = `ID da transação bancária não é um UUID válido: ${pair.bankTransaction.id}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!systemIdValid) {
      const errorMsg = `ID da transação do sistema não é um UUID válido: ${pair.systemTransaction.id}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('🔗 Iniciando conciliação automática:', {
      bank_transaction_id: pair.bankTransaction.id,
      system_transaction_id: pair.systemTransaction.id,
      confidence_level: pair.confidenceLevel,
      rule_applied: pair.ruleApplied,
      statusAtual: pair.bankTransaction.status_conciliacao,
      bankIdValid,
      systemIdValid
    });

    try {
      console.log('📡 Chamando API /api/reconciliation/conciliate...');
      
      const requestPayload = {
        bank_transaction_id: pair.bankTransaction.id,
        system_transaction_id: pair.systemTransaction.id,
        confidence_level: pair.confidenceLevel,
        rule_applied: pair.ruleApplied
      };
      
      console.log('📤 Payload da requisição:', JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch('/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      console.log('📡 Resposta da API de conciliação recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        console.error('🚨 RESPOSTA NÃO OK - Investigando detalhadamente...', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });

        let errorData;
        let errorText = '';
        let rawResponseText = '';
        
        try {
          // Primeiro, pegar o texto bruto da resposta
          rawResponseText = await response.text();
          console.log('📄 Texto bruto da resposta:', rawResponseText);
          
          if (rawResponseText) {
            try {
              // Tentar fazer parse do JSON
              errorData = JSON.parse(rawResponseText);
              errorText = errorData.error || errorData.message || errorData.details || 'Erro desconhecido na API';
              console.log('✅ JSON parseado com sucesso:', errorData);
            } catch (parseError) {
              console.warn('⚠️ Não foi possível fazer parse do JSON:', parseError);
              errorData = { 
                error: rawResponseText, 
                parseError: parseError instanceof Error ? parseError.message : 'Erro desconhecido' 
              };
              errorText = rawResponseText || `Erro HTTP ${response.status}: ${response.statusText}`;
            }
          } else {
            console.warn('⚠️ Resposta vazia da API');
            errorData = { error: 'Resposta vazia', status: response.status };
            errorText = `Erro HTTP ${response.status}: ${response.statusText} (resposta vazia)`;
          }
        } catch (textError) {
          console.error('💥 Erro ao obter texto da resposta:', textError);
          errorData = { 
            error: 'Erro ao ler resposta', 
            textError: textError instanceof Error ? textError.message : 'Erro desconhecido' 
          };
          errorText = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('❌ Erro na API de conciliação - DETALHADO:', {
          status: response.status,
          statusText: response.statusText,
          rawResponseText,
          errorData,
          errorText,
          timestamp: new Date().toISOString(),
          requestPayload: {
            bank_transaction_id: pair.bankTransaction.id,
            system_transaction_id: pair.systemTransaction.id,
            confidence_level: pair.confidenceLevel,
            rule_applied: pair.ruleApplied
          }
        });
        
        throw new Error(errorText || 'Erro ao conciliar transação');
      }

      const result = await response.json();
      console.log('✅ Conciliação bem-sucedida:', {
        result,
        timestamp: new Date().toISOString()
      });
      
      // ✅ VERIFICAÇÃO CRÍTICA: Confirmar se a API realmente alterou o status
      console.log('🔍 Verificando se a API alterou o status_conciliacao para "conciliado"...');
      
      // Aguardar um breve momento para a API processar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar diretamente no banco se o status foi alterado
      try {
        const verifyResponse = await fetch(`/api/reconciliation/status/${pair.bankTransaction.id}`);
        if (verifyResponse.ok) {
          const statusData = await verifyResponse.json();
          console.log('📊 Status verificado no banco após conciliação:', {
            bankTransactionId: pair.bankTransaction.id,
            statusAnterior: pair.bankTransaction.status_conciliacao,
            statusAtual: statusData.status_conciliacao,
            foiAlterado: statusData.status_conciliacao === 'conciliado'
          });
          
          if (statusData.status_conciliacao !== 'conciliado') {
            console.warn('⚠️ AVISO: API retornou sucesso, mas status não foi alterado para "conciliado"');
            console.warn('🔧 Possível problema na API /api/reconciliation/conciliate');
          }
        } else {
          console.warn('⚠️ Não foi possível verificar status no banco:', verifyResponse.status);
        }
      } catch (verifyError) {
        console.warn('⚠️ Erro ao verificar status no banco:', verifyError);
      }
      
      return result;
      
    } catch (error) {
      console.error('💥 ERRO capturado em handleAutoConciliate:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        errorName: error instanceof Error ? error.name : 'N/A',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
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
      let errorData;
      let errorText = '';
      
      try {
        errorData = await response.json();
        errorText = errorData.error || 'Erro desconhecido na API';
      } catch (parseError) {
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        errorData = { error: errorText };
      }
      
      console.error('❌ Erro na API de conciliação manual:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorText
      });
      
      throw new Error(errorText || 'Erro ao conciliar transação manualmente');
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
      let errorData;
      let errorText = '';
      
      try {
        errorData = await response.json();
        errorText = errorData.error || 'Erro desconhecido na API';
      } catch (parseError) {
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        errorData = { error: errorText };
      }
      
      console.error('❌ Erro na API de resolução de conflito:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorText
      });
      
      throw new Error(errorText || 'Erro ao resolver conflito');
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
      current_status: pair.bankTransaction.status_conciliacao,
      current_transation_status: pair.bankTransaction.transation_status,
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
      let errorData;
      let errorText = '';
      
      try {
        errorData = await response.json();
        errorText = errorData.error || 'Erro desconhecido na API';
      } catch (parseError) {
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        errorData = { error: errorText };
      }
      
      console.error('❌ Erro na API de ignorar transação:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorText
      });
      
      throw new Error(errorText || 'Erro ao ignorar transação');
    }

    const result = await response.json();
    console.log('✅ Transação ignorada com sucesso:', {
      result,
      bank_transaction_id: pair.bankTransaction.id,
      new_status: 'ignored'
    });
  };

  // ✅ NOVA FUNÇÃO: Limpar conflitos de conciliação
  const cleanReconciliationConflicts = async () => {
    console.log('🧹 Iniciando limpeza de conflitos de conciliação...');
    
    try {
      const response = await fetch('/api/reconciliation/clean-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: empresaData?.id,
          bank_account_id: selectedBankAccountId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Conflitos limpos:', result);
        
        toast({
          title: "Conflitos Resolvidos",
          description: `${result.cleaned_count || 0} conflitos foram corrigidos`,
        });
        
        // Recarregar dados
        await loadSuggestions();
        
        return result;
      } else {
        console.error('❌ Erro ao limpar conflitos:', response.status);
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de conflitos:', error);
      toast({
        title: "Erro",
        description: "Falha ao limpar conflitos de conciliação",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleConfirmTransfer = async (pair: ReconciliationPair) => {
    console.log('🚀 Confirmando transferência (versão robusta):', {
      bankTransactionId: pair.bankTransaction?.id,
      systemTransactionId: pair.systemTransaction?.id,
      bankStatus: pair.bankTransaction?.status_conciliacao
    });

    if (!pair.bankTransaction || !pair.systemTransaction) {
      console.error('❌ Dados insuficientes para confirmar transferência');
      toast({
        title: "Erro",
        description: "Dados insuficientes para confirmar transferência",
        variant: "destructive",
      });
      return;
    }

    try {
      // ✅ ESTRATÉGIA ROBUSTA: Limpar conflitos primeiro
      console.log('🧹 Executando limpeza preventiva de conflitos...');
      
      try {
        await handleCleanConflicts();
        console.log('✅ Limpeza preventiva concluída');
      } catch (cleanError) {
        console.warn('⚠️ Falha na limpeza preventiva, continuando...', cleanError);
      }

      // ✅ TENTATIVA 1: Conciliação direta
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
        const errorData = await response.json();
        
        // Se der erro 409 (conflito), usar estratégia específica
        if (response.status === 409) {
          console.log('🔧 Conflito 409 detectado:', errorData);
          
          // ✅ ESTRATÉGIA ESPECÍFICA PARA 409
          if (errorData.error === 'DUPLICAÇÃO_BLOQUEADA') {
            toast({
              title: "Conflito de Duplicação",
              description: "Este lançamento já está conciliado com outra transação. Execute 'Limpar Conflitos' primeiro.",
              variant: "destructive",
            });
            return;
          }
          
          if (errorData.error === 'TRANSACAO_BANCARIA_JA_CONCILIADA') {
            toast({
              title: "Transação Já Conciliada",
              description: "Esta transação bancária já está conciliada. Desconcilie primeiro se necessário.",
              variant: "destructive",
            });
            return;
          }
          
          // ✅ TENTATIVA 2: Desconciliar e tentar novamente
          console.log('🔄 Tentando desconciliar e reconectar...');
          
          const unlinkResponse = await fetch('/api/reconciliation/unlink', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bank_transaction_id: pair.bankTransaction.id
            })
          });
          
          if (unlinkResponse.ok) {
            console.log('✅ Desconciliação bem-sucedida');
            
            // Aguardar um momento para consistência
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // ✅ TENTATIVA 3: Nova conciliação após limpeza
            const retryResponse = await fetch('/api/reconciliation/conciliate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bank_transaction_id: pair.bankTransaction.id,
                system_transaction_id: pair.systemTransaction.id,
                confidence_level: 'high',
                rule_applied: 'transfer_confirmation_after_cleanup'
              })
            });
            
            if (!retryResponse.ok) {
              const retryError = await retryResponse.json();
              console.error('❌ Falha após limpeza:', retryError);
              
              toast({
                title: "Erro Persistente",
                description: `Falha mesmo após limpeza: ${retryError.message || 'Erro desconhecido'}`,
                variant: "destructive",
              });
              return;
            }
            
            const retryResult = await retryResponse.json();
            console.log('✅ Transferência confirmada após limpeza:', retryResult);
            
          } else {
            console.error('❌ Falha na desconciliação');
            toast({
              title: "Erro na Desconciliação",
              description: "Não foi possível limpar a transação para nova conciliação",
              variant: "destructive",
            });
            return;
          }
          
        } else {
          // Outros tipos de erro
          console.error('❌ Erro não-409:', errorData);
          toast({
            title: "Erro na Conciliação",
            description: errorData.message || `Erro ${response.status}: ${errorData.error || 'Desconhecido'}`,
            variant: "destructive",
          });
          return;
        }
      }

      const result = await response.json();
      console.log('✅ Transferência confirmada com sucesso:', result);
      
      toast({
        title: "Transferência Confirmada",
        description: "A transferência foi conciliada com sucesso.",
        variant: "default",
      });
      
      // Recarregar dados após sucesso
      setTimeout(() => loadSuggestions(), 500);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao confirmar transferência:', error);
      
      toast({
        title: "Erro na Conciliação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const handleUnlink = async (pair: ReconciliationPair) => {
    console.log('🚀 handleUnlink iniciado:', {
      pair: {
        id: pair.id,
        status: pair.status,
        bankTransactionId: pair.bankTransaction?.id,
        systemTransactionId: pair.systemTransaction?.id,
        bankTransactionFitId: pair.bankTransaction?.fit_id,
        bankTransactionMemo: pair.bankTransaction?.memo,
        bankTransactionAmount: pair.bankTransaction?.amount,
        bankTransactionStatus: pair.bankTransaction?.status_conciliacao,
        systemTransactionDesc: pair.systemTransaction?.descricao,
        systemTransactionValue: pair.systemTransaction?.valor
      }
    });

    if (!pair.bankTransaction) {
      console.error('❌ Transação bancária não encontrada para desconciliar');
      return;
    }

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(pair.bankTransaction.id);
    
    if (!isValidUUID) {
      const errorMsg = `ID da transação bancária não é um UUID válido: ${pair.bankTransaction.id}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('🔗 Desconciliando transação:', {
      bank_transaction_id: pair.bankTransaction.id,
      statusAtual: pair.bankTransaction.status_conciliacao,
      isValidUUID
    });

    try {
      const response = await fetch('/api/reconciliation/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: pair.bankTransaction.id
        })
      });

      console.log('📡 Resposta da API recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        console.log('🚨 Resposta não OK, investigando erro...', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        let errorData;
        let errorText = '';
        
        try {
          const responseText = await response.text();
          console.log('📄 Texto bruto da resposta:', responseText);
          
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              console.log('✅ JSON parseado com sucesso:', errorData);
            } catch (jsonError) {
              console.log('❌ Erro ao fazer parse JSON:', jsonError);
              errorData = { error: responseText };
            }
          } else {
            console.log('⚠️ Resposta vazia da API');
            errorData = { error: 'Resposta vazia da API' };
          }
          
          errorText = errorData.error || errorData.message || `Erro HTTP ${response.status}`;
        } catch (textError) {
          console.log('💥 Erro ao obter texto da resposta:', textError);
          errorText = `Erro HTTP ${response.status}: ${response.statusText}`;
          errorData = { error: errorText };
        }
        
        console.error('❌ ERRO DESCONCILIAÇÃO v4.0 - DETALHADO:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorText,
          timestamp: new Date().toISOString(),
          fullResponse: response
        });
        
        // Tratamento específico para erro 404 (transação não encontrada)
        if (response.status === 404) {
          const msg404 = 'ERRO 404: Transação não encontrada na base de dados. A transação pode ter sido removida ou o ID está incorreto.';
          console.error('🔍 ERRO 404 ESPECÍFICO:', msg404);
          throw new Error(msg404);
        }
        
        const finalError = errorText || 'Erro ao desconciliar transação';
        console.error('🚨 ERRO FINAL SENDO LANÇADO:', finalError);
        throw new Error(finalError);
      }

      const result = await response.json();
      console.log('✅ Transação desconciliada (v3.0):', {
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('💥 CATCH PRINCIPAL v4.0 - Erro capturado em handleUnlink:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        errorName: error instanceof Error ? error.name : 'N/A',
        timestamp: new Date().toISOString()
      });
      throw error; // Re-throw para que seja tratado pelo código que chama
    }
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
      let errorData;
      let errorText = '';
      
      try {
        errorData = await response.json();
        errorText = errorData.error || 'Erro desconhecido na API';
      } catch (parseError) {
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        errorData = { error: errorText };
      }
      
      console.error('❌ Erro na API de rejeição:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorText
      });
      
      throw new Error(errorText || 'Erro ao rejeitar sugestão');
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
  }, [selectedBankAccountId, periodo, loadSuggestions]);

  // Inicializar e atualizar filtros de data baseado no período
  useEffect(() => {
    const periodStart = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-01`;
    const lastDay = new Date(Number(periodo.ano), Number(periodo.mes), 0).getDate();
    const periodEnd = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    setDataInicio(periodStart);
    setDataFim(periodEnd);
    
    console.log('📅 Filtros de data atualizados para:', { periodStart, periodEnd, periodo });
  }, [periodo]); // Executar sempre que o período mudar

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Proteção contra hidratação mismatch */}
      {!isClient ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="space-y-4">
                <div className="text-gray-400">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Carregando...
                </h3>
                <p className="text-gray-600">
                  Inicializando componente de conciliação
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Conteúdo principal após hidratação */}

      {/* Filtros Expandidos */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Filtros Avançados</h3>
              
              {/* 🧪 BOTÃO DE TESTE DA API - Descomente para testar */}
              {/* 
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">🧪 Teste da API de Conciliação</h4>
                <button
                  onClick={() => {
                    // Pegar uma transação de exemplo para testar
                    const testPair = pairs.find(p => p.bankTransaction && p.systemTransaction);
                    if (testPair) {
                      testConciliationAPI(testPair.bankTransaction.id, testPair.systemTransaction.id);
                    } else {
                      console.warn('Nenhum par encontrado para teste');
                    }
                  }}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  Testar API de Conciliação
                </button>
                <p className="text-xs text-yellow-700 mt-1">
                  Abre logs no console (F12) para verificar se a API está funcionando
                </p>
              </div>
              */}
              
              {/* Filtro de Período */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="usarFiltroPeriodo"
                      checked={usarFiltroPeriodo}
                      onChange={(e) => setUsarFiltroPeriodo(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label 
                      htmlFor="usarFiltroPeriodo" 
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Usar Filtro de Período
                    </label>
                  </div>
                </div>
                
                {usarFiltroPeriodo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 mb-1">
                        Data Início
                      </label>
                      <input
                        type="date"
                        id="dataInicio"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 mb-1">
                        Data Fim
                      </label>
                      <input
                        type="date"
                        id="dataFim"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Filtros de Status */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700">Filtrar por Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { key: 'sugeridos', label: 'Sugeridos', color: 'blue' },
                    { key: 'conciliados', label: 'Conciliados', color: 'green' },
                    { key: 'pendentes', label: 'Pendentes', color: 'yellow' },
                    { key: 'transferencias', label: 'Transferências', color: 'purple' },
                  ].map((status) => (
                    <label key={status.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtroStatus[status.key as keyof typeof filtroStatus]}
                        onChange={(e) => setFiltroStatus({
                          ...filtroStatus,
                          [status.key]: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtros de Valor */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700">Filtrar por Valor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="valorMinimo" className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Mínimo
                    </label>
                    <input
                      type="number"
                      id="valorMinimo"
                      value={valorMinimo}
                      onChange={(e) => setValorMinimo(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label htmlFor="valorMaximo" className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Máximo
                    </label>
                    <input
                      type="number"
                      id="valorMaximo"
                      value={valorMaximo}
                      onChange={(e) => setValorMaximo(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              {/* Filtro de Busca */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700">Buscar</h4>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Buscar por descrição ou valor..."
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  onClick={aplicarFiltros}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Aplicar Filtros
                </Button>
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>

              {/* 🔧 BOTÃO PARA LIMPAR CONFLITOS */}
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="text-sm font-medium text-red-800 mb-2">🔧 Resolver Conflitos de Conciliação</h4>
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      console.log('🧹 Executando limpeza de conflitos...');
                      try {
                        await cleanReconciliationConflicts();
                      } catch (error) {
                        console.error('❌ Erro ao limpar conflitos:', error);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 mr-2"
                  >
                    Limpar Conflitos
                  </button>
                  <button
                    onClick={() => {
                      // Executar SQL de diagnóstico via console
                      console.log('🔍 Execute este SQL no banco para diagnosticar:');
                      console.log(`
-- Verificar inconsistências entre bank_transactions e transaction_matches
SELECT 
    tm.bank_transaction_id,
    tm.system_transaction_id,
    tm.status as match_status,
    bt.status_conciliacao as bank_status,
    bt.memo,
    l.descricao
FROM transaction_matches tm
JOIN bank_transactions bt ON tm.bank_transaction_id = bt.id
LEFT JOIN lancamentos l ON tm.system_transaction_id = l.id
WHERE tm.status = 'confirmed' 
AND bt.status_conciliacao != 'conciliado'
AND bt.empresa_id = '${empresaData?.id}'
ORDER BY tm.created_at DESC;
                      `);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Ver SQL de Diagnóstico
                  </button>
                </div>
                <p className="text-xs text-red-700 mt-2">
                  Use quando há erro 409 (conflitos) na conciliação de transferências
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conciliados</p>
                  <p className="text-2xl font-bold text-green-600">{summary.conciliados}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sugeridos</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.sugeridos}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progresso</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.percentageComplete.toFixed(1)}%</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seletor de Período e Conta Bancária */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Seletor de Período */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="flex gap-2">
                <Select
                  value={periodo.mes}
                  onValueChange={(mes) => handlePeriodoChange(mes, periodo.ano)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={periodo.ano}
                  onValueChange={(ano) => handlePeriodoChange(periodo.mes, ano)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {gerarListaAnos().map((ano) => (
                      <SelectItem key={ano} value={ano}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('🔄 Forçando recarregamento do período atual:', periodo);
                    // Limpar dados atuais
                    setPairs([]);
                    setSummary(null);
                    
                    // Recarregar dados
                    if (selectedBankAccountId) {
                      loadSuggestions();
                    }
                  }}
                  className="px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Input de Busca */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Transações
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por descrição, beneficiário, valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button
                onClick={() => setIncludeReconciled(!includeReconciled)}
                variant={includeReconciled ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={includeReconciled}
                  onChange={() => {}}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mostrar conciliados
              </Button>
              <Button
                onClick={() => setIncludeIgnored(!includeIgnored)}
                variant={includeIgnored ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={includeIgnored}
                  onChange={() => {}}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mostrar ignorados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Placeholder para quando não há dados */}
      {pairs.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="space-y-4">
              <div className="text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Nenhuma transação encontrada
              </h3>
              <p className="text-gray-600">
                Selecione uma conta bancária e período para ver as transações.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Conciliação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conciliação Bancária</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare transações do OFX com lançamentos do sistema
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Seletor de Período */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Select
                  value={periodo.mes}
                  onValueChange={(mes) => handlePeriodoChange(mes, periodo.ano)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={periodo.ano}
                  onValueChange={(ano) => handlePeriodoChange(periodo.mes, ano)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {gerarListaAnos().map((ano) => (
                      <SelectItem key={ano} value={ano}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Botão para forçar recarregamento */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Forçando recarregamento do período atual:', periodo);
                    // Limpar dados
                    setPairs([]);
                    setSummary(null);
                    // Forçar recarregamento
                    if (selectedBankAccountId) {
                      loadSuggestions();
                    }
                  }}
                  className="px-2"
                  title="Recarregar dados do período atual"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {/* Botão para limpar conflitos */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanConflicts}
                  disabled={loading || !selectedBankAccountId}
                  className="px-3 text-orange-600 border-orange-200 hover:bg-orange-50"
                  title="Limpar conflitos de conciliação (matches órfãos)"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Limpar Conflitos
                </Button>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {dateFilteredPairs.length} de {pairs.length} transações
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  📅 Período: {meses.find(m => m.value === periodo.mes)?.label} {periodo.ano}
                </div>
                {(usarFiltroPeriodo || searchTerm || statusFilter !== 'all') && (
                  <div className="text-xs text-gray-500 mt-1">
                    {usarFiltroPeriodo && '📅 Data'} 
                    {searchTerm && ' 🔍 Busca'} 
                    {statusFilter !== 'all' && ' 🏷️ Status'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando sugestões...</span>
            </div>
          ) : dateFilteredPairs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma transação para conciliar</p>
              <p className="text-sm">Faça upload de um arquivo OFX para começar a conciliação</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dateFilteredPairs.map((pair, index) => (
                <ReconciliationCard 
                  key={index} 
                  pair={pair}
                  onOpenLancamentoModal={handleOpenLancamentoModal}
                  onOpenTransferenciaModal={handleOpenTransferenciaModal}
                  onOpenBuscarLancamentosModal={handleOpenBuscarLancamentosModal}
                  onProcessReconciliationDecision={processReconciliationDecision}
                  isValidTransfer={isValidTransfer}
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
      {selectedBankTransaction && (
        <BuscarLancamentosModalComponent
          isOpen={showBuscarLancamentosModal}
          onClose={handleCloseModals}
          bankTransaction={selectedBankTransaction}
          onCreateSuggestion={(suggestionData: {
            selectedLancamentos: any[];
            primaryLancamento?: any; // ✅ ADICIONAR: lançamento com dados agregados
            primaryLancamentoId?: string | null;
            isValidMatch: boolean;
            totalValue: number;
            hasDiscrepancy: boolean;
            useExistingHandling?: boolean;
            matchType?: 'exact_match' | 'manual' | 'multiple_transactions';
            confidenceLevel?: 'high' | 'medium' | 'low';
            validation?: any;
            summary?: any;
          }) => {
            // ✅ CRITICAL: Capturar bankTransaction ANTES do modal fechar
            const currentBankTransaction = selectedBankTransaction;
            
            console.log('📊 Modal suggestion data received:', {
              suggestionData,
              currentBankTransaction: currentBankTransaction ? {
                id: currentBankTransaction.id,
                amount: currentBankTransaction.amount,
                memo: currentBankTransaction.memo
              } : null
            });
            
            // ✅ CRITICAL: Verificar se temos a transação bancária
            if (!currentBankTransaction) {
              console.error('❌ currentBankTransaction é null no callback do modal!');
              toast({
                title: "Erro",
                description: "Transação bancária não encontrada. Tente novamente.",
                variant: "destructive",
              });
              return;
            }
            
            const formattedSuggestion = {
              selectedLancamentos: suggestionData.selectedLancamentos,
              primaryLancamentoId: suggestionData.primaryLancamentoId || null,
              isValidMatch: suggestionData.isValidMatch,
              totalValue: suggestionData.totalValue,
              hasDiscrepancy: suggestionData.hasDiscrepancy,
              useExistingHandling: suggestionData.useExistingHandling || false,
              matchType: suggestionData.matchType || 'manual' as const,
              confidenceLevel: suggestionData.confidenceLevel || 'medium' as const,
              validation: suggestionData.validation || {},
              summary: suggestionData.summary || { source: 'modal', useExistingHandling: suggestionData.useExistingHandling }
            };

            console.log('📊 Formatted suggestion for handleCreateSuggestion:', {
              bankTransactionId: currentBankTransaction.id,
              bankTransactionValid: !!currentBankTransaction,
              formattedSuggestion
            });
            
            // Criar sugestão e atualizar estado local
            handleCreateSuggestion(currentBankTransaction, formattedSuggestion);
          }}
          empresaId={empresaData?.id}
        />
      )}
        </>
      )}
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
      
      // ✅ CORREÇÃO: Buscar lançamentos DISPONÍVEIS (não conciliados) com valor exato (±0.01)
      const response = await fetch(`/api/lancamentos?empresa_id=${empresaData.id}&status=pago&valor_min=${valorTransacao - 0.01}&valor_max=${valorTransacao + 0.01}&limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Lançamentos DISPONÍVEIS encontrados:', data.length);
        
        // ✅ LOG: Verificar se API já filtrou conciliados
        if (data.length === 0) {
          console.log('⚠️ Nenhum lançamento disponível - possíveis motivos:', {
            'Todos já conciliados': 'Lançamentos podem estar em uso',
            'Valor incompatível': `Buscando valor ${valorTransacao} ±0.01`,
            'Status incorreto': 'Apenas lançamentos com status "pago" são buscados'
          });
        }
        
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
  onProcessReconciliationDecision,
  isValidTransfer
}: { 
  pair: ReconciliationPair;
  onOpenLancamentoModal: (bankTransaction: BankTransaction) => void;
  onOpenTransferenciaModal: (bankTransaction: BankTransaction) => void;
  onOpenBuscarLancamentosModal: (bankTransaction: BankTransaction) => void;
  onProcessReconciliationDecision: (pair: ReconciliationPair, action: string, details?: any) => void;
  isValidTransfer: (bankTransaction: BankTransaction | undefined, systemTransaction: SystemTransaction | undefined) => boolean;
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

  // ✅ FUNÇÃO REVISADA: Verificação baseada EXCLUSIVAMENTE no banco de dados
  const isTransactionReconciled = (pair: ReconciliationPair): boolean => {
    // ✅ ÚNICA FONTE DA VERDADE: Campo status_conciliacao da tabela bank_transactions
    const isReconciled = pair.bankTransaction?.status_conciliacao === 'conciliado';
    
    // Debug para detectar inconsistências
    if (isReconciled && (pair.status === 'suggested' || pair.status === 'sugerido')) {
      console.warn('⚠️ INCONSISTÊNCIA DETECTADA - Transação conciliada no banco mas status incorreto:', {
        bankTransactionId: pair.bankTransaction?.id,
        bankStatus: pair.bankTransaction?.status_conciliacao,
        pairStatus: pair.status,
        shouldBeGreen: true
      });
    }
    
    return isReconciled;
  };

  // ✅ FUNÇÃO CORRIGIDA: Cores baseadas no transation_status do banco
  const getCardBackgroundColor = (status: string, pair: ReconciliationPair) => {
    const bankStatus = pair.bankTransaction?.status_conciliacao;
    const transationStatus = pair.bankTransaction?.transation_status;
    
    console.log('🎨 Determinando cor do card (CORRIGIDO):', {
      pairId: pair.id,
      frontendStatus: status,
      bankStatus,
      transationStatus,
      hasSystemMatch: !!pair.systemTransaction
    });

    // ✅ REGRA 1: IGNORADOS - Prioridade máxima 
    if (bankStatus === 'ignorado') {
      console.log('🎨 Aplicando cor IGNORADO (cinza escuro)');
      return 'bg-gray-200 border-gray-400 shadow-sm opacity-60'; // CINZA ESCURO = IGNORADO
    }
    
    // ✅ REGRA 2: VERDE apenas para conciliados (baseado no banco)
    if (bankStatus === 'conciliado') {
      console.log('🎨 Aplicando cor CONCILIADO (verde)');
      return 'bg-green-100 border-green-400 shadow-lg'; // VERDE = CONCILIADO
    }
    
    // ✅ REGRA 3: Para pendentes, usar transation_status do banco
    if (bankStatus === 'pendente') {
      switch (transationStatus) {
        case 'transferencia':
          console.log('🎨 Aplicando cor TRANSFERÊNCIA (azul) - via transation_status');
          return 'bg-blue-100 border-blue-400 shadow-md'; // AZUL = TRANSFERÊNCIA
          
        case 'sugerido':
          console.log('🎨 Aplicando cor SUGESTÃO (amarelo) - via transation_status');
          return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'; // AMARELO = SUGESTÃO
          
        case 'sem_match':
        default:
          console.log('🎨 Aplicando cor SEM MATCH (branco) - via transation_status');
          return 'bg-white border-gray-200 hover:bg-gray-50'; // BRANCO = SEM MATCH
      }
    }
    
    // ✅ REGRA 4: Fallback para status do pair (frontend) se não há status do banco
    console.log('🎨 Usando fallback para status do pair:', status);
    switch (status) {
      case 'conciliado':
      case 'matched':
        console.log('🎨 Aplicando cor CONCILIADO (verde) - fallback');
        return 'bg-green-100 border-green-400 shadow-lg';
      case 'transferencia':
      case 'transfer':
        console.log('🎨 Aplicando cor TRANSFERÊNCIA (azul) - fallback');
        return 'bg-blue-100 border-blue-400 shadow-md';
      case 'sugerido':
      case 'suggested':
        console.log('🎨 Aplicando cor SUGESTÃO (amarelo) - fallback');
        return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100';
      case 'sem_match':
      case 'no_match':
        console.log('🎨 Aplicando cor SEM MATCH (branco) - fallback');
        return 'bg-white border-gray-200 hover:bg-gray-50';
      default:
        console.log('🎨 Aplicando cor PADRÃO (branco)');
        return 'bg-white border-gray-300 hover:bg-gray-50';
    }
  };

  return (
    <div className="flex gap-3 items-center min-h-[100px] mb-4">
      {/* Card Esquerdo - Transação OFX */}
      <div className={`flex-1 p-4 rounded-lg border-2 relative min-h-[200px] flex flex-col ${getCardBackgroundColor(pair.status, pair)}`}>
        {/* Ícone de check para cards conciliados */}
        {isTransactionReconciled(pair) && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center justify-center w-6 h-6 bg-green-600 rounded-full">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
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
        {/* Debug: Log do status para identificar cards sem botões */}
        {(() => {
          console.log('🔍 DEBUG Card Status:', {
            pairId: pair.id,
            status: pair.status,
            status_conciliacao: pair.bankTransaction?.status_conciliacao,
            hasSystemTransaction: !!pair.systemTransaction,
            memo: pair.bankTransaction?.memo,
            isTransferOFX: pair.bankTransaction?.memo?.toUpperCase().includes('TRANSFER'),
            isTransferSystem: pair.systemTransaction?.tipo === 'transferencia' || pair.systemTransaction?.descricao?.toUpperCase().includes('TRANSFER'),
            systemTransactionType: pair.systemTransaction?.tipo,
            systemTransactionDesc: pair.systemTransaction?.descricao
          });
          return null;
        })()}
        
        {/* ✅ CORREÇÃO: Verificar se já foi conciliado usando ÚNICA fonte da verdade */}
        {isTransactionReconciled(pair) && (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                CONCILIADO
              </span>
            </div>
            <Button 
              size="sm" 
              className="bg-gray-900 text-white hover:bg-black w-36 mt-2"
              onClick={() => onProcessReconciliationDecision(pair, 'unlink')}
            >
              desconciliar
            </Button>
          </>
        )}
        
        {!isTransactionReconciled(pair) && (pair.status === 'suggested' || pair.status === 'sugerido') && (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                SUGERIDO
              </span>
            </div>
            <Button 
              size="sm" 
              className="bg-gray-800 text-white hover:bg-gray-900 w-36"
              onClick={() => onProcessReconciliationDecision(pair, 'auto_conciliate')}
            >
              Conciliar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="w-36 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => onProcessReconciliationDecision(pair, 'reject')}
            >
              <X className="w-4 h-4 mr-2" />
              Desvincular
            </Button>
          </>
        )}
        
        {!isTransactionReconciled(pair) && 
         (pair.status === 'transferencia' || 
          (pair.status === 'sugerido' && isValidTransfer(pair.bankTransaction, pair.systemTransaction))) && (
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

        {/* ✅ Transferências identificadas mas com status 'sugerido' */}
        {!isTransactionReconciled(pair) && 
         pair.status === 'sugerido' &&
         isValidTransfer(pair.bankTransaction, pair.systemTransaction) && (
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
        
        {!isTransactionReconciled(pair) && (pair.status === 'no_match' || pair.status === 'sem_match') && (
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

        {/* Case default para status não previstos - CORREÇÃO para cards sem botões */}
        {!isTransactionReconciled(pair) && 
         pair.status !== 'suggested' && pair.status !== 'sugerido' &&
         pair.status !== 'transfer' && pair.status !== 'transferencia' &&
         pair.status !== 'no_match' && pair.status !== 'sem_match' &&
         /* Excluir transferências que já têm botões na condição anterior */
         !(((pair.status === 'matched' || pair.status === 'conciliado') &&
           (pair.bankTransaction?.memo?.toUpperCase().includes('TRANSFER') || 
            pair.systemTransaction?.tipo === 'transferencia' ||
            pair.systemTransaction?.descricao?.toUpperCase().includes('TRANSFER')))) && (
          <div className="space-y-2">
            <div className="text-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <span className="text-xs text-yellow-600 font-medium">{pair.status || 'indefinido'}</span>
            </div>
            {/* Se tem systemTransaction, mostrar como sugerido */}
            {pair.systemTransaction ? (
              <>
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
                  className="w-36 border-yellow-300 text-gray-800 bg-white"
                  onClick={() => onProcessReconciliationDecision(pair, 'reject')}
                >
                  <X className="w-4 h-4 mr-2 text-yellow-500" />
                  desvincular
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                className="bg-gray-500 text-white hover:bg-gray-600 w-36"
                onClick={() => onProcessReconciliationDecision(pair, 'ignore_transaction')}
              >
                Ignorar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Card Direito - Sistema ERP */}
      <div className={`flex-1 p-4 rounded-lg border-2 relative min-h-[200px] flex flex-col ${getCardBackgroundColor(pair.status, pair)}`}>
        {/* Ícone de check para cards conciliados */}
        {isTransactionReconciled(pair) && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center justify-center w-6 h-6 bg-green-600 rounded-full">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        {/* ✅ CORREÇÃO: Se há correspondência, mostrar dados do lançamento */}
        {((pair.status === 'matched' || pair.status === 'conciliado' || 
          pair.status === 'suggested' || pair.status === 'sugerido' ||
          pair.status === 'transfer' || pair.status === 'transferencia') && 
          (pair.systemTransaction || (pair.systemTransactions && pair.systemTransactions.length > 0))) ? (
          <div className="relative flex items-start gap-3">
            {/* ✅ TAG LANÇAMENTOS NO CANTO SUPERIOR DIREITO - SEMPRE VISÍVEL */}
            <div className="absolute -top-2 -right-2 z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white shadow-sm">
                LANÇAMENTOS
              </span>
            </div>
            
            <input type="checkbox" className="mt-1" />
            <div className="flex-1">
              {/* ✅ CORREÇÃO: Usar dados de systemTransaction ou systemTransactions */}
              {(() => {
                // Verificar se temos dados disponíveis
                const hasMultipleTransactions = pair.systemTransactions && pair.systemTransactions.length > 1;
                const hasSingleTransaction = pair.systemTransactions && pair.systemTransactions.length === 1;
                const primaryTransaction = pair.systemTransaction || (pair.systemTransactions && pair.systemTransactions[0]);
                
                if (!primaryTransaction) {
                  return <div className="text-sm text-gray-500">Dados não disponíveis</div>;
                }
                
                // Calcular valor total
                let displayValue;
                let totalCount = 1;
                
                if (hasMultipleTransactions) {
                  const totalValue = pair.systemTransactions!.reduce((total, tx) => total + Math.abs(tx.valor), 0);
                  totalCount = pair.systemTransactions!.length;
                  console.log(`💰 MÚLTIPLOS LANÇAMENTOS EXIBINDO:`, {
                    pairId: pair.bankTransaction?.id,
                    calculatedTotal: totalValue,
                    individualValues: pair.systemTransactions!.map(tx => Math.abs(tx.valor)),
                    count: totalCount
                  });
                  displayValue = formatCurrency(totalValue);
                } else if (hasSingleTransaction) {
                  displayValue = formatCurrency(Math.abs(pair.systemTransactions![0].valor));
                } else {
                  displayValue = formatCurrency(Math.abs(primaryTransaction.valor));
                }
                
                // Determinar a descrição a ser exibida
                let displayDescription = primaryTransaction.descricao || 'Sem descrição';
                let shouldShowTooltip = true; // ✅ SEMPRE mostrar ícone do olho para visualizar detalhes
                
                // ✅ CORREÇÃO: Ajustar totalCount para lançamentos reconstituídos
                if (!hasMultipleTransactions && primaryTransaction.descricao && primaryTransaction.descricao.includes('lançamentos selecionados')) {
                  // Extrair número de lançamentos da descrição reconstituída
                  const match = primaryTransaction.descricao.match(/(\d+)\s+lançamentos/);
                  if (match) {
                    totalCount = parseInt(match[1]);
                  }
                }
                
                // Se há múltiplos lançamentos, mostrar descrição especial
                if (hasMultipleTransactions) {
                  displayDescription = `${totalCount} lançamentos selecionados`;
                } else if (primaryTransaction.descricao && primaryTransaction.descricao.includes('lançamentos selecionados')) {
                  // Manter descrição existente se já indica múltiplos
                  displayDescription = primaryTransaction.descricao;
                }
                
                return (
                  <>
                    <div className="text-sm text-gray-700 mb-1">
                      {formatDate(primaryTransaction.data_lancamento)}
                    </div>
                    <div className={`font-bold text-lg mb-2 ${
                      primaryTransaction.tipo === 'receita' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {displayValue}
                    </div>
                    <div className="space-y-1">
                      {/* Descrição com tooltip para múltiplos lançamentos */}
                      {shouldShowTooltip ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm text-gray-700 cursor-help hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                {displayDescription}
                                <Eye className="h-3 w-3 text-blue-500" />
                              </p>
                            </TooltipTrigger>
                            {/* ✅ CORREÇÃO: Mostrar detalhes tanto para múltiplos quanto para único lançamento */}
                            {(pair.systemTransactions && pair.systemTransactions.length > 0) || pair.systemTransaction ? (
                              <TooltipContent side="bottom" className="p-0 max-w-md">
                                <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                                  <div className="bg-gray-50 px-3 py-2 border-b rounded-t-lg">
                                    <h4 className="font-medium text-sm text-gray-700">
                                      {pair.systemTransactions && pair.systemTransactions.length > 1 
                                        ? `Lançamentos Selecionados (${pair.systemTransactions.length})`
                                        : 'Detalhes do Lançamento'
                                      }
                                    </h4>
                                  </div>
                                  <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                                    {/* Mostrar lançamentos dos systemTransactions ou fallback para primaryTransaction */}
                                    {(pair.systemTransactions && pair.systemTransactions.length > 0 
                                      ? pair.systemTransactions 
                                      : [primaryTransaction]
                                    ).map((lancamento, index) => (
                                      <div 
                                        key={lancamento.id} 
                                        className="flex items-center justify-between p-2 rounded border-l-4 border-l-gray-300 bg-gray-50"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-gray-600">
                                              {formatDate(lancamento.data_lancamento)}
                                            </span>
                                            {lancamento.numero_documento && (
                                              <span className="text-xs text-gray-500 truncate max-w-20" title={lancamento.numero_documento}>
                                                #{lancamento.numero_documento}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-700 truncate" title={lancamento.descricao}>
                                            {lancamento.descricao || 'Sem descrição'}
                                          </p>
                                          {lancamento.plano_conta && (
                                            <p className="text-xs text-gray-500 truncate" title={lancamento.plano_conta}>
                                              {lancamento.plano_conta}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex-shrink-0 text-right ml-3">
                                          <span className={`font-medium text-sm ${
                                            lancamento.tipo === 'receita' ? 'text-green-700' : 'text-red-700'
                                          }`}>
                                            {formatCurrency(Math.abs(lancamento.valor))}
                                          </span>
                                          <div className="text-xs text-gray-500">
                                            {lancamento.tipo === 'receita' ? 'Receita' : 
                                             lancamento.tipo === 'despesa' ? 'Despesa' : 
                                             'Outro'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Linha de total */}
                                    {pair.systemTransactions && pair.systemTransactions.length > 1 && (
                                      <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between items-center font-medium">
                                          <span className="text-sm text-gray-700">Total:</span>
                                          <span className="text-sm text-green-600">
                                            {formatCurrency(pair.systemTransactions.reduce((total, tx) => total + Math.abs(tx.valor), 0))}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            ) : null}
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <p className="text-sm text-gray-700">
                          {displayDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">Origem: sistema</p>
                        
                        {/* ✅ Badge de status para transações conciliadas */}
                        {pair.status === 'conciliado' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            CONCILIADO
                          </span>
                        )}
                        
                        {/* Badge de status para sugestões */}
                        {(pair.status === 'suggested' || pair.status === 'sugerido') && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            SUGERIDO
                          </span>
                        )}
                        
                        {/* Badge de transferência para Sistema */}
                        {isTransferSystem(primaryTransaction) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            TRANSFERÊNCIA
                          </span>
                        )}
                        
                        {/* ✅ Badge para múltiplos lançamentos - SEMPRE MOSTRA QUANDO APLICÁVEL */}
                        {(hasMultipleTransactions || (primaryTransaction.descricao && primaryTransaction.descricao.includes('lançamentos selecionados'))) && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            MÚLTIPLOS ({totalCount})
                          </span>
                        )}
                      </div>
                      
                      {/* ✅ MOSTRAR RESUMO DE MÚLTIPLOS LANÇAMENTOS SE HOUVER */}
                      {hasMultipleTransactions && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-blue-700 font-medium">
                            {totalCount} lançamentos selecionados
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Valor total: {formatCurrency(pair.systemTransactions!.reduce((total, tx) => total + Math.abs(tx.valor), 0))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
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


