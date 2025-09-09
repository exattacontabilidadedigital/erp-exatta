import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usando apenas ANON KEY por enquanto devido a problema com SERVICE_ROLE_KEY
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bankTransactionId } = req.query;

    if (!bankTransactionId || typeof bankTransactionId !== 'string') {
      return res.status(400).json({ error: 'bankTransactionId é obrigatório' });
    }

    console.log('🔍 Buscando múltiplos matches para transação:', bankTransactionId);

    // ✅ BUSCAR: Todos os matches da transação bancária com dados dos lançamentos
    const { data: matches, error: matchesError } = await supabase
      .from('transaction_matches')
      .select(`
        id,
        bank_transaction_id,
        system_transaction_id,
        match_type,
        confidence_level,
        is_primary,
        match_order,
        group_size,
        system_amount,
        bank_amount,
        total_group_amount,
        date_match,
        value_match,
        value_difference,
        created_at,
        updated_at,
        lancamentos:system_transaction_id (
          id,
          data_lancamento,
          descricao,
          valor,
          tipo,
          numero_documento,
          status,
          plano_conta,
          conta_bancaria_id,
          is_multiple_match,
          match_group_size
        )
      `)
      .eq('bank_transaction_id', bankTransactionId)
      .order('match_order', { ascending: true });

    if (matchesError) {
      console.error('❌ Erro ao buscar matches múltiplos:', matchesError);
      return res.status(500).json({ error: 'Erro ao buscar matches', details: matchesError.message });
    }

    if (!matches || matches.length === 0) {
      console.log('ℹ️ Nenhum match encontrado para transação:', bankTransactionId);
      return res.status(200).json({
        success: true,
        data: {
          matches: [],
          primaryMatch: null,
          groupSize: 0,
          totalAmount: 0,
          matchType: null,
          confidenceLevel: null,
          hasMultipleMatches: false
        }
      });
    }

    // ✅ ORGANIZAR: Dados por grupo
    const primaryMatch = matches.find(m => m.is_primary);
    const allMatches = matches || [];
    const groupSize = allMatches.length;
    const hasMultipleMatches = groupSize > 1;

    // ✅ CALCULAR: Metadados do grupo
    const totalAmount = primaryMatch?.total_group_amount || 
                       allMatches.reduce((sum, m) => sum + (m.system_amount || 0), 0);
    
    const matchType = allMatches[0]?.match_type || 'manual';
    const confidenceLevel = allMatches[0]?.confidence_level || 'medium';

    // ✅ BUSCAR: Dados da transação bancária
    const { data: bankTransaction, error: bankError } = await supabase
      .from('bank_transactions')
      .select(`
        id,
        amount,
        posted_at,
        memo,
        status,
        match_type,
        matched_amount,
        match_count,
        primary_lancamento_id,
        confidence_level
      `)
      .eq('id', bankTransactionId)
      .single();

    if (bankError) {
      console.warn('⚠️ Erro ao buscar transação bancária:', bankError);
    }

    // ✅ ESTATÍSTICAS: Validações e metadados
    const statistics = {
      totalSystemAmount: allMatches.reduce((sum, m) => sum + (m.system_amount || 0), 0),
      bankAmount: bankTransaction?.amount || primaryMatch?.bank_amount || 0,
      valueDifference: Math.abs(
        (bankTransaction?.amount || 0) - 
        allMatches.reduce((sum, m) => sum + (m.system_amount || 0), 0)
      ),
      isExactMatch: allMatches.some(m => m.value_match),
      hasDateMatch: allMatches.some(m => m.date_match),
      averageConfidence: confidenceLevel,
      createdAt: primaryMatch?.created_at || allMatches[0]?.created_at,
      updatedAt: Math.max(...allMatches.map(m => new Date(m.updated_at || m.created_at || 0).getTime()))
    };

    console.log('✅ Múltiplos matches encontrados:', {
      bankTransactionId,
      totalMatches: allMatches.length,
      primaryLancamentoId: primaryMatch?.system_transaction_id,
      matchType,
      confidenceLevel,
      hasMultipleMatches,
      totalAmount
    });

    return res.status(200).json({
      success: true,
      data: {
        matches: allMatches,
        primaryMatch,
        groupSize,
        totalAmount,
        matchType,
        confidenceLevel,
        hasMultipleMatches,
        bankTransaction,
        statistics,
        // ✅ DADOS ORGANIZADOS: Para facilitar uso no frontend
        organized: {
          primaryLancamento: primaryMatch?.lancamentos,
          allLancamentos: allMatches.map(m => m.lancamentos).filter(Boolean),
          selectedLancamentosIds: allMatches.map(m => m.system_transaction_id),
          primaryLancamentoId: primaryMatch?.system_transaction_id,
          isValidMatch: statistics.isExactMatch && matchType === 'exact',
          needsValidation: confidenceLevel === 'low' || statistics.valueDifference > 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro geral na API de buscar múltiplos matches:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
