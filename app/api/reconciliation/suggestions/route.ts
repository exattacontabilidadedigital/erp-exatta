import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { MatchingEngine, MatchingRule } from '@/lib/matching-engine';

// Regras padrão para quando não há regras configuradas no banco
function getDefaultMatchingRules(): MatchingRule[] {
  return [
    {
      id: 'default-valor-data',
      nome: 'Valor e Data com Tolerância',
      tipo: 'valor_data',
      parametros: {
        tolerancia_valor: 2, // 2% de tolerância no valor
        tolerancia_dias: 3   // 3 dias de tolerância na data
      },
      peso: 8,
      ativa: true
    },
    {
      id: 'default-descricao',
      nome: 'Similaridade de Descrição',
      tipo: 'descricao',
      parametros: {
        similaridade_minima: 75 // 75% de similaridade mínima
      },
      peso: 7,
      ativa: true
    }
  ];
}

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
    const includeReconciled = searchParams.get('include_reconciled') === 'true';

    if (!bankAccountId || !periodStart || !periodEnd || !empresaId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    console.log('📊 Parâmetros:', { bankAccountId, periodStart, periodEnd, empresaId, includeReconciled });

    // Buscar transações bancárias (com ou sem conciliadas)
    console.log('🔍 Buscando transações bancárias...');
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', bankAccountId)
      .eq('empresa_id', empresaId)
      .gte('posted_at', periodStart)
      .lte('posted_at', periodEnd);

    // Se includeReconciled for false, filtrar apenas pending
    // Se for true, incluir pending, matched e ignored
    if (includeReconciled) {
      query = query.in('reconciliation_status', ['pending', 'matched', 'ignored']);
    } else {
      query = query.eq('reconciliation_status', 'pending');
    }

    const { data: bankTransactions, error: bankError } = await query
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

    // Buscar matches existentes para considerar no status
    console.log('🔍 Verificando matches existentes...');
    const { data: existingMatches, error: matchesError } = await supabase
      .from('transaction_matches')
      .select('*')
      .in('bank_transaction_id', bankTransactions?.map(bt => bt.id) || []);

    if (matchesError) {
      console.error('❌ Erro ao buscar matches existentes:', matchesError);
    } else {
      console.log(`📋 Matches existentes encontrados: ${existingMatches?.length || 0}`);
    }

    // Criar um mapa de matches existentes para lookup rápido
    const existingMatchesMap = new Map();
    existingMatches?.forEach(match => {
      existingMatchesMap.set(match.bank_transaction_id, match);
    });

    // Buscar regras de matching (ou usar regras padrão)
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
        matchingRules = getDefaultMatchingRules();
      } else {
        matchingRules = rules && rules.length > 0 ? rules : getDefaultMatchingRules();
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar regras de matching (usando regras padrão):', error);
      matchingRules = getDefaultMatchingRules();
    }

    console.log(`🎯 Regras de matching aplicadas: ${matchingRules.length}`);
    matchingRules.forEach((rule: MatchingRule) => {
      console.log(`   - ${rule.nome} (${rule.tipo}) - Peso: ${rule.peso}`);
    });

    // Executar algoritmo de matching
    console.log('🔍 Iniciando algoritmo de matching na API...');
    console.log('📊 Dados para matching:', {
      bankTransactionsCount: bankTransactions?.length || 0,
      systemTransactionsCount: systemTransactions?.length || 0,
      sampleBankTxn: bankTransactions?.[0],
      sampleSystemTxn: systemTransactions?.[0]
    });

    const matchingEngine = new MatchingEngine(matchingRules || []);
    
    const matchResults = await matchingEngine.processMatching(
      bankTransactions || [],
      systemTransactions || []
    );
    
    console.log(`✅ Matching API concluído: ${matchResults.length} resultados`);
    console.log('📋 Sample result:', matchResults[0]);

    // Atualizar status baseado em matches existentes
    console.log('🔄 Aplicando status de matches existentes...');
    matchResults.forEach((result: any) => {
      const existingMatch = existingMatchesMap.get(result.bankTransaction.id);
      if (existingMatch) {
        console.log(`📌 Match existente encontrado para transação ${result.bankTransaction.id}:`, {
          status: existingMatch.status,
          confidence: existingMatch.confidence_level
        });
        
        // Atualizar status baseado no match existente
        if (existingMatch.status === 'confirmed') {
          result.status = 'conciliado';
        } else if (existingMatch.status === 'rejected') {
          result.status = 'rejeitado';
        } else if (existingMatch.status === 'suggested') {
          result.status = 'sugerido';
        }
        
        // Também atualizar outras propriedades relevantes
        result.matchScore = Math.round((existingMatch.match_score || 0) * 100);
        result.confidenceLevel = existingMatch.confidence_level || result.confidenceLevel;
      } else {
        // Se não há match existente, verificar se é uma transferência desconciliada
        const isTransfer = result.bankTransaction?.memo?.toUpperCase().includes('TRANSFER') || 
                          result.bankTransaction?.payee?.toUpperCase().includes('TRANSFER') ||
                          result.bankTransaction?.transaction_type === 'TRANSFER';
        
        if (isTransfer && result.bankTransaction?.reconciliation_status === 'pending') {
          console.log(`🔄 Transferência desconciliada detectada para transação ${result.bankTransaction.id}`);
          result.status = 'transferencia';
        }
      }
    });

    console.log('✅ Status atualizado baseado em matches existentes');

    // Gerar resumo
    const summary = matchingEngine.generateSummary(matchResults);
    console.log('📊 Summary gerado:', summary);

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

    // Salvar matches no banco de dados (apenas os que têm system_transaction_id)
    if (reconciliationSession) {
      const matchesToInsert = matchResults
        .filter(result => result.systemTransaction?.id) // Filtrar apenas matches com system_transaction_id
        .map(result => {
          // Usar lógica baseada na estrutura da tabela:
          // - 'confirmed' para matches exatos com alta confiança
          // - 'suggested' para outros matches automáticos
          const dbStatus = (result.confidenceLevel === 'high' && result.matchScore >= 95) 
            ? 'confirmed' 
            : 'suggested';

          return {
            reconciliation_id: reconciliationSession.id,
            bank_transaction_id: result.bankTransaction.id,
            system_transaction_id: result.systemTransaction!.id, // Garantido que existe pelo filter
            match_score: result.matchScore / 100, // Converter de 0-100 para 0.00-1.00
            match_type: result.matchType === 'manual' ? 'manual' : 'automatic',
            confidence_level: result.confidenceLevel,
            status: dbStatus,
            notes: result.matchReason
          };
        });

      console.log(`💾 Salvando ${matchesToInsert.length} matches válidos (de ${matchResults.length} totais)`);

      if (matchesToInsert.length > 0) {
        const { error: matchesError } = await supabase
          .from('transaction_matches')
          .upsert(matchesToInsert, { 
            onConflict: 'bank_transaction_id,system_transaction_id' 
          });

        if (matchesError) {
          console.error('❌ Erro ao salvar matches:', matchesError);
        } else {
          console.log('✅ Matches salvos com sucesso');
        }
      } else {
        console.log('ℹ️ Nenhum match válido para salvar');
      }
    }

    console.log('✅ Sugestões geradas com sucesso');

    // Converter matchResults para o formato esperado pelo frontend (pairs)
    const formattedPairs = matchResults.map((result, index) => {
      // Gerar ID único para cada pair combinando bank_transaction_id + system_transaction_id + index
      const uniqueId = result.systemTransaction 
        ? `${result.bankTransaction.id}_${result.systemTransaction.id}`
        : `${result.bankTransaction.id}_no_match_${index}`;
      
      return {
        id: uniqueId,
        bankTransaction: result.bankTransaction,
        systemTransaction: result.systemTransaction || null,
        systemTransactions: result.systemTransactions || [],
        status: result.status,
        matchScore: result.matchScore,
        matchReason: result.matchReason,
        confidenceLevel: result.confidenceLevel,
        matchType: result.matchType
      };
    });

    console.log('🔄 Dados formatados para frontend:', {
      originalResultsCount: matchResults.length,
      formattedPairsCount: formattedPairs.length,
      sampleFormatted: formattedPairs[0]
    });

    return NextResponse.json({
      success: true,
      reconciliation_id: reconciliationSession?.id,
      pairs: formattedPairs,
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
