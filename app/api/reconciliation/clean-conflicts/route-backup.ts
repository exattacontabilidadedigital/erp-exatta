import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  return NextResponse.json({
    message: 'Clean-conflicts API is working',
    method: 'GET',
    status: 'ok'
  });
}

export async function POST(request: NextRequest) {
  try {
    const { empresa_id, bank_account_id } = await request.json();

    console.log('🧹 Iniciando limpeza de conflitos:', {
      empresa_id,
      bank_account_id
    });

    // 1. Buscar todas as transações bancárias não conciliadas
    const { data: pendingTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('id')
      .eq('empresa_id', empresa_id)
      .eq('bank_account_id', bank_account_id)
      .neq('status_conciliacao', 'conciliado');

    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return NextResponse.json(
        { error: 'Erro ao acessar transações bancárias' },
        { status: 500 }
      );
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma transação pendente encontrada',
        conflicts_cleaned: 0
      });
    }

    const pendingIds = pendingTransactions.map(t => t.id);

    // 2. Buscar matches confirmados para essas transações
    const { data: conflictingMatches, error: matchError } = await supabase
      .from('transaction_matches')
      .select('id, bank_transaction_id')
      .eq('status', 'confirmed')
      .in('bank_transaction_id', pendingIds);

    if (matchError) {
      console.error('❌ Erro ao buscar matches:', matchError);
      return NextResponse.json(
        { error: 'Erro ao acessar matches' },
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

    // 3. Remover matches conflitantes
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

    // 4. Atualizar status das transações bancárias
    const bankTransactionIds = conflictingMatches.map(m => m.bank_transaction_id);
    
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        status_conciliacao: 'pendente',
        reconciliation_status: 'sem_match',
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
      // Não falhar aqui - continuar
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
