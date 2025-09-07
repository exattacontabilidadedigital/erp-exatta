import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Filter, X, CheckCircle, AlertCircle, RefreshCw, AlertTriangle, Edit, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Star } from 'lucide-react';
import EditLancamentoModal from './edit-lancamento-modal';
import { ContaBancariaSelect } from '@/components/ui/conta-bancaria-select';

interface Lancamento {
  id: string;
  data_lancamento: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: string;
  numero_documento?: string;
  conta_bancaria_id?: string;
  plano_contas?: {
    nome: string;
  };
  centro_custos?: {
    nome: string;
  };
  contas_bancarias?: {
    id: string;
    agencia: string;
    conta: string;
    digito: string;
    bancos?: {
      nome: string;
    };
  };
}

interface BuscarLancamentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuggestion?: (suggestionData: {
    selectedLancamentos: Lancamento[];
    primaryLancamentoId?: string | null; // 🎯 Novo campo para lançamento primário
    isValidMatch: boolean;
    totalValue: number;
    hasDiscrepancy: boolean;
    closeModal?: boolean;
    autoMatch?: boolean;
    useExistingHandling?: boolean;
    matchType?: 'exact_match' | 'manual' | 'multiple_transactions';
    confidenceLevel?: 'high' | 'medium' | 'low';
    validation?: any;
    summary?: any;
  }) => void;
  bankTransaction?: any; // Transação bancária para comparação
  transacaoSelecionada?: any; // Manter compatibilidade
  empresaId?: string; // ID da empresa para buscar contas bancárias
  filtrosIniciais?: {
    dataInicio?: string;
    dataFim?: string;
    valor?: number;
    toleranciaValor?: number;
  };
}

export default function BuscarLancamentosModal({
  isOpen,
  onClose,
  onCreateSuggestion,
  bankTransaction,
  transacaoSelecionada,
  empresaId,
  filtrosIniciais
}: BuscarLancamentosModalProps) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStatus, setUsageStatus] = useState<{[key: string]: {inUse: boolean, status?: string, color?: string, starColor?: string}}>({});
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);
  
  // Novos estados para o sistema de sugestões
  const [selectedLancamentos, setSelectedLancamentos] = useState<Lancamento[]>([]);
  const [primaryLancamentoId, setPrimaryLancamentoId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);

  // Usar bankTransaction ou transacaoSelecionada para compatibilidade
  const transactionData = bankTransaction || transacaoSelecionada;

  // Função para buscar contas bancárias
  const buscarContasBancarias = useCallback(async () => {
    try {
      // ✅ CORREÇÃO: Incluir empresa_id obrigatório na chamada da API
      if (!empresaId) {
        console.warn('⚠️ empresaId não fornecido - não é possível buscar contas bancárias');
        return;
      }

      const response = await fetch(`/api/contas-bancarias?empresa_id=${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        setContasBancarias(data || []); // Corrigir: API retorna array direto, não { contas: [] }
        console.log('✅ Contas bancárias carregadas:', data?.length || 0);
      } else {
        console.error('❌ Erro na API de contas bancárias:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar contas bancárias:', error);
    }
  }, [empresaId]);

  // Função para obter nome da conta bancária
  const getNomeContaBancaria = (lancamento: Lancamento) => {
    // Priorizar dados do JOIN da API
    if (lancamento.contas_bancarias) {
      const conta = lancamento.contas_bancarias;
      const bancoNome = conta.bancos?.nome || 'Banco não identificado';
      return `${bancoNome} - Ag: ${conta.agencia} | Cc: ${conta.conta}${conta.digito ? `-${conta.digito}` : ''}`;
    }
    
    // Fallback para busca local nas contas carregadas
    if (lancamento.conta_bancaria_id) {
      const conta = contasBancarias.find(c => c.id === lancamento.conta_bancaria_id);
      if (conta) {
        return `${conta.banco_nome} - Ag: ${conta.agencia} | Cc: ${conta.conta}${conta.digito ? `-${conta.digito}` : ''}`;
      }
    }
    
    return '-';
  };

  // Estados dos filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    dataInicio: filtrosIniciais?.dataInicio || '',
    dataFim: filtrosIniciais?.dataFim || '',
    contaBancariaId: [] as string[],
    planoContaId: '',
    centroCustoId: ''
  });

  // Estado para debug
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Limpar seleções sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal aberto - limpando seleções anteriores...');
      setSelectedLancamentos([]);
      setPrimaryLancamentoId(null);
      setDebugInfo(null);
    }
  }, [isOpen]);

  // ✅ NOVAS FUNÇÕES DE VALIDAÇÃO E COMPARAÇÃO
  
  // Função para formatar data para comparação
  const formatDateForComparison = (date: string | Date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };
  
  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Função para formatar data para exibição
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };
  
  // Função para validar match entre transação bancária e lançamento
  const validateMatch = (lancamento: Lancamento) => {
    if (!transactionData) return { isValid: false, dateMatch: false, valueMatch: false, valueDifference: 0 };
    
    const bankDate = formatDateForComparison(transactionData.posted_at || transactionData.data);
    const systemDate = formatDateForComparison(lancamento.data_lancamento);
    const dateMatch = bankDate === systemDate;
    
    const bankValue = Math.abs(parseFloat(transactionData.amount || transactionData.valor));
    const systemValue = Math.abs(parseFloat(lancamento.valor.toString()));
    const valueMatch = Math.abs(bankValue - systemValue) < 0.01; // Tolerância de 1 centavo
    const valueDifference = bankValue - systemValue;
    
    return {
      isValid: dateMatch && valueMatch,
      dateMatch,
      valueMatch,
      valueDifference
    };
  };
  
  // Função para calcular total dos lançamentos selecionados
  const calculateSelectedTotal = () => {
    return selectedLancamentos.reduce((total, lanc) => total + Math.abs(parseFloat(lanc.valor.toString())), 0);
  };
  
  // Função para verificar se total selecionado é compatível (tolerância pequena)
  const isSelectedTotalCompatible = () => {
    if (!transactionData) return false;
    const bankValue = Math.abs(parseFloat(transactionData.amount || transactionData.valor));
    const selectedTotal = calculateSelectedTotal();
    return Math.abs(bankValue - selectedTotal) < 0.01;
  };

  // ✅ NOVA FUNÇÃO: Verificar se diferença é EXATAMENTE zero (para conciliação automática)
  const isExactMatch = () => {
    if (!transactionData) return false;
    const bankValue = Math.abs(parseFloat(transactionData.amount || transactionData.valor));
    const selectedTotal = calculateSelectedTotal();
    const difference = Math.abs(bankValue - selectedTotal);
    
    console.log('🔍 Verificação de match exato:', {
      bankValue,
      selectedTotal,
      difference,
      isExactMatch: difference === 0
    });
    
    return difference === 0; // Exige diferença EXATAMENTE zero
  };
  
  // Função para lidar com seleção de lançamento
  const handleSelectLancamento = (lancamento: Lancamento) => {
    // Verificar se o lançamento já está em uso
    const usage = usageStatus[lancamento.id];
    if (usage?.inUse) {
      console.warn('⚠️ Lançamento já está em uso, não pode ser selecionado:', {
        lancamentoId: lancamento.id,
        status: usage.status,
        color: usage.color
      });
      return;
    }

    setSelectedLancamentos(prev => {
      const exists = prev.find(l => l.id === lancamento.id);
      if (exists) {
        // Remover se já está selecionado
        const newSelection = prev.filter(l => l.id !== lancamento.id);
        // Se estava como primário e foi removido, limpar primário ou escolher outro
        if (primaryLancamentoId === lancamento.id) {
          setPrimaryLancamentoId(newSelection.length > 0 ? newSelection[0].id : null);
        }
        return newSelection;
      } else {
        // Adicionar à seleção
        const newSelection = [...prev, lancamento];
        // Se é o primeiro selecionado, torná-lo primário automaticamente
        if (newSelection.length === 1) {
          setPrimaryLancamentoId(lancamento.id);
        }
        return newSelection;
      }
    });
  };

  // Função para definir lançamento como primário
  const handleSetPrimary = (lancamentoId: string) => {
    setPrimaryLancamentoId(lancamentoId);
  };
  
  // ✅ FUNÇÃO REVISADA: Criar sugestão com validações e feedback melhorados
  const handleCreateSuggestion = async () => {
    // Validação inicial
    if (selectedLancamentos.length === 0) {
      console.warn('⚠️ Nenhum lançamento selecionado');
      return;
    }

    // Verificar se algum lançamento selecionado está em uso
    const lancamentosEmUso = selectedLancamentos.filter(l => usageStatus[l.id]?.inUse);
    if (lancamentosEmUso.length > 0) {
      console.error('❌ Alguns lançamentos selecionados já estão em uso:', lancamentosEmUso.map(l => l.id));
      alert('Erro: Alguns lançamentos selecionados já estão em uso. Por favor, remova-os da seleção.');
      return;
    }

    console.log('🎯 Iniciando criação de sugestão:', {
      totalSelecionados: selectedLancamentos.length,
      lancamentosIds: selectedLancamentos.map(l => l.id),
      transactionData: transactionData ? {
        id: transactionData.id,
        amount: transactionData.amount,
        posted_at: transactionData.posted_at
      } : null
    });

    try {
      // Calcular valores e validações
      const totalValue = calculateSelectedTotal();
      const primaryLancamento = selectedLancamentos[0];
      const validation = validateMatch(primaryLancamento);
      
      // Verificar compatibilidade de valores
      const isValueCompatible = isSelectedTotalCompatible();
      const isExactMatchValue = isExactMatch(); // ✅ NOVA VERIFICAÇÃO: Match exato
      const hasDiscrepancy = selectedLancamentos.length > 1 || !validation.isValid || !isExactMatchValue;
      
      // Determinar tipo de match
      let matchType: 'exact_match' | 'manual' | 'multiple_transactions' = 'manual';
      let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
      
      // ✅ NOVA LÓGICA: Só considera exact_match se tiver diferença ZERO
      if (selectedLancamentos.length === 1 && validation.isValid && isExactMatchValue) {
        matchType = 'exact_match';
        confidenceLevel = 'high';
      } else if (selectedLancamentos.length === 1 && validation.isValid && isValueCompatible) {
        // Match com pequena divergência - ainda manual mas com confiança média
        matchType = 'manual';
        confidenceLevel = 'medium';
      } else if (selectedLancamentos.length > 1) {
        matchType = 'multiple_transactions';
        confidenceLevel = isValueCompatible ? 'medium' : 'low';
      }

      console.log('📊 Análise da seleção:', {
        totalValue,
        validation: {
          isValid: validation.isValid,
          dateMatch: validation.dateMatch,
          valueMatch: validation.valueMatch,
          valueDifference: validation.valueDifference
        },
        isValueCompatible,
        isExactMatchValue, // ✅ NOVO LOG: Match exato
        hasDiscrepancy,
        matchType,
        confidenceLevel,
        canAutoReconcile: selectedLancamentos.length === 1 && validation.isValid && isExactMatchValue // ✅ NOVO: Flag para conciliação automática
      });

      // Dados para enviar à API via função existente do componente pai
      const suggestionData = {
        selectedLancamentos,
        primaryLancamentoId, // 🎯 Incluir ID do lançamento primário
        isValidMatch: validation.isValid && selectedLancamentos.length === 1 && isExactMatchValue, // ✅ MUDANÇA: Só é válido com diferença zero
        totalValue,
        hasDiscrepancy,
        matchType,
        confidenceLevel,
        closeModal: true,
        autoMatch: selectedLancamentos.length === 1 && validation.isValid && isExactMatchValue, // ✅ NOVA FLAG: Auto match só com diferença zero
        // Dados adicionais para melhor controle
        validation: {
          dateMatch: validation.dateMatch,
          valueMatch: validation.valueMatch,
          valueDifference: validation.valueDifference,
          isExactMatch: isExactMatchValue // ✅ NOVO: Flag de match exato
        },
        summary: {
          selectedCount: selectedLancamentos.length,
          bankAmount: transactionData ? Math.abs(parseFloat(transactionData.amount || transactionData.valor || '0')) : 0,
          systemAmount: totalValue,
          difference: transactionData ? Math.abs(totalValue - Math.abs(parseFloat(transactionData.amount || transactionData.valor || '0'))) : 0
        },
        // Flag para indicar que deve usar a funcionalidade existente
        useExistingHandling: true
      };

      console.log('📤 Enviando dados para o componente pai:', suggestionData);

      // Chamar callback do componente pai
      if (onCreateSuggestion) {
        onCreateSuggestion(suggestionData);
      } else {
        console.error('❌ Callback onCreateSuggestion não está definido');
        return;
      }
      
      // Fechar modal automaticamente
      console.log('✅ Fechando modal automaticamente');
      onClose();

    } catch (error) {
      console.error('❌ Erro ao processar seleção:', error);
      // Não fechar o modal em caso de erro para permitir ao usuário tentar novamente
    }
  };
  
  // Função para editar lançamento
  const handleEditLancamento = (lancamento: Lancamento) => {
    setEditingLancamento(lancamento);
    setShowEditModal(true);
  };

  // Função principal de busca
  const buscarLancamentos = useCallback(async (page = 1, limparLista = false) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 BUSCAR LANÇAMENTOS - Iniciando busca...');
      console.log('📊 Parâmetros:', { page, filtros, transactionData });

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());

      // Aplicar filtros apenas se preenchidos
      if (filtros.busca.trim()) {
        params.append('busca', filtros.busca.trim());
      }
      
      if (filtros.dataInicio) {
        params.append('dataInicio', filtros.dataInicio);
      }
      
      if (filtros.dataFim) {
        params.append('dataFim', filtros.dataFim);
      }
      
      if (filtros.contaBancariaId && filtros.contaBancariaId.length > 0) {
        // Para múltiplas contas, enviar como array
        filtros.contaBancariaId.forEach(contaId => {
          params.append('contaBancariaId[]', contaId);
        });
      }

      // 🎯 FILTRO INTELIGENTE ou BUSCA GERAL
      // Se há dados da transação E não há filtros manuais aplicados = Filtro Inteligente
      // Caso contrário = Busca geral (todos os lançamentos)
      const temFiltrosManuais = filtros.busca || filtros.dataInicio || filtros.dataFim || (filtros.contaBancariaId && filtros.contaBancariaId.length > 0);
      const deveAplicarFiltroInteligente = transactionData && !temFiltrosManuais && page === 1;
      
      // 🔍 DEBUG DETALHADO: Por que o filtro inteligente não está sendo aplicado?
      console.log('🔍 DEBUG: Verificando condições do filtro inteligente:', {
        transactionData: !!transactionData,
        transactionDataComplete: transactionData,
        transactionAmount: transactionData?.amount || transactionData?.valor,
        transactionDate: transactionData?.posted_at || transactionData?.data,
        filtrosBusca: filtros.busca,
        filtrosDataInicio: filtros.dataInicio,
        filtrosDataFim: filtros.dataFim,
        filtrosContaBancaria: filtros.contaBancariaId?.length || 0,
        temFiltrosManuais,
        page,
        deveAplicarFiltroInteligente,
        condicoes: {
          temTransactionData: !!transactionData,
          naoTemFiltrosManuais: !temFiltrosManuais,
          ehPrimeiraPagina: page === 1,
          todas: transactionData && !temFiltrosManuais && page === 1
        }
      });
      
      if (deveAplicarFiltroInteligente) {
        console.log('🎯 Aplicando filtro inteligente baseado na transação');
        
        // 🏦 INCLUIR TODAS AS CONTAS BANCÁRIAS COMO PADRÃO no filtro inteligente
        if (contasBancarias && contasBancarias.length > 0) {
          console.log('🏦 Aplicando filtro para TODAS as contas bancárias disponíveis');
          contasBancarias.forEach(conta => {
            params.append('contaBancariaId[]', conta.id);
          });
          console.log(`🏦 Total de contas incluídas: ${contasBancarias.length}`);
        } else {
          console.log('⚠️ Nenhuma conta bancária disponível - buscando em todas as contas');
          // Não aplicar filtro de conta - permitir busca em todas
        }
        
        // Filtro de valor EXATO da transação OFX (sem tolerância)
        const valorTransacao = Math.abs(parseFloat(transactionData.amount || transactionData.valor));
        
        // Usar valor exato (sem tolerância)
        params.append('valorMin', valorTransacao.toFixed(2));
        params.append('valorMax', valorTransacao.toFixed(2));
        params.append('buscarValorAbsoluto', 'true');
        
        // ✅ REMOVIDO: Não filtrar por status - buscar em todos os lançamentos
        // params.append('status', 'pendente');
        
        // Filtro de data com tolerância de ±3 dias
        if (transactionData.posted_at || transactionData.data) {
          const dataTransacao = new Date(transactionData.posted_at || transactionData.data);
          const dataInicio = new Date(dataTransacao);
          const dataFim = new Date(dataTransacao);
          
          // Tolerância de ±3 dias da transação
          const toleranciaDias = 3;
          dataInicio.setDate(dataTransacao.getDate() - toleranciaDias);
          dataFim.setDate(dataTransacao.getDate() + toleranciaDias);
          
          params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
          params.append('dataFim', dataFim.toISOString().split('T')[0]);
          
          console.log('📅 Filtro de data aplicado:', {
            dataTransacao: dataTransacao.toISOString().split('T')[0],
            dataInicio: dataInicio.toISOString().split('T')[0],
            dataFim: dataFim.toISOString().split('T')[0],
            toleranciaDias: `±${toleranciaDias} dias`
          });
        }
        
        console.log('💡 Filtro inteligente com valor exato:', {
          valorTransacao,
          valorExato: valorTransacao.toFixed(2),
          toleranciaValor: '0% (valor exato)',
          toleranciaDias: '±3 dias',
          contasBancarias: contasBancarias.length > 0 ? `${contasBancarias.length} contas incluídas` : 'todas as contas',
          buscarValorAbsoluto: true,
          statusPendente: true,
          observacao: 'Filtro com valor exato do OFX + intervalo de ±3 dias + todas as contas bancárias'
        });
      } else {
        console.log('❌ FILTRO INTELIGENTE NÃO APLICADO - Usando busca geral:', {
          motivo: !transactionData ? 'Sem dados da transação' : 
                  temFiltrosManuais ? 'Filtros manuais aplicados' : 
                  page !== 1 ? 'Não é a primeira página' : 'Motivo desconhecido',
          filtrosManuaisDetalhes: {
            busca: !!filtros.busca,
            dataInicio: !!filtros.dataInicio,
            dataFim: !!filtros.dataFim,
            contaBancaria: filtros.contaBancariaId?.length > 0
          }
        });
        console.log('📋 Busca geral (sem filtro inteligente) - todos os lançamentos disponíveis');
        // Para busca geral, não aplicar status padrão - deixar que o usuário escolha
      }

      const url = `/api/conciliacao/buscar-existentes?${params.toString()}`;
      console.log('🌐 URL da requisição:', url);
      console.log('📋 Parâmetros enviados:', Object.fromEntries(params.entries()));

      const response = await fetch(url);
      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Dados recebidos da API /api/conciliacao/buscar-existentes:', {
        endpoint: '/api/conciliacao/buscar-existentes',
        tabelaOrigem: 'lancamentos',
        lancamentos: data.lancamentos?.length || 0,
        total: data.total,
        page: data.page,
        hasMore: data.hasMore,
        estrutura: data.lancamentos?.[0] ? Object.keys(data.lancamentos[0]) : 'array vazio',
        primeiroLancamento: data.lancamentos?.[0] ? {
          id: data.lancamentos[0].id,
          data_lancamento: data.lancamentos[0].data_lancamento,
          descricao: data.lancamentos[0].descricao,
          valor: data.lancamentos[0].valor,
          tipo: data.lancamentos[0].tipo,
          status: data.lancamentos[0].status,
          conta_bancaria_id: data.lancamentos[0].conta_bancaria_id
        } : null
      });

      // Fallback: Se filtro inteligente não trouxe resultados, buscar no intervalo de data da transação
      let novosLancamentos = data.lancamentos || [];
      let totalFinal = data.total || 0;
      let hasMoreFinal = data.hasMore || false;
      let usouFallback = false;

      if (transactionData && params.get('buscarValorAbsoluto') === 'true' && novosLancamentos.length === 0 && page === 1) {
        console.log('🔄 FALLBACK 1: Filtro exato não encontrou resultados, aplicando tolerância de ±5%...');
        
        // Nova busca com pequena tolerância de valor (5%) para capturar pequenas diferenças
        const fallbackParams = new URLSearchParams();
        fallbackParams.append('page', '1');
        fallbackParams.append('limit', '20');
        fallbackParams.append('status', 'pendente');
        
        // 🏦 INCLUIR TODAS AS CONTAS BANCÁRIAS no fallback também
        if (contasBancarias && contasBancarias.length > 0) {
          contasBancarias.forEach(conta => {
            fallbackParams.append('contaBancariaId[]', conta.id);
          });
          console.log(`🏦 Fallback 1 - Incluindo ${contasBancarias.length} contas bancárias`);
        }
        
        // Filtro de valor com tolerância mínima de 5%
        const valorTransacao = Math.abs(parseFloat(transactionData.amount || transactionData.valor));
        const toleranciaValorFallback1 = 0.05; // 5% no primeiro fallback
        
        const valorMinFallback1 = valorTransacao * (1 - toleranciaValorFallback1);
        const valorMaxFallback1 = valorTransacao * (1 + toleranciaValorFallback1);
        
        fallbackParams.append('valorMin', valorMinFallback1.toFixed(2));
        fallbackParams.append('valorMax', valorMaxFallback1.toFixed(2));
        fallbackParams.append('buscarValorAbsoluto', 'true');
        
        // Manter filtro de data com ±3 dias
        if (transactionData.posted_at || transactionData.data) {
          const dataTransacao = new Date(transactionData.posted_at || transactionData.data);
          const dataInicio = new Date(dataTransacao);
          const dataFim = new Date(dataTransacao);
          
          const toleranciaDias = 3;
          dataInicio.setDate(dataTransacao.getDate() - toleranciaDias);
          dataFim.setDate(dataTransacao.getDate() + toleranciaDias);
          
          fallbackParams.append('dataInicio', dataInicio.toISOString().split('T')[0]);
          fallbackParams.append('dataFim', dataFim.toISOString().split('T')[0]);
          
          console.log('📅 Fallback 1 - Tolerância mínima:', {
            valorTransacao,
            valorMin: valorMinFallback1.toFixed(2),
            valorMax: valorMaxFallback1.toFixed(2),
            toleranciaValor: `±${(toleranciaValorFallback1 * 100)}%`,
            toleranciaDias: `±${toleranciaDias} dias`,
            dataInicio: dataInicio.toISOString().split('T')[0],
            dataFim: dataFim.toISOString().split('T')[0]
          });
        }
        
        const fallbackUrl = `/api/conciliacao/buscar-existentes?${fallbackParams.toString()}`;
        console.log('🌐 URL do fallback 1 (±5% valor):', fallbackUrl);
        
        const fallbackResponse = await fetch(fallbackUrl);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          novosLancamentos = fallbackData.lancamentos || [];
          totalFinal = fallbackData.total || 0;
          hasMoreFinal = fallbackData.hasMore || false;
          usouFallback = true;
          
          console.log('✅ Fallback 1 aplicado (±5% valor):', {
            lancamentos: novosLancamentos.length,
            total: totalFinal,
            toleranciaValor: '5%',
            toleranciaDias: '3 dias'
          });
          
          // 🔄 FALLBACK 2: Se ainda não encontrou, aumentar tolerância para ±10%
          if (novosLancamentos.length === 0) {
            console.log('🔄 FALLBACK 2: Ainda sem resultados, aplicando tolerância de ±10%...');
            
            const fallback2Params = new URLSearchParams();
            fallback2Params.append('page', '1');
            fallback2Params.append('limit', '20');
            fallback2Params.append('status', 'pendente');
            
            // 🏦 INCLUIR TODAS AS CONTAS BANCÁRIAS no fallback 2 também
            if (contasBancarias && contasBancarias.length > 0) {
              contasBancarias.forEach(conta => {
                fallback2Params.append('contaBancariaId[]', conta.id);
              });
              console.log(`🏦 Fallback 2 - Incluindo ${contasBancarias.length} contas bancárias`);
            }
            
            // Tolerância de 10% para valor
            const toleranciaValorFallback2 = 0.10; // 10%
            const valorMinFallback2 = valorTransacao * (1 - toleranciaValorFallback2);
            const valorMaxFallback2 = valorTransacao * (1 + toleranciaValorFallback2);
            
            fallback2Params.append('valorMin', valorMinFallback2.toFixed(2));
            fallback2Params.append('valorMax', valorMaxFallback2.toFixed(2));
            fallback2Params.append('buscarValorAbsoluto', 'true');
            
            // Expandir também o filtro de data para ±7 dias
            if (transactionData.posted_at || transactionData.data) {
              const dataTransacao = new Date(transactionData.posted_at || transactionData.data);
              const dataInicio = new Date(dataTransacao);
              const dataFim = new Date(dataTransacao);
              
              const toleranciaDiasFallback2 = 7;
              dataInicio.setDate(dataTransacao.getDate() - toleranciaDiasFallback2);
              dataFim.setDate(dataTransacao.getDate() + toleranciaDiasFallback2);
              
              fallback2Params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
              fallback2Params.append('dataFim', dataFim.toISOString().split('T')[0]);
              
              console.log('📅 Fallback 2 - Tolerância expandida:', {
                toleranciaValor: `±${(toleranciaValorFallback2 * 100)}%`,
                toleranciaDias: `±${toleranciaDiasFallback2} dias`,
                valorMin: valorMinFallback2.toFixed(2),
                valorMax: valorMaxFallback2.toFixed(2),
                dataInicio: dataInicio.toISOString().split('T')[0],
                dataFim: dataFim.toISOString().split('T')[0]
              });
            }

            const fallback2Url = `/api/conciliacao/buscar-existentes?${fallback2Params.toString()}`;
            console.log('🌐 URL do fallback 2 (±10% valor, ±7 dias):', fallback2Url);
            
            const fallback2Response = await fetch(fallback2Url);
            if (fallback2Response.ok) {
              const fallback2Data = await fallback2Response.json();
              novosLancamentos = fallback2Data.lancamentos || [];
              totalFinal = fallback2Data.total || 0;
              hasMoreFinal = fallback2Data.hasMore || false;
              
              console.log('✅ Fallback 2 aplicado - Tolerância expandida:', {
                lancamentos: novosLancamentos.length,
                total: totalFinal,
                toleranciaValor: '10%',
                toleranciaDias: '7 dias'
              });
            }
          }
        }
      }

      // Debug completo dos dados
      setDebugInfo({
        url,
        params: Object.fromEntries(params),
        response: {
          status: response.status,
          dataKeys: Object.keys(data),
          lancamentosCount: novosLancamentos.length,
          total: totalFinal,
          hasMore: hasMoreFinal,
          usouFallback
        },
        timestamp: new Date().toISOString()
      });
      
      if (limparLista || page === 1) {
        console.log('🔄 Substituindo lista completa com', novosLancamentos.length, 'itens');
        setLancamentos(novosLancamentos);
      } else {
        console.log('➕ Adicionando', novosLancamentos.length, 'itens à lista existente');
        setLancamentos(prev => [...prev, ...novosLancamentos]);
      }

      setTotalCount(totalFinal);
      setCurrentPage(page);
      setHasMore(hasMoreFinal);

      console.log('✅ Estado atualizado:', {
        lancamentosNoEstado: limparLista || page === 1 ? novosLancamentos.length : 'adicionados à lista',
        totalCount: totalFinal,
        currentPage: page,
        hasMore: hasMoreFinal,
        usouFallback
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro na busca:', err);
      setError(errorMsg);
      
      if (limparLista || page === 1) {
        setLancamentos([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filtros, transacaoSelecionada, filtrosIniciais, itemsPerPage]);

  // Função para verificar status de uso dos lançamentos
  const checkLancamentosUsage = useCallback(async (lancamentoIds: string[]) => {
    console.log('� Verificando uso dos lançamentos via API:', lancamentoIds);
    
    for (const id of lancamentoIds) {
      try {
        console.log(`🔍 Verificando lançamento ${id}...`);
        const response = await fetch(`/api/check-lancamento-usage/${id}`);
        
        if (!response.ok) {
          console.error(`❌ Erro na API para ${id}:`, response.status, response.statusText);
          continue;
        }
        
        const result = await response.json();
        console.log(`� Resultado da API para ${id}:`, result);
        
        if (result.inUse) {
          // ✅ MESCLAR: Se a API confirma uso, manter/atualizar
          console.log(`⭐ API confirmou que ${id} está em uso:`, result);
          setUsageStatus(prev => ({
            ...prev,
            [id]: {
              inUse: true,
              starColor: result.starColor || 'yellow',
              status: result.status || 'usado'
            }
          }));
        } else {
          // ⚠️ PRESERVAR: Se API diz que não está em uso, MAS nossa simulação diz que sim,
          // preservar a simulação (pode ser um bug na API ou dados não sincronizados)
          setUsageStatus(prev => {
            if (prev[id]?.inUse) {
              console.log(`� PRESERVANDO simulação para ${id} - API diz não usado mas simulação indica uso`);
              return prev; // Manter simulação
            } else {
              console.log(`✅ API confirmou que ${id} não está em uso`);
              return {
                ...prev,
                [id]: { inUse: false }
              };
            }
          });
        }
      } catch (error) {
        console.error(`� Erro ao verificar lançamento ${id}:`, error);
        // Em caso de erro, preservar simulação se existir
        setUsageStatus(prev => {
          if (prev[id]?.inUse) {
            console.log(`�️ ERRO na API para ${id}, mantendo simulação`);
            return prev;
          }
          return prev;
        });
      }
    }
  }, []);

  // Verificar status de uso quando lançamentos são carregados
  useEffect(() => {
    if (lancamentos.length > 0) {
      const lancamentoIds = lancamentos.map(l => l.id);
      console.log('🔍 Iniciando verificação de uso para lançamentos:', lancamentoIds);
      
      // ⚠️ CORREÇÃO: Remover simulação excessiva - usar apenas dados reais
      console.log('✅ CORREÇÃO: Verificação será feita apenas via API real - sem simulação fake');
      
      // Executar verificação real via API
      checkLancamentosUsage(lancamentoIds);
    }
  }, [lancamentos, checkLancamentosUsage]);

  // Buscar ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      console.log('🚪 Modal aberto - executando filtro inteligente');
      console.log('📊 Dados da transação:', transactionData);
      console.log('🔧 Filtros iniciais:', filtrosIniciais);
      
      // Buscar contas bancárias
      buscarContasBancarias();
      
      // Reset inicial
      setLancamentos([]);
      setCurrentPage(1);
      setError(null);
      setDebugInfo(null);
      
      // Se há dados da transação, executar filtro inteligente automaticamente
      if (transactionData && (transactionData.amount || transactionData.valor)) {
        console.log('🎯 Executando filtro inteligente automático');
        buscarLancamentos(1, true);
      } else {
        console.log('📝 Aguardando ação do usuário - nenhum filtro automático aplicado');
      }
    } else {
      // Reset quando fechar
      setLancamentos([]);
      setCurrentPage(1);
      setError(null);
      setDebugInfo(null);
    }
  }, [isOpen, buscarLancamentos, buscarContasBancarias, transactionData]);

  // Função para aplicar filtros
  const aplicarFiltros = useCallback(() => {
    console.log('🔍 Aplicando filtros manuais:', filtros);
    console.log('📅 Filtros de data específicos:', {
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      contaBancariaId: filtros.contaBancariaId
    });
    buscarLancamentos(1, true);
  }, [buscarLancamentos, filtros]);

  // Função para resetar filtros e buscar todos os lançamentos
  const resetarFiltros = useCallback(() => {
    console.log('🔄 Resetando todos os filtros, seleções e buscando todos os lançamentos...');
    const novosFiltros = {
      busca: '',
      dataInicio: '',
      dataFim: '',
      contaBancariaId: [] as string[],
      planoContaId: '',
      centroCustoId: ''
    };
    
    setFiltros(novosFiltros);
    setCurrentPage(1);
    setHasMore(false);
    // Limpar todas as seleções de lançamentos
    setSelectedLancamentos([]);
    setPrimaryLancamentoId(null);
    // Limpar informações de debug
    setDebugInfo(null);
    
    // Buscar imediatamente todos os lançamentos
    setTimeout(() => {
      aplicarFiltros();
    }, 100);
  }, [aplicarFiltros]);

  // Debounce para busca automática quando o usuário digita
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      if (filtros.busca.trim()) {
        console.log('🔍 Busca automática (debounce):', filtros.busca);
        buscarLancamentos(1, true);
      }
    }, 800); // 800ms de delay
    
    return () => clearTimeout(timer);
  }, [filtros.busca, isOpen, buscarLancamentos]);

  // Funções de controle de paginação
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      buscarLancamentos(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    // Buscar novamente com novo limite de itens
    setTimeout(() => {
      buscarLancamentos(1, true);
    }, 100);
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Formatação de data para exibição (formato brasileiro)
  const formatarData = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatação de valores em moeda brasileira
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valor));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-screen !h-screen !max-w-none !left-0 !top-0 !translate-x-0 !translate-y-0 rounded-none m-0 p-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Buscar Lançamentos
          </DialogTitle>
        </DialogHeader>

        {/* Filtros e controles de busca */}
        <div className="flex-shrink-0 space-y-4 border-b pb-4">
          {/* Primeira linha de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-3">
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Pesquisa
                {filtros.busca && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    • Filtro ativo
                  </span>
                )}
              </label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${
                  filtros.busca ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <Input
                  placeholder="Digite para buscar: descrição, valor (ex: 100,50), documento ou plano de contas..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      aplicarFiltros();
                    }
                    if (e.key === 'Escape') {
                      setFiltros(prev => ({ ...prev, busca: '' }));
                    }
                  }}
                  className={`pl-9 h-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    filtros.busca ? 'border-blue-300 bg-blue-50/30' : ''
                  }`}
                />
                {filtros.busca && (
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, busca: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    type="button"
                    aria-label="Limpar pesquisa"
                    title="Limpar pesquisa (ESC)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="col-span-1 lg:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Data Início
              </label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="h-10"
              />
            </div>
            
            <div className="col-span-1 lg:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Data Fim
              </label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Caixa/Banco
              </label>
              <ContaBancariaSelect
                value={filtros.contaBancariaId}
                onValueChange={(values) => setFiltros(prev => ({ 
                  ...prev, 
                  contaBancariaId: values 
                }))}
                placeholder="Todas as contas"
                label=""
                className="h-10"
              />
            </div>

            {/* Botões de ação */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 flex items-end gap-2">
              <Button 
                onClick={aplicarFiltros} 
                disabled={isLoading}
                size="sm"
                className="bg-black text-white hover:bg-gray-800 h-10"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              
              <Button 
                onClick={resetarFiltros} 
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="h-10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Seção fixa com valores de comparação */}
        {transactionData && (
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600 font-medium">Valor Transação</span>
                <span className="font-bold text-xl text-blue-600">
                  {formatarMoeda(Math.abs(parseFloat(transactionData.amount || transactionData.valor || '0')))}
                </span>
                <span className="text-xs text-gray-500">
                  {formatarData(transactionData.posted_at || transactionData.data)}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600 font-medium">Valor Selecionado</span>
                <span className={`font-bold text-xl ${
                  selectedLancamentos.length > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {formatarMoeda(calculateSelectedTotal())}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedLancamentos.length} {selectedLancamentos.length === 1 ? 'lançamento' : 'lançamentos'}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600 font-medium">Diferença</span>
                <span className={`font-bold text-xl ${
                  Math.abs(calculateSelectedTotal() - Math.abs(parseFloat(transactionData?.amount || transactionData?.valor || '0'))) === 0
                    ? 'text-green-600' 
                    : Math.abs(calculateSelectedTotal() - Math.abs(parseFloat(transactionData?.amount || transactionData?.valor || '0'))) < 0.01
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}>
                  {formatarMoeda(Math.abs(calculateSelectedTotal() - Math.abs(parseFloat(transactionData?.amount || transactionData?.valor || '0'))))}
                </span>
                <span className={`text-xs font-medium ${
                  isExactMatch() 
                    ? 'text-green-600' 
                    : isSelectedTotalCompatible() 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                }`}>
                  {isExactMatch() 
                    ? '✓ Match Exato' 
                    : isSelectedTotalCompatible() 
                      ? '≈ Compatível' 
                      : '✗ Incompatível'
                  }
                </span>
              </div>

              {/* Indicador visual de status */}
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600 font-medium">Status</span>
                {selectedLancamentos.length === 1 ? (
                  (() => {
                    const validation = validateMatch(selectedLancamentos[0]);
                    return (
                      <div className={`flex items-center gap-2 ${
                        validation.isValid ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {validation.isValid ? (
                          <>
                            <CheckCircle className="h-6 w-6" />
                            <span className="font-bold">MATCH</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-6 w-6" />
                            <span className="font-bold">PARCIAL</span>
                          </>
                        )}
                      </div>
                    );
                  })()
                ) : selectedLancamentos.length > 1 ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-bold">MÚLTIPLO</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-bold">AGUARDANDO</span>
                  </div>
                )}
                <span className="text-xs text-gray-500 text-center mt-1">
                  {selectedLancamentos.length === 0 && 'Selecione lançamentos'}
                  {selectedLancamentos.length === 1 && 'Um lançamento'}
                  {selectedLancamentos.length > 1 && 'Múltiplos lançamentos'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NOVA SEÇÃO: Legenda das estrelas */}
        <div className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-medium text-gray-600">Legenda:</span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-green-500 fill-green-500" />
                <span className="text-xs text-gray-600">Conciliado</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                <span className="text-xs text-gray-600">Transferência</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                <span className="text-xs text-gray-600">Sugestão</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-gray-600">Em uso</span>
              </div>
            </div>
          </div>
        </div>


          {/* Linha de informações e controles */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center space-x-4">
              {/* Informações de resultados */}
              {!isLoading && (
                <div className="text-sm text-gray-600">
                  {totalCount > 0 ? (
                    <>
                      Exibindo {lancamentos.length} de {totalCount} lançamentos
                      {selectedLancamentos.length > 0 && (
                        <span className="ml-2 text-blue-600 font-medium">
                          ({selectedLancamentos.length} selecionados)
                        </span>
                      )}
                    </>
                  ) : (
                    'Nenhum lançamento encontrado'
                  )}
                </div>
              )}
            </div>
          </div>

        {/* Conteúdo principal com tabela */}
        <div className="flex-1 overflow-auto">
          {/* Informações sobre o filtro aplicado */}
          {!isLoading && lancamentos.length === 0 && !transactionData && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Como buscar lançamentos</p>
                  <p className="text-xs text-blue-700 mt-1">
                    • Use o botão "Buscar" para aplicar filtros personalizados<br/>
                    • Use "Limpar" para ver todos os lançamentos disponíveis<br/>
                    • O filtro inteligente é aplicado automaticamente quando há dados da transação
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Erro ao buscar lançamentos</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button 
                onClick={() => buscarLancamentos(1, true)} 
                size="sm" 
                variant="outline"
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {isLoading && lancamentos.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Carregando lançamentos...</p>
            </div>
          )}

          {!isLoading && !error && lancamentos.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium">Nenhum lançamento encontrado</p>
              
              <div className="flex gap-2 justify-center mt-4">
                <Button 
                  onClick={() => buscarLancamentos(1, true)} 
                  disabled={isLoading}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                
                <Button 
                  onClick={() => {
                    setFiltros({
                      busca: '',
                      dataInicio: '',
                      dataFim: '',
                      contaBancariaId: [] as string[],
                      planoContaId: '',
                      centroCustoId: ''
                    });
                    setHasMore(false);
                    // Limpar todas as seleções de lançamentos
                    setSelectedLancamentos([]);
                    setPrimaryLancamentoId(null);
                    // Limpar informações de debug
                    setDebugInfo(null);
                    setTimeout(() => buscarLancamentos(1, true), 100);
                  }} 
                  variant="outline"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}

          {/* Mensagem de fallback se foi usado */}
          {debugInfo?.response?.usouFallback && lancamentos.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Filtro inteligente não encontrou correspondências exatas
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Exibindo todos os lançamentos pendentes para seleção manual.
                    Valor da transação: R$ {transactionData ? Math.abs(parseFloat(transactionData.amount || transactionData.valor || '0')).toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de lançamentos com as colunas solicitadas */}
          {lancamentos.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12 text-center font-medium">
                        <input
                          type="checkbox"
                          checked={selectedLancamentos.length === lancamentos.length && lancamentos.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLancamentos([...lancamentos]);
                              // Se selecionou todos, o primeiro vira primário
                              if (lancamentos.length > 0) {
                                setPrimaryLancamentoId(lancamentos[0].id);
                              }
                            } else {
                              setSelectedLancamentos([]);
                              setPrimaryLancamentoId(null);
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </TableHead>
                      <TableHead className="w-16 text-center font-medium">Primário</TableHead>
                      <TableHead className="w-32 font-medium">Documento</TableHead>
                      <TableHead className="font-medium min-w-0">Descrição</TableHead>
                      <TableHead className="w-40 font-medium">Plano de Contas</TableHead>
                      <TableHead className="w-28 text-right font-medium">Valor</TableHead>
                      <TableHead className="w-20 text-center font-medium">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.map((lancamento, index) => {
                      // ✅ VALIDAÇÃO: Verificar se dados vêm da tabela 'lancamentos'
                      console.log(`📋 Renderizando lançamento ${index + 1}:`, {
                        origem: 'tabela_lancamentos',
                        id: lancamento.id,
                        data_lancamento: lancamento.data_lancamento,
                        descricao: lancamento.descricao,
                        valor: lancamento.valor,
                        tipo: lancamento.tipo,
                        status: lancamento.status,
                        numero_documento: lancamento.numero_documento,
                        conta_bancaria_id: lancamento.conta_bancaria_id,
                        plano_contas: lancamento.plano_contas?.nome || 'N/A'
                      });

                      const isSelected = selectedLancamentos.find(l => l.id === lancamento.id);
                      const validation = validateMatch(lancamento);
                      const usage = usageStatus[lancamento.id];
                      const isInUse = usage?.inUse || false;
                      
                      return (
                        <TableRow 
                          key={lancamento.id} 
                          className={`transition-colors ${
                            isInUse
                              ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected 
                                ? 'bg-blue-50 border-l-2 border-l-blue-500 hover:bg-blue-100' 
                                : validation.isValid 
                                  ? 'border-l-2 border-l-green-300 hover:bg-gray-50' 
                                  : 'hover:bg-gray-50'
                          }`}
                        >
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              disabled={isInUse}
                              onChange={() => handleSelectLancamento(lancamento)}
                              className={`h-4 w-4 rounded border-gray-300 focus:ring-blue-500 ${
                                isInUse 
                                  ? 'cursor-not-allowed opacity-50' 
                                  : 'text-blue-600'
                              }`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {/* ✅ SISTEMA DE ESTRELAS MELHORADO: Indicador visual de uso de lançamentos */}
                            {(() => {
                              const usage = usageStatus[lancamento.id];
                              const isSelected = selectedLancamentos.some(sel => sel.id === lancamento.id);
                              
                              console.log(`🔍 Renderizando coluna Primário para ${lancamento.id}:`, {
                                hasUsage: !!usage,
                                usage: usage,
                                isSelected,
                                usageInUse: usage?.inUse
                              });
                              
                              // Se o lançamento está em uso, mostrar estrela colorida baseada no status
                              if (usage?.inUse) {
                                console.log(`⭐ Renderizando estrela para lançamento ${lancamento.id}:`, {
                                  starColor: usage.starColor,
                                  status: usage.status,
                                  color: usage.color
                                });
                                
                                let starColor = '';
                                let fillColor = '';
                                let title = '';
                                
                                // ✅ MAPEAMENTO MELHORADO: Baseado no starColor da API
                                switch (usage.starColor) {
                                  case 'green':
                                    starColor = 'text-green-500';
                                    fillColor = 'fill-green-500';
                                    title = 'Lançamento já conciliado ✅';
                                    break;
                                  case 'blue':
                                    starColor = 'text-blue-500';
                                    fillColor = 'fill-blue-500';
                                    title = 'Lançamento usado em transferência 🔄';
                                    break;
                                  case 'orange':
                                    starColor = 'text-orange-500';
                                    fillColor = 'fill-orange-500';
                                    title = 'Lançamento com sugestão pendente ⏳';
                                    break;
                                  default:
                                    // ✅ FALLBACK: Estrela amarela para qualquer uso não identificado
                                    starColor = 'text-yellow-500';
                                    fillColor = 'fill-yellow-500';
                                    title = 'Lançamento em uso - não selecione novamente ⚠️';
                                }
                                
                                return (
                                  <div className="flex justify-center" title={title}>
                                    <Star 
                                      className={`h-4 w-4 ${starColor} ${fillColor}`}
                                    />
                                  </div>
                                );
                              }
                              
                              // Se está selecionado, mostrar botão para marcar como primário
                              if (isSelected) {
                                return (
                                  <button
                                    onClick={() => handleSetPrimary(lancamento.id)}
                                    className={`p-1 rounded-full transition-colors ${
                                      primaryLancamentoId === lancamento.id
                                        ? 'text-yellow-500 hover:text-yellow-600'
                                        : 'text-gray-300 hover:text-yellow-400'
                                    }`}
                                    title={primaryLancamentoId === lancamento.id ? 'Este é o lançamento primário' : 'Marcar como primário'}
                                  >
                                    <Star className={`h-4 w-4 ${primaryLancamentoId === lancamento.id ? 'fill-current' : ''}`} />
                                  </button>
                                );
                              }
                              
                              // Lançamento disponível - sem estrela
                              return null;
                            })()}
                          </TableCell>
                          
                          {/* 3. Documento */}
                          <TableCell className="text-sm">
                            <div className="truncate" title={lancamento.numero_documento}>
                              {/* ✅ Campo: numero_documento da tabela lancamentos */}
                              {lancamento.numero_documento || '-'}
                            </div>
                          </TableCell>
                          
                          {/* 4. Descrição */}
                          <TableCell className="text-sm min-w-0">
                            <div className="truncate" title={lancamento.descricao}>
                              {/* ✅ Campo: descricao da tabela lancamentos */}
                              {lancamento.descricao || 'Sem descrição'}
                            </div>
                          </TableCell>
                          
                          {/* 5. Plano de Contas */}
                          <TableCell className="text-sm">
                            <div className="truncate" title={lancamento.plano_contas?.nome}>
                              {/* ✅ Campo: plano_contas.nome via JOIN da tabela lancamentos */}
                              {lancamento.plano_contas?.nome || '-'}
                            </div>
                          </TableCell>
                          
                          {/* 6. Valor */}
                          <TableCell className="text-sm font-medium text-right">
                            <span className={`${validation.valueMatch ? 'text-green-600' : (lancamento.valor >= 0 ? 'text-green-700' : 'text-red-700')}`}>
                              {/* ✅ Campo: valor da tabela lancamentos */}
                              R$ {formatarMoeda(lancamento.valor)}
                            </span>
                          </TableCell>
                          
                          {/* 7. Ações */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectLancamento(lancamento)}
                                disabled={isInUse}
                                className={`h-7 px-2 text-xs ${
                                  isInUse 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : ''
                                }`}
                                title={isInUse ? 'Lançamento já está em uso' : 'Selecionar este lançamento'}
                              >
                                {isInUse ? 'Em uso' : 'Usar'}
                              </Button>
                              {validation.isValid && !isInUse && (
                                <div className="text-green-500" title="Match perfeito">
                                  <CheckCircle className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
                
                {/* Paginação estilo LancamentosPagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Itens por página</p>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        {totalCount > 0 ? `${Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-${Math.min(currentPage * itemsPerPage, totalCount)} de ${totalCount}` : "0 de 0"}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Ir para primeira página</span>
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Ir para página anterior</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {getVisiblePages().map((page, index) => (
                            <div key={index}>
                              {page === '...' ? (
                                <span className="px-2 py-1 text-sm">...</span>
                              ) : (
                                <Button
                                  variant={page === currentPage ? "default" : "outline"}
                                  className="h-8 w-8 p-0"
                                  onClick={() => handlePageChange(page as number)}
                                >
                                  {page}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Ir para próxima página</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Ir para última página</span>
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mostrar seletor de itens por página mesmo quando há apenas uma página */}
                {totalPages <= 1 && totalCount > 0 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Itens por página</p>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        {totalCount > 0 ? `${Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-${Math.min(currentPage * itemsPerPage, totalCount)} de ${totalCount}` : "0 de 0"}
                      </div>
                    </div>
                  </div>
                )}
              
            </div>
          )}
        </div>
        
        {/* Footer com botões de ação */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            {selectedLancamentos.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{selectedLancamentos.length}</span> lançamento{selectedLancamentos.length === 1 ? '' : 's'} selecionado{selectedLancamentos.length === 1 ? '' : 's'}
                {transactionData && (
                  <span className="ml-2">
                    • <span className={`font-medium ${
                      isExactMatch() ? 'text-green-600' : 
                      isSelectedTotalCompatible() ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {isExactMatch() ? 'Match exato - Pode conciliar automaticamente' : 
                       isSelectedTotalCompatible() ? 'Pequena divergência - Sugestão apenas' : 
                       'Valores divergentes'}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Indicador visual do status da seleção */}
            {selectedLancamentos.length > 0 && transactionData && (
              <div className="flex items-center space-x-2 text-sm">
                {selectedLancamentos.length === 1 ? (
                  (() => {
                    const validation = validateMatch(selectedLancamentos[0]);
                    return validation.isValid && isExactMatch() ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="font-medium">Match Exato</span>
                      </div>
                    ) : validation.isValid && isSelectedTotalCompatible() ? (
                      <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="font-medium">Match Aproximado</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="font-medium">Match Divergente</span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center text-blue-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="font-medium">Múltiplos</span>
                  </div>
                )}
              </div>
            )}
            
            <Button 
              onClick={handleCreateSuggestion}
              disabled={selectedLancamentos.length === 0}
              className={`px-6 transition-all duration-200 ${
                selectedLancamentos.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : selectedLancamentos.length === 1 && isExactMatch()
                    ? 'bg-green-600 text-white hover:bg-green-700' // Verde para match exato
                    : isSelectedTotalCompatible() 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' // Amarelo para divergência pequena
                      : 'bg-blue-600 text-white hover:bg-blue-700' // Azul para sugestão normal
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {selectedLancamentos.length === 0 
                ? 'Selecione Lançamentos'
                : selectedLancamentos.length === 1 && isExactMatch()
                  ? 'Conciliar Automaticamente'
                  : selectedLancamentos.length === 1 && isSelectedTotalCompatible()
                    ? 'Criar Sugestão (Divergência Pequena)'
                    : 'Criar Sugestão'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Modal de edição de lançamento */}
      {editingLancamento && transactionData && (
        <EditLancamentoModal
          lancamento={editingLancamento}
          targetDate={formatDateForComparison(transactionData.posted_at || transactionData.data)}
          targetValue={parseFloat(transactionData.amount || transactionData.valor)}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingLancamento(null);
          }}
          onSave={(updatedLancamento) => {
            setLancamentos(prev => 
              prev.map(l => l.id === updatedLancamento.id ? updatedLancamento : l)
            );
            setSelectedLancamentos(prev => 
              prev.map(l => l.id === updatedLancamento.id ? updatedLancamento : l)
            );
            setShowEditModal(false);
            setEditingLancamento(null);
          }}
        />
      )}
    </Dialog>
  );
}
