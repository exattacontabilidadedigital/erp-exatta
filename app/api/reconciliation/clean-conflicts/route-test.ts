import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 API clean-conflicts chamada');
    
    const { empresa_id, bank_account_id } = await request.json();

    console.log('📥 Parâmetros recebidos:', {
      empresa_id,
      bank_account_id
    });

    // Teste simples - apenas retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'API funcionando - teste simples',
      conflicts_cleaned: 0,
      received_params: { empresa_id, bank_account_id }
    });

  } catch (error) {
    console.error('❌ Erro interno na limpeza de conflitos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
