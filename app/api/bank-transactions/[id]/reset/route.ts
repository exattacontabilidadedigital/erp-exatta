// =========================================================
// API: RESETAR STATUS DA TRANSAÇÃO
// Endpoint para resetar o status de uma transação para pendente
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

    // Atualizar o status para pendente
    const { error } = await supabase
      .from('bank_transactions')
      .update({ 
        status_conciliacao: 'pendente'
      })
      .eq('id', transactionId);

    if (error) {
      console.error('Erro ao resetar status:', error);
      return NextResponse.json(
        { error: 'Erro interno ao atualizar status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro na API de resetar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
