import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { MatchingEngine } from '@/lib/matching-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/reconciliation/suggestions iniciado');
    
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

    // Buscar transações bancárias não conciliadas
    console.log('🔍 Buscando transações bancárias...');
    const { data: bankTransactions, error: bankError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', bankAccountId)
      .eq('empresa_id', empresaId)
      .eq('reconciliation_status', 'pending')
      .gte('posted_at', periodStart)
      .lte('posted_at', periodEnd)
      .order('posted_at', { ascending: false });

    if (bankError) {
      console.error('❌ Erro ao buscar transações bancárias:', bankError);
      return NextResponse.json(
        { error: 'Erro ao buscar transações bancárias' },
        { status: 500 }
      );
    }

    console.log(`✅ Transações bancárias encontradas: ${bankTransactions?.length || 0}`);

    // Buscar lançamentos do sistema não conciliados
    console.log('🔍 Buscando lançamentos do sistema...');
    const { data: systemTransactions, error: systemError } = await supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas:plano_conta_id(nome),
        centro_custos:centro_custo_id(nome),
        conta_bancaria:conta_bancaria_id(
          id,
          agencia,
          conta,
          digito,
          banco_id,
          saldo_atual
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('status', 'pago')
      .gte('data_lancamento', periodStart)
      .lte('data_lancamento', periodEnd)
      .order('data_lancamento', { ascending: false });

    if (systemError) {
      console.error('❌ Erro ao buscar lançamentos:', systemError);
      return NextResponse.json(
        { error: 'Erro ao buscar lançamentos do sistema' },
        { status: 500 }
      );
    }

    console.log(`✅ Lançamentos do sistema encontrados: ${systemTransactions?.length || 0}`);

    console.log(`📈 Transações bancárias: ${bankTransactions?.length || 0}`);
    console.log(`📈 Lançamentos do sistema: ${systemTransactions?.length || 0}`);

    // Buscar regras de matching (opcional - pode não existir ainda)
    let matchingRules = [];
    try {
      const { data: rules, error: rulesError } = await supabase
        .from('matching_rules')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) {
        console.log('⚠️ Tabela matching_rules não existe ainda:', rulesError.message);
        matchingRules = [];
      } else {
        matchingRules = rules || [];
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar regras de matching (tabela pode não existir):', error);
      matchingRules = [];
    }

    // Executar algoritmo de matching
    console.log('🔍 Iniciando algoritmo de matching...');
    const matchingEngine = new MatchingEngine(matchingRules || []);
    
    const matchResults = await matchingEngine.processMatching(
      bankTransactions || [],
      systemTransactions || []
    );
    
    console.log(`✅ Matching concluído: ${matchResults.length} resultados`);

    // Gerar resumo
    const summary = matchingEngine.generateSummary(matchResults);

    // Buscar um usuário para usar como created_by
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);
    
    const userId = usuarios?.[0]?.id || null;

    // Criar ou buscar sessão de conciliação
    let reconciliationSession;
    const { data: existingSession } = await supabase
      .from('reconciliation_sessions')
      .select('*')
      .eq('bank_account_id', bankAccountId)
      .eq('empresa_id', empresaId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .eq('status', 'active')
      .single();

    if (existingSession) {
      reconciliationSession = existingSession;
    } else {
      const { data: newSession, error: sessionError } = await supabase
        .from('reconciliation_sessions')
        .insert({
          bank_account_id: bankAccountId,
          empresa_id: empresaId,
          period_start: periodStart,
          period_end: periodEnd,
          total_bank_transactions: bankTransactions?.length || 0,
          total_system_transactions: systemTransactions?.length || 0,
          matched_transactions: summary.conciliados,
          pending_transactions: summary.sem_match,
          ignored_transactions: 0,
          bank_total_debits: 0.00,
          bank_total_credits: 0.00,
          system_total_debits: 0.00,
          system_total_credits: 0.00,
          difference_amount: 0.00,
          status: 'active',
          auto_match_enabled: true,
          confidence_threshold: 0.80,
          created_by: userId
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Erro ao criar sessão de conciliação:', sessionError);
      } else {
        reconciliationSession = newSession;
      }
    }

    // Salvar matches no banco de dados
    if (reconciliationSession) {
      const matchesToInsert = matchResults.map(result => ({
        reconciliation_id: reconciliationSession.id,
        bank_transaction_id: result.bankTransaction.id,
        system_transaction_id: result.systemTransaction?.id || null,
        match_score: result.matchScore,
        match_type: result.matchType === 'manual' ? 'manual' : 'suggested',
        confidence_level: result.confidenceLevel,
        status: result.status,
        notes: result.matchReason
      }));

      const { error: matchesError } = await supabase
        .from('transaction_matches')
        .upsert(matchesToInsert, { 
          onConflict: 'bank_transaction_id,system_transaction_id' 
        });

      if (matchesError) {
        console.error('❌ Erro ao salvar matches:', matchesError);
      }
    }

    console.log('✅ Sugestões geradas com sucesso');

    return NextResponse.json({
      success: true,
      reconciliation_id: reconciliationSession?.id,
      pairs: matchResults,
      summary,
      bank_transactions: bankTransactions || [],
      system_transactions: systemTransactions || []
    });

  } catch (error) {
    console.error('❌ Erro ao gerar sugestões:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
