import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { bank_transaction_id, reason } = await request.json();

    console.log('🚫 Ignorando transação:', {
      bank_transaction_id,
      reason
    });

    // Atualizar status da transação bancária para ignorada
    const { data, error } = await supabase
      .from('bank_transactions')
      .update({
        reconciliation_status: 'sem_match',     // Classificação: sem_match (não atende regras)
        status_conciliacao: 'ignorado',         // Ação do usuário: ignorado
        matched_lancamento_id: null,
        match_confidence: null,
        match_type: null,
        match_criteria: null,
        reconciled_at: null,
        reconciled_by: null,
        reconciliation_notes: reason || 'Transação ignorada pelo usuário',
        updated_at: new Date().toISOString()
      })
      .eq('id', bank_transaction_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao ignorar transação:', error);
      return NextResponse.json(
        { error: 'Erro ao ignorar transação' },
        { status: 500 }
      );
    }

    // Remover qualquer match existente
    const { error: deleteError } = await supabase
      .from('transaction_matches')
      .delete()
      .eq('bank_transaction_id', bank_transaction_id);

    if (deleteError) {
      console.error('❌ Erro ao remover matches:', deleteError);
    }

    console.log('✅ Transação ignorada:', data.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Transação ignorada com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de ignorar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
