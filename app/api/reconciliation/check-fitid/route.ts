import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { fitId, currentBankTransactionId, currentSystemTransactionId } = await request.json();

    console.log('🔍 Verificando FITID duplicado:', {
      fitId,
      currentBankTransactionId,
      currentSystemTransactionId
    });

    if (!fitId) {
      return NextResponse.json({ alreadyReconciled: false });
    }

    // Verificar se existe alguma conciliação ativa com este FITID
    const { data: existingMatches, error: matchError } = await supabase
      .from('transaction_matches')
      .select(`
        id,
        bank_transaction_id,
        system_transaction_id,
        status,
        bank_transactions!inner(fit_id)
      `)
      .eq('bank_transactions.fit_id', fitId)
      .in('status', ['conciliado', 'pending', 'matched'])
      .neq('bank_transaction_id', currentBankTransactionId);

    if (matchError) {
      console.error('❌ Erro ao verificar FITID:', matchError);
      return NextResponse.json({ 
        error: 'Erro interno ao verificar duplicidade',
        details: matchError.message 
      }, { status: 500 });
    }

    const hasExistingMatch = existingMatches && existingMatches.length > 0;

    console.log('📊 Resultado verificação FITID:', {
      fitId,
      hasExistingMatch,
      existingMatches: existingMatches?.length || 0
    });

    if (hasExistingMatch) {
      return NextResponse.json({
        alreadyReconciled: true,
        existingMatch: {
          id: existingMatches[0].id,
          bank_transaction_id: existingMatches[0].bank_transaction_id,
          system_transaction_id: existingMatches[0].system_transaction_id,
          status: existingMatches[0].status
        }
      });
    }

    return NextResponse.json({ alreadyReconciled: false });

  } catch (error) {
    console.error('❌ Erro interno na verificação de FITID:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
