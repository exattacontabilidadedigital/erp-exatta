import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Configuração do Supabase - Usar chave pública como nas outras APIs funcionais
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔍 Verificando configuração do Supabase:');
    console.log('URL:', supabaseUrl ? 'DEFINIDA' : 'INDEFINIDA');
    console.log('ANON_KEY:', supabaseKey ? 'DEFINIDA' : 'INDEFINIDA');

    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL não definida');
      return NextResponse.json(
        { error: 'supabaseUrl is required' },
        { status: 500 }
      );
    }

    if (!supabaseKey) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não definida');
      return NextResponse.json(
        { error: 'supabaseKey is required' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { 
      bank_transaction_id, 
      system_transaction_ids, 
      primary_transaction_id, // 🎯 Novo campo
      reconciliation_status, // ✅ CORREÇÃO: usar reconciliation_status (nome correto da coluna)
      match_type,
      confidence_level,
      has_discrepancy,
      total_value,
      closeModal = true // Flag para controlar se deve fechar o modal
    } = await request.json();

    console.log('🎯 API Create Suggestion - Dados recebidos:', {
      bank_transaction_id,
      system_transaction_ids,
      primary_transaction_id, // 🎯 Novo campo
      reconciliation_status, // ✅ CORREÇÃO: usar reconciliation_status (nome correto da coluna)
      match_type,
      confidence_level,
      has_discrepancy,
      total_value,
      closeModal
    });

    // Validações básicas
    if (!bank_transaction_id || !system_transaction_ids || !Array.isArray(system_transaction_ids)) {
      return NextResponse.json(
        { error: 'bank_transaction_id e system_transaction_ids são obrigatórios' }, 
        { status: 400 }
      );
    }

    if (system_transaction_ids.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um lançamento deve ser selecionado' }, 
        { status: 400 }
      );
    }

    // Determinar se é sugestão ou transferência baseado nas regras
    let finalStatus = reconciliation_status; // ✅ CORREÇÃO: usar reconciliation_status correto
    let finalMatchType = match_type || 'manual';
    
    // Verificar se é transferência (mesmo valor, sem discrepância)
    if (!has_discrepancy && system_transaction_ids.length === 1) {
      // Buscar valor da transação bancária
      const { data: bankTransaction } = await supabase
        .from('bank_transactions')
        .select('amount')
        .eq('id', bank_transaction_id)
        .single();
      
      // Buscar valor do lançamento
      const { data: systemTransaction } = await supabase
        .from('lancamentos')
        .select('valor')
        .eq('id', system_transaction_ids[0])
        .single();
        
      if (bankTransaction && systemTransaction) {
        const bankAmount = Math.abs(parseFloat(bankTransaction.amount));
        const systemAmount = Math.abs(parseFloat(systemTransaction.valor));
        const difference = Math.abs(bankAmount - systemAmount);
        
        // Se diferença é menor que 0.01, é transferência
        if (difference < 0.01) {
          finalStatus = 'transferencia';
          finalMatchType = 'automatic'; // ✅ CORREÇÃO: usar valor permitido pela constraint
          console.log('🔄 Detectada transferência exata: diferença =', difference);
        } else {
          finalStatus = 'sugerido';
          finalMatchType = 'suggested'; // ✅ CORREÇÃO: usar valor permitido pela constraint
          console.log('💡 Criada sugestão com discrepância: diferença =', difference);
        }
      }
    } else {
      // Múltiplos lançamentos ou com discrepância = sugestão
      finalStatus = 'sugerido';
      finalMatchType = 'suggested'; // ✅ CORREÇÃO: usar valor permitido pela constraint
      console.log('💡 Criada sugestão (múltiplos lançamentos ou discrepância)');
    }

    // 1. Atualizar bank_transactions com o status final determinado
    console.log(`1️⃣ Atualizando bank_transactions para status: ${finalStatus}...`);
    const { data: updateResult, error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: finalStatus, // ✅ CORREÇÃO: usar reconciliation_status conforme estrutura real
        updated_at: new Date().toISOString()
      })
      .eq('id', bank_transaction_id)
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar bank_transactions:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status da transação bancária', details: updateError.message }, 
        { status: 500 }
      );
    }

    console.log('✅ bank_transactions atualizada:', updateResult);

    // 2. Limpar registros anteriores em transaction_matches para esta transação bancária
    console.log('2️⃣ Limpando matches anteriores...');
    const { error: deleteError } = await supabase
      .from('transaction_matches')
      .delete()
      .eq('bank_transaction_id', bank_transaction_id);

    if (deleteError) {
      console.warn('⚠️ Erro ao limpar matches anteriores (continuando):', deleteError);
    }

    // 3. Criar novos registros em transaction_matches (versão simplificada)
    console.log('3️⃣ Criando novos matches...');
    const matchRecords = system_transaction_ids.map((system_transaction_id) => ({
      bank_transaction_id,
      system_transaction_id,
      status: finalStatus === 'transferencia' ? 'confirmed' : 'suggested',
      match_type: finalMatchType,
      confidence_level: finalStatus === 'transferencia' ? 'high' : (confidence_level || 'medium'),
      notes: `Primary: ${primary_transaction_id === system_transaction_id ? 'Yes' : 'No'}, Total: ${total_value}, Discrepancy: ${has_discrepancy}, Via: modal_selection`,
      created_at: new Date().toISOString()
    }));

    const { data: matchesResult, error: matchesError } = await supabase
      .from('transaction_matches')
      .insert(matchRecords)
      .select();

    if (matchesError) {
      console.error('❌ Erro ao criar transaction_matches:', matchesError);
      
      // Reverter alteração em bank_transactions
      await supabase
        .from('bank_transactions')
        .update({ 
          reconciliation_status: 'sem_match', // ✅ CORREÇÃO: usar reconciliation_status
          updated_at: new Date().toISOString()
        })
        .eq('id', bank_transaction_id);

      return NextResponse.json(
        { error: 'Erro ao criar matches de transação', details: matchesError.message }, 
        { status: 500 }
      );
    }

    console.log('✅ transaction_matches criados:', matchesResult);

    // 4. Verificar se foram criados corretamente
    const { data: verificationData, error: verificationError } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bank_transaction_id);

    if (verificationError) {
      console.warn('⚠️ Erro na verificação (não crítico):', verificationError);
    } else {
      console.log('🔍 Verificação - Matches criados:', verificationData);
    }

    // 5. Buscar dados completos dos lançamentos selecionados para retornar
    const { data: selectedTransactions, error: fetchError } = await supabase
      .from('lancamentos')
      .select(`
        *,
        plano_contas(nome),
        contas_bancarias(
          id, agencia, conta, digito,
          bancos(nome)
        )
      `)
      .in('id', system_transaction_ids);

    if (fetchError) {
      console.warn('⚠️ Erro ao buscar dados dos lançamentos (não crítico):', fetchError);
    }

    // 6. Resposta de sucesso
    return NextResponse.json({ 
      success: true, 
      message: `${finalStatus === 'transferencia' ? 'Transferência' : 'Sugestão'} criada com sucesso`,
      data: {
        bank_transaction_id,
        system_transaction_ids,
        final_status: finalStatus,
        match_type: finalMatchType,
        suggestion_count: system_transaction_ids.length,
        confidence_level: finalStatus === 'transferencia' ? 'high' : (confidence_level || 'medium'),
        has_discrepancy,
        matches_created: matchesResult?.length || 0,
        created_at: new Date().toISOString(),
        selected_transactions: selectedTransactions || [],
        closeModal,
        reconciliation_status: finalStatus
      }
    });

  } catch (error) {
    console.error('💥 Erro geral na API create-suggestion:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// Método para buscar sugestões existentes
export async function GET(request: NextRequest) {
  try {
    // Configuração do Supabase com verificação de variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuração do banco de dados não disponível' }, 
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { searchParams } = new URL(request.url);
    const bank_transaction_id = searchParams.get('bank_transaction_id');

    if (!bank_transaction_id) {
      return NextResponse.json(
        { error: 'bank_transaction_id é obrigatório' }, 
        { status: 400 }
      );
    }

    // Buscar sugestões existentes
    const { data, error } = await supabase
      .from('transaction_matches')
      .select(`
        *,
        system_transaction:lancamentos!system_transaction_id (
          id,
          descricao,
          valor,
          data_lancamento,
          tipo
        )
      `)
      .eq('bank_transaction_id', bank_transaction_id)
      .eq('status', 'suggested')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar sugestões:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar sugestões', details: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('💥 Erro geral na busca de sugestões:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
}
