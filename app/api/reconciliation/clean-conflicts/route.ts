import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { empresa_id, bank_account_id } = await request.json();

    console.log('🧹 Iniciando limpeza de conflitos:', {
      empresa_id,
      bank_account_id
    });

    // 1. Identificar matches órfãos (confirmados mas bank_transactions pendentes)
    const { data: conflictingMatches, error: conflictError } = await supabase
      .from('transaction_matches')
      .select(`
        id,
        bank_transaction_id,
        system_transaction_id,
        status,
        bank_transactions!inner(
          id,
          status_conciliacao,
          bank_account_id,
          empresa_id
        )
      `)
      .eq('status', 'confirmed')
      .eq('bank_transactions.empresa_id', empresa_id)
      .eq('bank_transactions.bank_account_id', bank_account_id)
      .neq('bank_transactions.status_conciliacao', 'conciliado');

    if (conflictError) {
      console.error('❌ Erro ao buscar conflitos:', conflictError);
      return NextResponse.json(
        { error: 'Erro ao identificar conflitos' },
        { status: 500 }
      );
    }

    console.log(`🔍 Conflitos encontrados: ${conflictingMatches?.length || 0}`);

    if (!conflictingMatches || conflictingMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum conflito encontrado',
        conflicts_cleaned: 0
      });
    }

    // 2. Remover matches conflitantes
    const matchIds = conflictingMatches.map(m => m.id);
    
    const { error: deleteError } = await supabase
      .from('transaction_matches')
      .delete()
      .in('id', matchIds);

    if (deleteError) {
      console.error('❌ Erro ao remover conflitos:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao limpar conflitos' },
        { status: 500 }
      );
    }

    // 3. Garantir que bank_transactions estejam com status correto
    const bankTransactionIds = conflictingMatches.map(m => m.bank_transaction_id);
    
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        status_conciliacao: 'pendente',                 // Ação do usuário: pendente
        reconciliation_status: 'sem_match',             // Classificação: sem_match
        matched_lancamento_id: null,
        match_confidence: null,
        match_type: null,
        match_criteria: null,
        reconciled_at: null,
        reconciled_by: null,
        reconciliation_notes: null
      })
      .in('id', bankTransactionIds);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar status das transações:', updateError);
      // Não falhar aqui - continuar com limpeza
    }

    console.log('✅ Conflitos limpos com sucesso:', {
      matches_removidos: matchIds.length,
      transacoes_atualizadas: bankTransactionIds.length
    });

    return NextResponse.json({
      success: true,
      message: `${matchIds.length} conflitos resolvidos com sucesso`,
      conflicts_cleaned: matchIds.length,
      details: {
        removed_matches: matchIds,
        updated_bank_transactions: bankTransactionIds
      }
    });

  } catch (error) {
    console.error('❌ Erro interno na limpeza de conflitos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
