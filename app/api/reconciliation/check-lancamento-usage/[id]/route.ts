import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  try {
    console.log('🔍 API: Verificando uso do lançamento (método simplificado):', id);

    // Buscar apenas na transaction_matches sem JOIN
    const { data: matches, error } = await supabase
      .from('transaction_matches')
      .select('id, bank_transaction_id, system_transaction_id, status, match_type, confidence_level, created_at')
      .eq('system_transaction_id', id);

    if (error) {
      console.error('❌ Erro ao verificar uso do lançamento:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    console.log('✅ Verificação concluída. Matches encontrados:', matches?.length || 0);

    if (matches && matches.length > 0) {
      const activeMatch = matches[0];
      
      // Se há match, buscar a bank_transaction separadamente para evitar JOIN
      const { data: bankTransaction, error: bankError } = await supabase
        .from('bank_transactions')
        .select('id, reconciliation_status, status_conciliacao, memo, payee, amount, posted_at, fit_id')
        .eq('id', activeMatch.bank_transaction_id)
        .single();

      if (bankError) {
        console.warn('⚠️ Erro ao buscar bank_transaction:', bankError.message);
        // Retornar informação básica mesmo sem bank_transaction
        return NextResponse.json({
          isInUse: true,
          starColor: 'orange',
          status: 'processamento',
          matchType: activeMatch.match_type,
          matchStatus: activeMatch.status,
          matchId: activeMatch.id,
          message: 'Lançamento em uso (detalhes indisponíveis)'
        });
      }

      // Determinar cor da estrela baseada no status
      let starColor = 'orange';
      const reconciliationStatus = bankTransaction?.reconciliation_status || 'processamento';
      
      switch (reconciliationStatus) {
        case 'conciliado':
          starColor = 'green';
          break;
        case 'transferencia':
          starColor = 'blue';
          break;
        case 'sugestao':
        case 'sugerido':
        default:
          starColor = 'orange';
          break;
      }
      
      console.log(`✅ Lançamento em uso - Status: ${reconciliationStatus}, Cor: ${starColor}`);
      
      return NextResponse.json({
        isInUse: true,
        starColor,
        status: reconciliationStatus,
        statusConciliacao: bankTransaction?.status_conciliacao,
        matchType: activeMatch.match_type,
        matchStatus: activeMatch.status,
        matchId: activeMatch.id,
        bankTransaction: bankTransaction,
        message: `Lançamento já está sendo usado como ${getStatusMessage(reconciliationStatus, bankTransaction?.status_conciliacao)}`
      });
    }

    return NextResponse.json({
      isInUse: false,
      status: 'disponivel',
      message: 'Lançamento disponível para uso'
    });

  } catch (error) {
    console.error('❌ Erro geral na API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Função auxiliar para obter mensagem do status
function getStatusMessage(reconciliationStatus: string, statusConciliacao?: string): string {
  if (statusConciliacao === 'conciliado') {
    return 'conciliação confirmada';
  }
  
  switch (reconciliationStatus) {
    case 'sugerido':
      return 'sugestão';
    case 'transferencia':
      return 'transferência';
    default:
      return 'processamento';
  }
}
