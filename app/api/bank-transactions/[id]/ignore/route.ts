// =========================================================
// API: MARCAR TRANSAÇÃO COMO IGNORADA
// Endpoint para marcar uma transação como ignorada
// =========================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const transactionId = params.id;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar o status para ignorado
    const { error } = await supabase
      .from('bank_transactions')
      .update({ 
        status_conciliacao: 'ignorado'
      })
      .eq('id', transactionId);

    if (error) {
      console.error('Erro ao marcar como ignorada:', error);
      return NextResponse.json(
        { error: 'Erro interno ao atualizar status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro na API de ignorar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
