import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('❌ POST /api/reconciliation/reject iniciado');
    
    const body = await request.json();
    const { bank_transaction_id, reason } = body;

    if (!bank_transaction_id) {
      return NextResponse.json(
        { error: 'bank_transaction_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📊 Rejeitando sugestão:', { bank_transaction_id, reason });

    // Atualizar status da transação bancária para pending (resetar status)
    // Como a constraint só aceita 'pending' e 'matched', usamos 'pending' para indicar 
    // que a sugestão foi rejeitada e precisa de nova análise
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'pending',
        matched_lancamento_id: null,
        match_confidence: null,
        match_type: null,
        match_criteria: null,
        reconciliation_notes: reason || 'user_rejected'
      })
      .eq('id', bank_transaction_id);

    if (updateError) {
      console.error('❌ Erro ao rejeitar sugestão:', updateError);
      return NextResponse.json(
        { error: 'Erro ao rejeitar sugestão' },
        { status: 500 }
      );
    }

    console.log('✅ Sugestão rejeitada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Sugestão rejeitada com sucesso',
      bank_transaction_id,
      reason: reason || 'user_rejected',
      new_status: 'pending'
    });

  } catch (error) {
    console.error('❌ Erro na API de rejeição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
