import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// ✅ CORREÇÃO: Usar ANON KEY em vez de SERVICE ROLE KEY (que está inválida)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// ✅ CORREÇÃO: Usar ANON KEY para operações básicas de leitura
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lancamentoId = searchParams.get('id');

  try {
    console.log('🔍 Nova API: Verificando uso do lançamento (método simples):', lancamentoId);

    if (!lancamentoId) {
      return Response.json({ 
        success: false, 
        error: 'ID do lançamento é obrigatório' 
      }, { status: 400 });
    }

    // Abordagem 1: Buscar diretamente na transaction_matches pelo lancamento_id
    console.log('🔍 Buscando em transaction_matches onde lancamento_id =', lancamentoId);
    
    const { data: matchesWithLancamento, error: matchesError } = await supabase
      .from('transaction_matches')
      .select('id, bank_transaction_id, lancamento_id, status')
      .eq('lancamento_id', lancamentoId);

    if (matchesError) {
      console.error('❌ Erro ao buscar em transaction_matches:', matchesError);
      return Response.json({ 
        success: false, 
        error: matchesError.message,
        details: matchesError
      }, { status: 500 });
    }

    console.log('✅ Resultado da busca em transaction_matches:', matchesWithLancamento);

    // Se encontrou matches, o lançamento está em uso
    if (matchesWithLancamento && matchesWithLancamento.length > 0) {
      console.log('🚫 Lançamento está em uso em', matchesWithLancamento.length, 'matches');
      
      return Response.json({
        success: true,
        inUse: true,
        usageCount: matchesWithLancamento.length,
        matches: matchesWithLancamento
      });
    }

    // Se não encontrou, o lançamento não está em uso
    console.log('✅ Lançamento não está em uso');
    
    return Response.json({
      success: true,
      inUse: false,
      usageCount: 0,
      matches: []
    });

  } catch (error) {
    console.error('❌ Erro geral na nova API:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
