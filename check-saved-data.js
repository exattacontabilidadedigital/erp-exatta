const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ptkuxtvzqpyuczasdlfh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0a3V4dHZ6cXB5dWN6YXNkbGZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDUzNjkxOCwiZXhwIjoyMDUwMTEyOTE4fQ.8qp1YdJfPu-w6CdXA1nJg3b9dmL2_r_JhUILVKLv5nM'
);

async function checkSavedData() {
  try {
    console.log('🔍 Verificando dados salvos no banco...');
    
    const { data, error } = await supabase
      .from('transaction_matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.log('❌ Erro:', error);
    } else {
      console.log('✅ Últimos 5 registros salvos:');
      data.forEach((record, index) => {
        console.log(`${index + 1}. Status: ${record.status}, Type: ${record.match_type}, Score: ${record.match_score}, Notes: ${record.notes?.substring(0, 50)}...`);
      });
      
      // Contar registros por status
      const statusCounts = {};
      data.forEach(record => {
        statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
      });
      
      console.log('\n📊 Contagem por status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

checkSavedData();
