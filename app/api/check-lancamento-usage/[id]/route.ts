import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  try {
    console.log('🔍 API REAL: Verificando uso do lançamento:', id);

    // Buscar apenas na bank_transactions onde matched_lancamento_id = id
    const { data: matches, error } = await supabase
      .from('bank_transactions')
      .select('id, reconciliation_status, matched_lancamento_id, status_conciliacao, memo, payee, amount, posted_at')
      .eq('matched_lancamento_id', id);

    if (error) {
      console.error('❌ Erro ao verificar uso do lançamento:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        inUse: false
      }, { status: 500 });
    }

    console.log(`✅ Verificação concluída. Matches encontrados para ${id}:`, matches?.length || 0);
    console.log('📊 Detalhes dos matches:', matches);

    if (matches && matches.length > 0) {
      const activeMatch = matches[0];
      
      // Determinar cor da estrela baseado no status real
      let starColor = 'yellow'; // default
      let status = activeMatch.reconciliation_status || 'usado';
      
      switch (activeMatch.reconciliation_status) {
        case 'conciliado':
          starColor = 'green';
          break;
        case 'transferencia':
          starColor = 'blue';
          break;
        case 'sugerido':
          starColor = 'orange';
          break;
        default:
          starColor = 'yellow';
      }

      const result = {
        success: true,
        inUse: true,
        starColor,
        status,
        bankTransactionDetails: {
          id: activeMatch.id,
          amount: activeMatch.amount,
          memo: activeMatch.memo,
          payee: activeMatch.payee,
          posted_at: activeMatch.posted_at,
          reconciliation_status: activeMatch.reconciliation_status,
          status_conciliacao: activeMatch.status_conciliacao
        }
      };

      console.log(`⭐ Lançamento ${id} está em uso:`, result);
      return NextResponse.json(result);
    } else {
      console.log(`✅ Lançamento ${id} NÃO está em uso (não encontrado em bank_transactions)`);
      return NextResponse.json({
        success: true,
        inUse: false,
        message: 'Lançamento não está sendo usado em nenhuma conciliação'
      });
    }
    
  } catch (error) {
    console.error('❌ API REAL: Erro:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      inUse: false
    }, { status: 500 });
  }
}
