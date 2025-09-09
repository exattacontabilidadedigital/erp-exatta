import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usando apenas ANON KEY por enquanto devido a problema com SERVICE_ROLE_KEY
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MultipleLancamentoData {
  selectedLancamentos: any[];
  primaryLancamento?: any;
  primaryLancamentoId?: string;
  bankTransactionId: string;
  isValidMatch: boolean;
  totalValue: number;
  matchType: 'exact' | 'manual' | 'multiple_transactions';
  confidenceLevel: 'high' | 'medium' | 'low';
  validation?: {
    dateMatch: boolean;
    valueMatch: boolean;
    valueDifference: number;
    isExactMatch: boolean;
  };
  summary?: {
    selectedCount: number;
    bankAmount: number;
    systemAmount: number;
    difference: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      selectedLancamentos,
      primaryLancamento,
      primaryLancamentoId,
      bankTransactionId,
      isValidMatch,
      totalValue,
      matchType,
      confidenceLevel,
      validation,
      summary
    }: MultipleLancamentoData = req.body;

    console.log('🎯 API: Processando múltiplos lançamentos:', {
      bankTransactionId,
      selectedCount: selectedLancamentos?.length || 0,
      matchType,
      totalValue,
      primaryLancamentoId,
      isValidMatch
    });

    // ✅ VALIDAÇÕES INICIAIS
    if (!selectedLancamentos || selectedLancamentos.length === 0) {
      return res.status(400).json({ error: 'Nenhum lançamento selecionado' });
    }

    if (!bankTransactionId) {
      return res.status(400).json({ error: 'ID da transação bancária é obrigatório' });
    }

    if (!primaryLancamentoId && selectedLancamentos.length > 1) {
      return res.status(400).json({ error: 'Lançamento primário é obrigatório para múltiplas seleções' });
    }

    // ✅ PASSO 1: Verificar se a transação OFX já tem matches existentes
    console.log('🔍 Verificando matches existentes para transação:', bankTransactionId);
    
    const { data: existingMatches, error: checkError } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bankTransactionId);

    if (checkError) {
      console.error('❌ Erro ao verificar matches existentes:', checkError);
      return res.status(500).json({ error: 'Erro ao verificar matches existentes' });
    }

    // ✅ PASSO 2: Se há matches existentes, remover primeiro (replace logic)
    if (existingMatches && existingMatches.length > 0) {
      console.log('🔄 Removendo matches existentes para substituir:', existingMatches.length);
      
      const { error: deleteError } = await supabase
        .from('transaction_matches')
        .delete()
        .eq('bank_transaction_id', bankTransactionId);

      if (deleteError) {
        console.error('❌ Erro ao remover matches existentes:', deleteError);
        return res.status(500).json({ error: 'Erro ao remover matches existentes' });
      }
    }

    // ✅ PASSO 3: Verificar se os lançamentos estão disponíveis
    const lancamentoIds = selectedLancamentos.map(l => l.id);
    
    const { data: lancamentosCheck, error: lancamentosError } = await supabase
      .from('lancamentos')
      .select('id, status')
      .in('id', lancamentoIds);

    if (lancamentosError) {
      console.error('❌ Erro ao verificar status dos lançamentos:', lancamentosError);
      return res.status(500).json({ error: 'Erro ao verificar disponibilidade dos lançamentos' });
    }

    // Verificar se algum lançamento já está em uso
    const lancamentosEmUso = lancamentosCheck?.filter(l => 
      l.status === 'conciliado' || l.status === 'com_sugestao'
    ) || [];

    if (lancamentosEmUso.length > 0) {
      console.warn('⚠️ Alguns lançamentos já estão em uso:', lancamentosEmUso.map(l => l.id));
      return res.status(409).json({ 
        error: 'Alguns lançamentos selecionados já estão em uso',
        lancamentosEmUso: lancamentosEmUso.map(l => l.id)
      });
    }

    // ✅ PASSO 4: Criar novos matches para CADA lançamento selecionado
    const bankAmount = summary?.bankAmount || totalValue;
    
    // ✅ CORRIGIDO: mapear match_type para valores aceitos pelo constraint
    // Baseado na verificação: apenas "manual" e "automatic" são aceitos
    let finalMatchType: string;
    switch (matchType) {
      case 'exact':
        finalMatchType = 'automatic'; // ✅ CORRIGIDO: usar automatic para matches exatos
        break;
      case 'multiple_transactions':
        finalMatchType = 'manual'; // ✅ CORRIGIDO: usar manual para múltiplas
        break;
      case 'manual':
      default:
        finalMatchType = 'manual'; // ✅ CORRIGIDO: usar manual como padrão
        break;
    }
    
    const newMatches = selectedLancamentos.map((lancamento, index) => ({
      bank_transaction_id: bankTransactionId,
      system_transaction_id: lancamento.id, // ✅ CORRIGIDO: usar system_transaction_id
      match_type: finalMatchType, // ✅ CORRIGIDO: usar "manual" em vez de "multiple"
      confidence_level: confidenceLevel,
      status: 'suggested', // ✅ NOVO: Status para evitar remoção durante conciliação
      // ✅ NOVO: Indicar qual é o lançamento primário
      is_primary: lancamento.id === primaryLancamentoId,
      // ✅ NOVO: Ordem na seleção múltipla
      match_order: index + 1,
      // ✅ NOVO: Total de lançamentos no grupo
      group_size: selectedLancamentos.length,
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('📝 Criando matches múltiplos:', {
      totalMatches: newMatches.length,
      primaryLancamento: newMatches.find(m => m.is_primary)?.system_transaction_id,
      groupSize: selectedLancamentos.length,
      matchType,
      confidenceLevel
    });

    // ✅ PASSO 5: Inserir todos os matches de uma vez (transação)
    const { data: insertedMatches, error: insertError } = await supabase
      .from('transaction_matches')
      .insert(newMatches)
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir matches múltiplos:', insertError);
      return res.status(500).json({ error: 'Erro ao salvar matches múltiplos', details: insertError.message });
    }

    // ✅ PASSO 6: Atualizar status da transação bancária
    const bankStatus = isValidMatch && finalMatchType === 'automatic' ? 'sugerido' : 'sugerido';
    
    const { error: updateBankError } = await supabase
      .from('bank_transactions')
      .update({
        reconciliation_status: bankStatus, // ✅ CORRIGIDO: usar reconciliation_status
        // ✅ REMOVIDO: match_type da bank_transactions (pode ter constraint diferente)
        // match_type: finalMatchType,
        matched_amount: totalValue,
        match_count: selectedLancamentos.length,
        primary_lancamento_id: primaryLancamentoId,
        confidence_level: confidenceLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', bankTransactionId);

    if (updateBankError) {
      console.error('❌ Erro ao atualizar transação bancária:', updateBankError);
      return res.status(500).json({ error: 'Erro ao atualizar status da transação' });
    }

    // ✅ PASSO 7: Atualizar status dos lançamentos do sistema
    const lancamentoStatus = isValidMatch && finalMatchType === 'automatic' ? 'conciliado' : 'com_sugestao';

    const { error: updateLancamentosError } = await supabase
      .from('lancamentos')
      .update({
        status: lancamentoStatus,
        // ✅ NOVO: Referência para a transação bancária
        bank_transaction_id: bankTransactionId,
        // ✅ NOVO: Indicar se faz parte de um grupo múltiplo
        is_multiple_match: selectedLancamentos.length > 1,
        match_group_size: selectedLancamentos.length,
        updated_at: new Date().toISOString()
      })
      .in('id', lancamentoIds);

    if (updateLancamentosError) {
      console.error('❌ Erro ao atualizar lançamentos:', updateLancamentosError);
      return res.status(500).json({ error: 'Erro ao atualizar status dos lançamentos' });
    }

    console.log('✅ Múltiplos matches criados com sucesso:', {
      bankTransactionId,
      matchesCreated: insertedMatches?.length || 0,
      lancamentosUpdated: lancamentoIds.length,
      status: bankStatus,
      matchType,
      totalValue,
      isValidMatch
    });

    // ✅ PASSO 8: Retornar resultado completo
    return res.status(200).json({
      success: true,
      data: {
        matches: insertedMatches,
        bankTransaction: { id: bankTransactionId, status: bankStatus },
        matchedLancamentos: lancamentoIds,
        summary: {
          totalMatches: newMatches.length,
          totalValue,
          matchType,
          confidenceLevel,
          isValidMatch,
          primaryLancamentoId,
          groupSize: selectedLancamentos.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro geral na API de múltiplos matches:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
