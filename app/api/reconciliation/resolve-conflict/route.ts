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
      resolution, 
      selected_transaction_id 
    } = await request.json();

    console.log('🔧 Resolvendo conflito:', {
      bank_transaction_id,
      resolution,
      selected_transaction_id
    });

    // Buscar matches existentes para esta transação bancária
    const { data: existingMatches } = await supabase
      .from('transaction_matches')
      .select('*')
      .eq('bank_transaction_id', bank_transaction_id);

    if (!existingMatches || existingMatches.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum match encontrado para resolver conflito' },
        { status: 404 }
      );
    }

    // Processar resolução baseada no tipo
    switch (resolution) {
      case 'select_transaction':
        // Manter apenas o match selecionado, remover os outros
        const matchesToKeep = existingMatches.filter(match => 
          match.system_transaction_id === selected_transaction_id
        );
        const matchesToRemove = existingMatches.filter(match => 
          match.system_transaction_id !== selected_transaction_id
        );

        // Remover matches não selecionados
        if (matchesToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('transaction_matches')
            .delete()
            .in('id', matchesToRemove.map(m => m.id));

          if (deleteError) {
            console.error('❌ Erro ao remover matches:', deleteError);
          }
        }

        // Atualizar match selecionado
        if (matchesToKeep.length > 0) {
          const { error: updateError } = await supabase
            .from('transaction_matches')
            .update({
              status: 'confirmed',
              match_type: 'manual',
              confidence_level: 'manual',
              notes: 'Conflito resolvido - seleção manual'
            })
            .eq('id', matchesToKeep[0].id);

          if (updateError) {
            console.error('❌ Erro ao atualizar match selecionado:', updateError);
          }
        }

        // Atualizar transação bancária
        await supabase
          .from('bank_transactions')
          .update({
            reconciliation_status: 'sugerido',          // Classificação: sugerido (resolvido manualmente)
            status_conciliacao: 'conciliado',           // Ação do usuário: conciliado
            matched_lancamento_id: selected_transaction_id,
            match_confidence: 'manual'
          })
          .eq('id', bank_transaction_id);

        break;

      case 'create_new':
        // Remover todos os matches existentes
        const { error: deleteAllError } = await supabase
          .from('transaction_matches')
          .delete()
          .eq('bank_transaction_id', bank_transaction_id);

        if (deleteAllError) {
          console.error('❌ Erro ao remover todos os matches:', deleteAllError);
        }

        // Marcar transação como sem match para criar novo lançamento
        await supabase
          .from('bank_transactions')
          .update({
            reconciliation_status: 'sem_match',         // Classificação: sem_match
            status_conciliacao: 'pendente',             // Ação do usuário: pendente
            matched_lancamento_id: null,
            match_confidence: null
          })
          .eq('id', bank_transaction_id);

        break;

      case 'ignore':
        // Marcar transação como ignorada
        await supabase
          .from('bank_transactions')
          .update({
            reconciliation_status: 'sem_match',         // Classificação: sem_match
            status_conciliacao: 'ignorado',             // Ação do usuário: ignorado
            matched_lancamento_id: null,
            match_confidence: null
          })
          .eq('id', bank_transaction_id);

        // Remover todos os matches
        await supabase
          .from('transaction_matches')
          .delete()
          .eq('bank_transaction_id', bank_transaction_id);

        break;
    }

    console.log('✅ Conflito resolvido com sucesso');
    return NextResponse.json({ 
      success: true, 
      message: 'Conflito resolvido com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de resolução de conflito:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
