import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/reconciliation/suggestions-test iniciado');
    
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bank_account_id');
    const periodStart = searchParams.get('period_start');
    const periodEnd = searchParams.get('period_end');
    const empresaId = searchParams.get('empresa_id');

    if (!bankAccountId || !periodStart || !periodEnd || !empresaId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    console.log('📊 Parâmetros:', { bankAccountId, periodStart, periodEnd, empresaId });

    // Teste simples - apenas buscar transações bancárias
    console.log('🔍 Testando busca de transações bancárias...');
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', bankAccountId)
      .eq('empresa_id', empresaId)
      .limit(5);

    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return NextResponse.json(
        { error: 'Erro ao buscar transações bancárias', details: bankError },
        { status: 500 }
      );
    }

    console.log(`✅ Transações bancárias encontradas: ${bankTransactions?.length || 0}`);

    // Teste simples - apenas buscar lançamentos
    console.log('🔍 Testando busca de lançamentos...');
    const { data: systemTransactions, error: systemError } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('empresa_id', empresaId)
      .limit(5);

    if (systemError) {
      console.error('❌ Erro ao buscar lançamentos:', systemError);
      return NextResponse.json(
        { error: 'Erro ao buscar lançamentos do sistema', details: systemError },
        { status: 500 }
      );
    }

    console.log(`✅ Lançamentos encontrados: ${systemTransactions?.length || 0}`);

    return NextResponse.json({
      success: true,
      message: 'Teste concluído com sucesso',
      bank_transactions_count: bankTransactions?.length || 0,
      system_transactions_count: systemTransactions?.length || 0,
      bank_transactions: bankTransactions || [],
      system_transactions: systemTransactions || []
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
