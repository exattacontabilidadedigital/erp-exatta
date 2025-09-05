// Script para testar o sistema de auditoria completo
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuditSystem() {
  console.log('🔍 Testando sistema de auditoria...');
  
  try {
    // 1. Verificar estrutura da tabela bank_transactions
    console.log('\n1. Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'bank_transactions')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Erro ao verificar estrutura:', tableError);
      return;
    }
    
    console.log('📋 Colunas da tabela bank_transactions:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Verificar se existem transações bancárias
    console.log('\n2. Verificando transações bancárias...');
    const { data: transactions, error: transError } = await supabase
      .from('bank_transactions')
      .select('id, valor, descricao, matched_lancamento_id, reconciled_at, reconciled_by')
      .limit(5);
    
    if (transError) {
      console.error('❌ Erro ao buscar transações:', transError);
      return;
    }
    
    console.log(`📊 Encontradas ${transactions.length} transações (amostra):`);
    transactions.forEach(trans => {
      console.log(`  - ID: ${trans.id}, Valor: ${trans.valor}, Conciliado: ${trans.matched_lancamento_id ? 'Sim' : 'Não'}`);
      if (trans.reconciled_at) {
        console.log(`    Reconciliado em: ${trans.reconciled_at} por: ${trans.reconciled_by}`);
      }
    });
    
    // 3. Verificar se existem lançamentos
    console.log('\n3. Verificando lançamentos...');
    const { data: lancamentos, error: lancError } = await supabase
      .from('lancamentos')
      .select('id, valor, descricao, tipo')
      .limit(5);
    
    if (lancError) {
      console.error('❌ Erro ao buscar lançamentos:', lancError);
      return;
    }
    
    console.log(`📈 Encontrados ${lancamentos.length} lançamentos (amostra):`);
    lancamentos.forEach(lanc => {
      console.log(`  - ID: ${lanc.id}, Valor: ${lanc.valor}, Tipo: ${lanc.tipo}`);
    });
    
    // 4. Verificar se as APIs estão funcionando
    console.log('\n4. Testando endpoints de API...');
    
    // Simular uma conciliação
    if (transactions.length > 0 && lancamentos.length > 0) {
      const transaction = transactions.find(t => !t.matched_lancamento_id);
      const lancamento = lancamentos[0];
      
      if (transaction && lancamento) {
        console.log(`🔗 Testando conciliação: Transação ${transaction.id} com Lançamento ${lancamento.id}`);
        
        // Simular call para API (não vamos fazer requisição HTTP real)
        const mockApiRequest = {
          bankTransactionId: transaction.id,
          lancamentoId: lancamento.id,
          confidence: 0.95,
          notes: 'Teste do sistema de auditoria'
        };
        
        console.log('📝 Dados que seriam enviados para /api/reconciliation/conciliate:');
        console.log(JSON.stringify(mockApiRequest, null, 2));
        
        // Verificar se conseguiríamos atualizar diretamente
        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update({
            matched_lancamento_id: lancamento.id,
            match_confidence: 0.95,
            match_type: 'manual',
            match_criteria: JSON.stringify({
              method: 'test',
              valor_match: true,
              descricao_similarity: 0.8
            }),
            reconciled_at: new Date().toISOString(),
            reconciled_by: 'test-user',
            reconciliation_notes: 'Teste do sistema de auditoria'
          })
          .eq('id', transaction.id);
        
        if (updateError) {
          console.error('❌ Erro no teste de atualização:', updateError);
        } else {
          console.log('✅ Teste de atualização bem-sucedido!');
          
          // Reverter a alteração
          await supabase
            .from('bank_transactions')
            .update({
              matched_lancamento_id: null,
              match_confidence: null,
              match_type: null,
              match_criteria: null,
              reconciled_at: null,
              reconciled_by: null,
              reconciliation_notes: null
            })
            .eq('id', transaction.id);
          
          console.log('🔄 Alteração revertida para manter dados originais');
        }
      } else {
        console.log('⚠️ Não há transações não conciliadas ou lançamentos para testar');
      }
    }
    
    console.log('\n✅ Teste do sistema de auditoria concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testAuditSystem();
