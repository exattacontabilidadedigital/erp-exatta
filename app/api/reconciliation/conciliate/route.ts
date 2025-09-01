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

    console.log('🔗 Processando conciliação:', {
      bank_transaction_id,
      system_transaction_id,
      confidence_level,
      rule_applied
    });

    // Se não há system_transaction_id, é uma transação "sem correspondência"
    if (!system_transaction_id) {
      console.log('🚫 Marcando transação como sem correspondência');
      
      // Apenas atualizar status da transação bancária
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({ 
          reconciliation_status: 'ignored',
          status_conciliacao: 'ignorado',
          matched_lancamento_id: null,
          match_confidence: null
        })
        .eq('id', bank_transaction_id);

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

    // Verificar se já existe um match para esta combinação específica
    const { data: existingMatch } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bank_transaction_id)
      .eq('system_transaction_id', system_transaction_id)
      .single();

    if (existingMatch) {
      // Atualizar match existente
      const { data, error } = await supabase
        .from('transaction_matches')
        .update({
          system_transaction_id,
          match_score: confidence_level === '100%' ? 1.0 : 
                      confidence_level === 'provavel' ? 0.8 : 0.5,
          match_type: confidence_level === 'manual' ? 'manual' : 'automatic',
          confidence_level: 'high',
          status: 'confirmed',
          notes: `Conciliação ${confidence_level} - Regra: ${rule_applied}`
        })
        .eq('id', existingMatch.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar match:', error);
        return NextResponse.json(
          { error: 'Erro ao atualizar conciliação' },
          { status: 500 }
        );
      }

      console.log('✅ Match atualizado:', data.id);
    } else {
      // Criar novo match
      const { data, error } = await supabase
        .from('transaction_matches')
        .insert({
          bank_transaction_id,
          system_transaction_id,
          match_score: confidence_level === '100%' ? 1.0 : 
                      confidence_level === 'provavel' ? 0.8 : 0.5,
          match_type: confidence_level === 'manual' ? 'manual' : 'automatic',
          confidence_level: 'high',
          status: 'confirmed',
          notes: `Conciliação ${confidence_level} - Regra: ${rule_applied}`
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar match:', error);
        return NextResponse.json(
          { error: 'Erro ao criar conciliação' },
          { status: 500 }
        );
      }

      console.log('✅ Match criado:', data.id);
    }

    // Atualizar status da transação bancária
    // reconciliation_status: 'matched' = conciliada, 'pending' = pendente, 'ignored' = sem correspondência
    const confidenceValue = confidence_level === '100%' ? 1.0 : 
                            confidence_level === 'high' ? 0.9 :
                            confidence_level === 'provavel' ? 0.8 : 
                            confidence_level === 'manual' ? 1.0 : 0.5;
    
    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({ 
        reconciliation_status: 'matched',
        status_conciliacao: 'conciliado',
        matched_lancamento_id: system_transaction_id,
        match_confidence: confidenceValue
      })
      .eq('id', bank_transaction_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar transação bancária:', updateError);
    }

    // Atualizar status_conciliacao da transação do sistema
    // Nota: A tabela 'lancamentos' não possui campo específico para status de conciliação
    // O status de conciliação é gerenciado pela tabela 'bank_transactions' e 'transaction_matches'
    console.log('✅ Status do sistema será gerenciado via transaction_matches');

    return NextResponse.json({ 
      success: true, 
      message: 'Conciliação realizada com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de conciliação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
