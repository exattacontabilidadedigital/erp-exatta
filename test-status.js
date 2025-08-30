const { createClient } = require('@supabase/supabase-js');

// Usar variáveis do processo diretamente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ktkgwxqplpkvhzplumcf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0a2d3eHFwbHBrdmh6cGx1bWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MzE3NjAsImV4cCI6MjA0NjUwNzc2MH0.dHLSBPZAuwLwSa1RLVcGx2W-7nPH_y5QANr-ej-rRWk'
);

async function testStatusValues() {
  console.log('🧪 Testando valores de status aceitos pela constraint...\n');
  
  const testValues = ['pending', 'approved', 'rejected', 'matched', 'suggested', 'confirmed'];
  
  for (const status of testValues) {
    try {
      console.log('🧪 Testando status: ' + status);
      
      const { data, error } = await supabase
        .from('transaction_matches')
        .insert({
          reconciliation_id: '00000000-0000-0000-0000-000000000000',
          bank_transaction_id: '00000000-0000-0000-0000-000000000000', 
          system_transaction_id: '00000000-0000-0000-0000-000000000000',
          match_score: 0.95,
          match_type: 'suggested',
          confidence_level: 'high',
          status: status,
          notes: 'Teste'
        })
        .select();
      
      if (error) {
        console.log('❌ ' + status + ': ' + error.message);
      } else {
        console.log('✅ ' + status + ': ACEITO');
        // Deletar o registro de teste
        await supabase
          .from('transaction_matches')
          .delete()
          .eq('reconciliation_id', '00000000-0000-0000-0000-000000000000');
      }
    } catch (e) {
      console.log('❌ ' + status + ': ' + e.message);
    }
  }
  
  console.log('\n📋 Teste concluído!');
}

testStatusValues().then(() => process.exit(0));
