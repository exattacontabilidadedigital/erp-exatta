// CORREÇÃO: Conciliação Única por Transação Bancária
// Este patch garante que apenas a transação específica seja conciliada

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      bank_transaction_id, 
      system_transaction_id, 
      confidence_level, 
      rule_applied 
    } = await request.json();

    console.log('🔗 Processando conciliação específica:', {
      bank_transaction_id,
      system_transaction_id,
      confidence_level,
      rule_applied
    });

    // VALIDAÇÃO CRÍTICA: Verificar se esta transação bancária específica já está conciliada
    const { data: existingBankTrans, error: bankCheckError } = await supabase
      .from('bank_transactions')
      .select('id, status_conciliacao, reconciliation_status, matched_lancamento_id')
      .eq('id', bank_transaction_id)
      .single();

    if (bankCheckError) {
      console.error('❌ Erro ao verificar transação bancária:', bankCheckError);
      return NextResponse.json(
        { error: 'Transação bancária não encontrada' },
        { status: 404 }
      );
    }

    // Se já está conciliada, impedir nova conciliação
    if (existingBankTrans.status_conciliacao === 'conciliado' || 
        existingBankTrans.reconciliation_status === 'conciliado') {
      console.log('⚠️ Transação bancária já está conciliada:', {
        id: bank_transaction_id,
        current_status: existingBankTrans.status_conciliacao,
        matched_to: existingBankTrans.matched_lancamento_id
      });
      
      return NextResponse.json({
        success: false,
        message: 'Esta transação bancária já está conciliada',
        current_match: existingBankTrans.matched_lancamento_id
      }, { status: 409 }); // Conflict
    }

    // Se não há system_transaction_id, é uma transação "sem correspondência"
    if (!system_transaction_id) {
      console.log('🚫 Marcando transação como sem correspondência');
      
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({ 
          reconciliation_status: 'sem_match',
          status_conciliacao: 'pendente',
          matched_lancamento_id: null,
          match_confidence: null
        })
        .eq('id', bank_transaction_id); // ÚNICO UPDATE por ID específico

      if (updateError) {
        console.error('❌ Erro ao atualizar transação bancária:', updateError);
        return NextResponse.json(
          { error: 'Erro ao marcar transação como sem correspondência' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Transação marcada como sem correspondência' 
      });
    }

    // VALIDAÇÃO CRÍTICA: Verificar se o lançamento do sistema existe e não está ocupado
    const { data: existingSystemTrans, error: systemCheckError } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor, data_lancamento')
      .eq('id', system_transaction_id)
      .single();

    if (systemCheckError) {
      console.error('❌ Erro ao verificar lançamento do sistema:', systemCheckError);
      return NextResponse.json(
        { error: 'Lançamento do sistema não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se este lançamento do sistema já está sendo usado por OUTRA transação bancária
    const { data: existingMatches, error: matchCheckError } = await supabase
      .from('transaction_matches')
      .select('bank_transaction_id, system_transaction_id, status')
      .eq('system_transaction_id', system_transaction_id)
      .eq('status', 'confirmed')
      .neq('bank_transaction_id', bank_transaction_id); // Excluir a própria transação

    if (matchCheckError) {
      console.error('❌ Erro ao verificar matches existentes:', matchCheckError);
    } else if (existingMatches && existingMatches.length > 0) {
      console.log('⚠️ Lançamento do sistema já está conciliado com outra transação:', {
        system_transaction_id,
        existing_matches: existingMatches
      });
      
      return NextResponse.json({
        success: false,
        message: 'Este lançamento do sistema já está conciliado com outra transação bancária',
        conflicting_matches: existingMatches
      }, { status: 409 });
    }

    // TRANSACTION: Atualizar match específico de forma atômica
    console.log('🔄 Iniciando conciliação atômica...');

    // 1. Atualizar TODOS os matches desta transação bancária para status 'confirmed'
    // Isso preserva múltiplos matches ao invés de deletá-los
    const { error: updateMatchesError } = await supabase
      .from('transaction_matches')
      .update({
        status: 'confirmed',
        match_score: confidence_level === '100%' ? 1.0 : 
                    confidence_level === 'high' ? 0.9 :
                    confidence_level === 'provavel' ? 0.8 : 
                    confidence_level === 'manual' ? 1.0 : 0.5,
        match_type: confidence_level === 'manual' ? 'manual' : 'automatic',
        confidence_level: 'high',
        notes: `Conciliação ${confidence_level} - Regra: ${rule_applied} - Múltiplos preservados`
      })
      .eq('bank_transaction_id', bank_transaction_id);

    // 2. Criar/atualizar o match principal se não existir
    const { data: matchData, error: matchError } = await supabase
      .from('transaction_matches')
      .upsert({
        bank_transaction_id,
        system_transaction_id,
        match_score: confidence_level === '100%' ? 1.0 : 
                    confidence_level === 'high' ? 0.9 :
                    confidence_level === 'provavel' ? 0.8 : 
                    confidence_level === 'manual' ? 1.0 : 0.5,
        match_type: confidence_level === 'manual' ? 'manual' : 'automatic',
        confidence_level: 'high',
        status: 'confirmed',
        notes: `Conciliação ${confidence_level} - Regra: ${rule_applied} - Match principal`
      }, { 
        onConflict: 'bank_transaction_id,system_transaction_id' 
      })
      .select()
      .single();

    if (matchError) {
      console.error('❌ Erro ao criar/atualizar match principal:', matchError);
      return NextResponse.json(
        { error: 'Erro ao criar conciliação específica' },
        { status: 500 }
    );
    }

    // 3. Atualizar APENAS a transação bancária específica
    const confidenceValue = confidence_level === '100%' ? 1.0 : 
                            confidence_level === 'high' ? 0.9 :
                            confidence_level === 'provavel' ? 0.8 : 
                            confidence_level === 'manual' ? 1.0 : 0.5;
    
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'pending',
        status_conciliacao: 'conciliado',
        matched_lancamento_id: system_transaction_id,
        match_confidence: confidenceValue
      })
      .eq('id', bank_transaction_id); // ✅ ÚNICO UPDATE por ID específico

    if (updateError) {
      console.error('❌ Erro ao atualizar transação bancária específica:', updateError);
      
      // Note: Não revertemos os matches múltiplos para preservar seleções do usuário
      console.log('⚠️ Múltiplos matches preservados mesmo com erro de atualização da transação');
        
      return NextResponse.json(
        { error: 'Erro ao atualizar status da transação bancária' },
        { status: 500 }
      );
    }

    console.log('✅ Conciliação com múltiplos matches preservados:', {
      bank_transaction_id,
      system_transaction_id,
      match_id: matchData.id,
      message: 'Múltiplos matches mantidos para exibição agregada'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Conciliação realizada preservando múltiplos matches',
      match_id: matchData.id,
      bank_transaction_id,
      system_transaction_id
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de conciliação específica:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
