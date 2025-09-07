// Teste da API check-lancamento-usage para debug das estrelas
require('dotenv').config({ path: '.env.local' });

const testAPI = async () => {
  try {
    console.log('🔍 Testando API check-lancamento-usage para debug das estrelas...\n');
    
    // IDs de lançamentos que apareceram nos logs anteriores
    const testIds = [
      '758d207e-2f80-4d51-b9c5-de47dac831aa',
      '8a09cc88-aa76-4175-9246-3611b0da4833', 
      'ea5d6beb-2769-46e4-903d-79b3baf1166c'
    ];
    
    for (const id of testIds) {
      console.log(`📋 Testando lançamento: ${id.substring(0, 8)}...`);
      
      try {
        const response = await fetch(`http://localhost:3001/api/reconciliation/check-lancamento-usage/${id}`);
        
        console.log(`   📡 Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   📦 Resposta:`, {
            isInUse: data.isInUse,
            starColor: data.starColor,
            status: data.status,
            message: data.message
          });
          
          if (data.isInUse) {
            console.log(`   ⭐ Deveria mostrar estrela ${data.starColor || 'amarela (fallback)'}`);
          } else {
            console.log(`   ⚪ Lançamento disponível - sem estrela`);
          }
        } else {
          const errorData = await response.json();
          console.log(`   ❌ Erro:`, errorData.error || errorData.message);
        }
        
      } catch (error) {
        console.log(`   💥 Exceção: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('✅ Teste da API concluído!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
};

testAPI();
