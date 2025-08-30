// =========================================================
// API: TRANSAÇÕES PENDENTES
// Endpoint para buscar transações pendentes usando a view otimizada
// =========================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const bankAccountId = searchParams.get('bank_account_id');
    const limit = searchParams.get('limit');

    // Consultar a view criada anteriormente
    let query = supabase
      .from('bank_transactions_pendentes_v2')
      .select('*')
      .order('posted_at', { ascending: false });

    // Filtrar por conta bancária se especificado
    if (bankAccountId) {
      query = query.eq('bank_account_id', bankAccountId);
    }

    // Aplicar limite se especificado
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar transações pendentes:', error);
      return NextResponse.json(
        { error: 'Erro interno ao buscar transações' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Erro na API de transações pendentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
