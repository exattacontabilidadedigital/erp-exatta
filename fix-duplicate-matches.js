// Script para limpar matches duplicados e garantir apenas 1 match por transação OFX
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixDuplicateMatches() {
  console.log('🔧 INICIANDO CORREÇÃO DE MATCHES DUPLICADOS...');
  
  try {
    // 1. Analisar situação atual
    console.log('\n📊 1. ANÁLISE DA SITUAÇÃO ATUAL:');
    
    const { data: allMatches, error: fetchError } = await supabase
      .from('transaction_matches')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar matches:', fetchError);
      return;
    }
    
    console.log(`Total de matches encontrados: ${allMatches.length}`);
    
    // Agrupar por bank_transaction_id para identificar duplicatas
    const groupedByBank = allMatches.reduce((acc, match) => {
      const bankId = match.bank_transaction_id;
      if (!acc[bankId]) {
        acc[bankId] = [];
      }
      acc[bankId].push(match);
      return acc;
    }, {});
    
    // Identificar duplicatas
    const duplicatedBankTransactions = Object.entries(groupedByBank)
      .filter(([bankId, matches]) => matches.length > 1);
    
    console.log(`\nTransações bancárias com duplicatas: ${duplicatedBankTransactions.length}`);
    
    duplicatedBankTransactions.forEach(([bankId, matches]) => {
      console.log(`  - ${bankId}: ${matches.length} matches`);
      matches.forEach((match, idx) => {
        console.log(`    ${idx + 1}. ${match.id} (${match.status}) - ${match.created_at}`);
      });
    });
    
    // 2. Estratégia de limpeza
    console.log('\n🧹 2. ESTRATÉGIA DE LIMPEZA:');
    console.log('Para cada transação bancária duplicada:');
    console.log('  1. Manter o match com status "confirmed" (se existir)');
    console.log('  2. Se não há confirmed, manter o mais recente');
    console.log('  3. Remover todos os outros matches');
    
    // 3. Executar limpeza
    console.log('\n🔄 3. EXECUTANDO LIMPEZA...');
    
    let totalRemoved = 0;
    
    for (const [bankId, matches] of duplicatedBankTransactions) {
      console.log(`\nProcessando transação ${bankId}:`);
      
      // Ordenar matches: confirmed primeiro, depois por data mais recente
      const sortedMatches = matches.sort((a, b) => {
        // Prioridade 1: status confirmed
        if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
        if (b.status === 'confirmed' && a.status !== 'confirmed') return 1;
        
        // Prioridade 2: mais recente
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Manter o primeiro (melhor) match
      const keepMatch = sortedMatches[0];
      const removeMatches = sortedMatches.slice(1);
      
      console.log(`  ✅ Mantendo: ${keepMatch.id} (${keepMatch.status})`);
      console.log(`  🗑️ Removendo: ${removeMatches.length} matches`);
      
      // Remover matches desnecessários
      for (const matchToRemove of removeMatches) {
        const { error: deleteError } = await supabase
          .from('transaction_matches')
          .delete()
          .eq('id', matchToRemove.id);
        
        if (deleteError) {
          console.error(`    ❌ Erro ao remover ${matchToRemove.id}:`, deleteError);
        } else {
          console.log(`    ✅ Removido: ${matchToRemove.id}`);
          totalRemoved++;
        }
      }
      
      // Atualizar status da transação bancária baseado no match mantido
      let reconciliationStatus = 'pending';
      let statusConciliacao = 'pendente';
      
      switch (keepMatch.status) {
        case 'confirmed':
          reconciliationStatus = 'conciliado';
          statusConciliacao = 'conciliado';
          break;
        case 'suggested':
          reconciliationStatus = 'sugerido';
          statusConciliacao = 'pendente';
          break;
        default:
          reconciliationStatus = 'pending';
          statusConciliacao = 'pendente';
      }
      
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({
          reconciliation_status: reconciliationStatus,
          status_conciliacao: statusConciliacao,
          matched_lancamento_id: keepMatch.status === 'confirmed' ? keepMatch.system_transaction_id : null,
          match_confidence: keepMatch.match_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', bankId);
      
      if (updateError) {
        console.error(`    ⚠️ Erro ao atualizar transação bancária:`, updateError);
      } else {
        console.log(`    ✅ Status atualizado: ${reconciliationStatus}`);
      }
    }
    
    // 4. Verificação final
    console.log('\n📋 4. VERIFICAÇÃO FINAL:');
    
    const { data: finalMatches } = await supabase
      .from('transaction_matches')
      .select('bank_transaction_id')
      .order('created_at', { ascending: false });
    
    const finalGrouped = finalMatches.reduce((acc, match) => {
      const bankId = match.bank_transaction_id;
      acc[bankId] = (acc[bankId] || 0) + 1;
      return acc;
    }, {});
    
    const remainingDuplicates = Object.entries(finalGrouped)
      .filter(([bankId, count]) => count > 1);
    
    console.log(`Total de matches após limpeza: ${finalMatches.length}`);
    console.log(`Matches únicos por transação: ${Object.keys(finalGrouped).length}`);
    console.log(`Duplicatas restantes: ${remainingDuplicates.length}`);
    console.log(`Total de matches removidos: ${totalRemoved}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ SUCESSO: Todas as duplicatas foram removidas!');
    } else {
      console.log('⚠️ ATENÇÃO: Ainda existem duplicatas:');
      remainingDuplicates.forEach(([bankId, count]) => {
        console.log(`  - ${bankId}: ${count} matches`);
      });
    }
    
    // 5. Relatório final
    console.log('\n📊 5. RELATÓRIO FINAL:');
    console.log(`- Transações bancárias únicas: ${Object.keys(finalGrouped).length}`);
    console.log(`- Total de matches finais: ${finalMatches.length}`);
    console.log(`- Proporção 1:1 atingida: ${Object.keys(finalGrouped).length === finalMatches.length ? '✅ SIM' : '❌ NÃO'}`);
    
    // Se você tinha 14 transações OFX, agora deve ter no máximo 14 matches
    const expectedOFXTransactions = 14;
    if (finalMatches.length <= expectedOFXTransactions) {
      console.log(`✅ Resultado esperado: ${finalMatches.length} matches (≤ ${expectedOFXTransactions} transações OFX)`);
    } else {
      console.log(`⚠️ Ainda há mais matches (${finalMatches.length}) que transações OFX esperadas (${expectedOFXTransactions})`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar o script
console.log('🚀 Iniciando correção de matches duplicados...');
fixDuplicateMatches();
