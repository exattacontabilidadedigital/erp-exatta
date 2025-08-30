const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ptkuxtvzqpyuczasdlfh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0a3V4dHZ6cXB5dWN6YXNkbGZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDUzNjkxOCwiZXhwIjoyMDUwMTEyOTE4fQ.8qp1YdJfPu-w6CdXA1nJg3b9dmL2_r_JhUILVKLv5nM'
);

async function checkConstraint() {
  try {
    console.log('🔍 Verificando constraints da tabela transaction_matches...');
    
    // Vamos verificar os valores válidos para status testando diferentes valores
    console.log('\n🔍 Tentando inserir registros de teste...');
    
    const baseRecord = {
      reconciliation_id: null,
      bank_transaction_id: '7dcd0cc7-3ec3-475c-8347-5dc02ad43413',
      system_transaction_id: '0e9d53d4-1469-4e28-973b-fc14aa39c972',
      match_score: 0.5,
      match_type: 'automatic',
      confidence_level: 'high',
      notes: 'Teste de constraint'
    };
    
    const statusesToTest = ['pending', 'suggested', 'confirmed', 'rejected'];
    
    for (const status of statusesToTest) {
      console.log('\n🔄 Testando status:', status);
      
      const testRecord = {
        ...baseRecord,
        id: 'test-' + status + '-' + Date.now(),
        status: status
      };
      
      const { data, error } = await supabase
        .from('transaction_matches')
        .insert(testRecord);
      
      if (error) {
        console.log('❌ Erro com status "' + status + '":', error.message);
      } else {
        console.log('✅ Status "' + status + '" aceito!');
        
        // Limpar o registro teste
        await supabase
          .from('transaction_matches')
          .delete()
          .eq('id', testRecord.id);
      }
    }
    
    // Verificar registros existentes para ver quais status estão sendo usados
    console.log('\n🔍 Verificando status existentes na tabela...');
    const { data: existingData, error: existingError } = await supabase
      .from('transaction_matches')
      .select('status')
      .limit(10);
      
    if (existingError) {
      console.log('❌ Erro ao consultar status existentes:', existingError);
    } else {
      const uniqueStatuses = [...new Set(existingData.map(row => row.status))];
      console.log('📊 Status encontrados na tabela:', uniqueStatuses);
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

checkConstraint();
