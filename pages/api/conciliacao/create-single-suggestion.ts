import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SingleLancamentoData {
  lancamentoId: string;
  bankTransactionId: string;
  matchType: 'exact_match' | 'manual' | 'partial_match';
  confidenceLevel: 'high' | 'medium' | 'low';
  isValidMatch: boolean;
  validation?: {
    dateMatch: boolean;
    valueMatch: boolean;
    valueDifference: number;
    isExactMatch: boolean;
  };
  summary?: {
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
      lancamentoId,
      bankTransactionId,
      matchType,
      confidenceLevel,
      isValidMatch,
      validation,
      summary
    }: SingleLancamentoData = req.body;

    console.log('🎯 API: Processando lançamento único:', {
      bankTransactionId,
      lancamentoId,
      matchType,
      confidenceLevel,
      isValidMatch
    });

    // ✅ VALIDAÇÕES INICIAIS
    if (!lancamentoId) {
      return res.status(400).json({ error: 'ID do lançamento é obrigatório' });
    }

    if (!bankTransactionId) {
      return res.status(400).json({ error: 'ID da transação bancária é obrigatório' });
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

    // ✅ PASSO 3: Verificar se o lançamento está disponível
    const { data: lancamentoCheck, error: lancamentoError } = await supabase
      .from('lancamentos')
      .select('id, status, valor')
      .eq('id', lancamentoId)
      .single();

    if (lancamentoError) {
      console.error('❌ Erro ao verificar lançamento:', lancamentoError);
      return res.status(500).json({ error: 'Erro ao verificar disponibilidade do lançamento' });
    }

    if (!lancamentoCheck) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    // Verificar se o lançamento já está em uso
    if (lancamentoCheck.status === 'conciliado' || lancamentoCheck.status === 'com_sugestao') {
      console.warn('⚠️ Lançamento já está em uso:', lancamentoId);
      return res.status(409).json({ 
        error: 'Lançamento selecionado já está em uso',
        lancamentoId: lancamentoId,
        currentStatus: lancamentoCheck.status
      });
    }

    // ✅ PASSO 4: Mapear match_type para valores aceitos pelo constraint
    // Baseado na verificação: apenas "manual" e "automatic" são aceitos
    let finalMatchType: string;
    switch (matchType) {
      case 'exact_match':
        finalMatchType = 'automatic'; // ✅ CORRIGIDO: usar automatic para matches exatos
        break;
      case 'partial_match':
        finalMatchType = 'manual'; // ✅ CORRIGIDO: usar manual para matches parciais
        break;
      case 'manual':
      default:
        finalMatchType = 'manual'; // ✅ CORRIGIDO: usar manual como padrão
        break;
    }

    // ✅ PASSO 5: Criar novo match único
    const newMatch = {
      bank_transaction_id: bankTransactionId,
      system_transaction_id: lancamentoId,
      match_type: finalMatchType,
      confidence_level: confidenceLevel,
      status: 'suggested',
      is_primary: true, // Para lançamento único, sempre é primário
      match_order: 1,
      group_size: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Criando match único:', {
      finalMatchType,
      confidenceLevel,
      isValidMatch,
      bancoDados: newMatch
    });

    // ✅ PASSO 6: Inserir o match
    const { data: insertedMatch, error: insertError } = await supabase
      .from('transaction_matches')
      .insert([newMatch])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir match único:', insertError);
      return res.status(500).json({ 
        error: 'Erro ao salvar match único', 
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      });
    }

    // ✅ PASSO 7: Atualizar status da transação bancária (usando valores aceitos pela constraint)
    const bankStatus = isValidMatch && finalMatchType === 'automatic' ? 'sugerido' : 'sugerido';
    
    console.log('🔄 Atualizando bank_transaction (padrão API múltipla):', {
      bankTransactionId,
      bankStatus,
      matched_amount: lancamentoCheck.valor,
      match_count: 1,
      primary_lancamento_id: lancamentoId,
      confidence_level: confidenceLevel
    });
    
    const updateData = {
      reconciliation_status: bankStatus, // ✅ CORRIGIDO: usar 'sugerido'
      matched_amount: lancamentoCheck.valor,
      match_count: 1, // ✅ ADICIONADO: igual à API múltipla
      primary_lancamento_id: lancamentoId,
      confidence_level: confidenceLevel, // ✅ ADICIONADO: igual à API múltipla
      updated_at: new Date().toISOString()
    };

    console.log('🔍 Dados do update bank_transactions:', {
      bankTransactionId,
      updateData,
      tipos: {
        reconciliation_status: typeof updateData.reconciliation_status,
        matched_amount: typeof updateData.matched_amount,
        match_count: typeof updateData.match_count,
        primary_lancamento_id: typeof updateData.primary_lancamento_id,
        confidence_level: typeof updateData.confidence_level
      }
    });
    
    const { error: updateBankError } = await supabase
      .from('bank_transactions')
      .update(updateData)
      .eq('id', bankTransactionId);

    if (updateBankError) {
      console.error('❌ Erro ao atualizar transação bancária:', updateBankError);
      return res.status(500).json({ error: 'Erro ao atualizar status da transação' });
    }

    // ✅ PASSO 8: Atualizar status do lançamento do sistema (usando mesmo padrão da API múltipla)
    const lancamentoStatus = isValidMatch && finalMatchType === 'automatic' ? 'conciliado' : 'com_sugestao';

    const { error: updateLancamentoError } = await supabase
      .from('lancamentos')
      .update({
        status: lancamentoStatus,
        bank_transaction_id: bankTransactionId, // ✅ IGUAL à API múltipla
        is_multiple_match: false, // ✅ IGUAL à API múltipla (false para único)
        match_group_size: 1, // ✅ IGUAL à API múltipla (1 para único)
        updated_at: new Date().toISOString()
      })
      .eq('id', lancamentoId);

    if (updateLancamentoError) {
      console.error('❌ Erro ao atualizar lançamento:', updateLancamentoError);
      return res.status(500).json({ error: 'Erro ao atualizar status do lançamento' });
    }

    console.log('✅ Match único criado com sucesso:', {
      bankTransactionId,
      lancamentoId,
      status: bankStatus,
      matchType: finalMatchType,
      confidenceLevel,
      isValidMatch
    });

    // ✅ PASSO 9: Retornar resultado completo
    return res.status(200).json({
      success: true,
      data: {
        match: insertedMatch,
        bankTransaction: { id: bankTransactionId, status: bankStatus },
        matchedLancamento: lancamentoId,
        summary: {
          matchType: finalMatchType,
          confidenceLevel,
          isValidMatch,
          valor: lancamentoCheck.valor,
          validation,
          bancario: summary
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro geral na API de match único:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
