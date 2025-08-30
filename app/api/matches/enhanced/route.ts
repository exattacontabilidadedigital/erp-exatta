// =========================================================
// API: MATCHES APRIMORADOS
// Endpoint para criar matches usando a nova tabela transaction_matches_enhanced
// =========================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      bank_transaction_id,
      system_transaction_id,
      match_score,
      match_type,
      reconciliation_session_id,
      confidence_level,
      status,
      notes
    } = await request.json();

    if (!bank_transaction_id || !system_transaction_id) {
      return NextResponse.json(
        { error: 'bank_transaction_id e system_transaction_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar o match na tabela aprimorada
    const { data, error } = await supabase
      .from('transaction_matches_enhanced')
      .insert({
        bank_transaction_id,
        system_transaction_id,
        match_score: match_score || 0,
        match_type: match_type || 'manual',
        reconciliation_session_id,
        confidence_level: confidence_level || 'medium',
        status: status || 'pending',
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar match aprimorado:', error);
      return NextResponse.json(
        { error: 'Erro interno ao criar match' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, match: data });

  } catch (error) {
    console.error('Erro na API de matches aprimorados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const bankTransactionId = searchParams.get('bank_transaction_id');
    const reconciliationSessionId = searchParams.get('reconciliation_session_id');

    let query = supabase
      .from('transaction_matches_enhanced')
      .select('*')
      .order('created_at', { ascending: false });

    if (bankTransactionId) {
      query = query.eq('bank_transaction_id', bankTransactionId);
    }

    if (reconciliationSessionId) {
      query = query.eq('reconciliation_session_id', reconciliationSessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar matches:', error);
      return NextResponse.json(
        { error: 'Erro interno ao buscar matches' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Erro na API de buscar matches:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
