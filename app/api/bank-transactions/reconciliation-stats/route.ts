// =========================================================
// API: ESTATÍSTICAS DE CONCILIAÇÃO
// Endpoint para obter estatísticas de conciliação por período
// =========================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const bankAccountId = searchParams.get('bank_account_id');
    const dateStart = searchParams.get('date_start');
    const dateEnd = searchParams.get('date_end');

    if (!bankAccountId || !dateStart || !dateEnd) {
      return NextResponse.json(
        { error: 'bank_account_id, date_start e date_end são obrigatórios' },
        { status: 400 }
      );
    }

    // Usar a função PostgreSQL criada anteriormente
    const { data, error } = await supabase.rpc('get_reconciled_transactions_count', {
      p_bank_account_id: bankAccountId,
      p_date_start: dateStart,
      p_date_end: dateEnd
    });

    if (error) {
      console.error('Erro ao obter estatísticas:', error);
      return NextResponse.json(
        { error: 'Erro interno ao obter estatísticas' },
        { status: 500 }
      );
    }

    // A função retorna um array, pegar o primeiro item
    const stats = data && data.length > 0 ? data[0] : {
      total_transactions: 0,
      reconciled_transactions: 0,
      pending_transactions: 0,
      reconciliation_rate: 0
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erro na API de estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
