// =========================================================
// API: VERIFICAÇÃO DE DUPLICATAS
// Endpoint para verificar transações duplicadas por FIT_ID
// =========================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { fit_ids, bank_statement_id } = await request.json();

    if (!fit_ids || !Array.isArray(fit_ids)) {
      return NextResponse.json(
        { error: 'fit_ids é obrigatório e deve ser um array' },
        { status: 400 }
      );
    }

    if (!bank_statement_id) {
      return NextResponse.json(
        { error: 'bank_statement_id é obrigatório' },
        { status: 400 }
      );
    }

    // Usar a função PostgreSQL criada anteriormente
    const { data, error } = await supabase.rpc('check_duplicate_transactions_by_fit_id', {
      p_fit_ids: fit_ids,
      p_bank_statement_id: bank_statement_id
    });

    if (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return NextResponse.json(
        { error: 'Erro interno ao verificar duplicatas' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Erro na API de verificação de duplicatas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
