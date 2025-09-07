import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankTransactionId = params.id;

    console.log('🔍 Verificando status da transação:', bankTransactionId);

    // Buscar status atual da transação bancária
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('id, status_conciliacao, reconciliation_status, matched_lancamento_id, reconciled_at, reconciled_by')
      .eq('id', bankTransactionId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar transação:', error);
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    console.log('📊 Status encontrado:', data);

    return NextResponse.json({
      id: data.id,
      status_conciliacao: data.status_conciliacao,
      reconciliation_status: data.reconciliation_status,
      matched_lancamento_id: data.matched_lancamento_id,
      reconciled_at: data.reconciled_at,
      reconciled_by: data.reconciled_by,
      is_reconciled: data.status_conciliacao === 'conciliado'
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
