// Teste da API de conciliação com diferentes períodos
async function testPeriodAPI() {
  console.log('🧪 Testando API de conciliação com diferentes períodos...');
  
  const baseURL = 'http://localhost:3001';
  const bankAccountId = '8ad0f3fb-88cc-4f39-8d50-f47efb3a5486';
  const empresaId = '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d';
  
  const periodos = [
    { mes: '08', ano: '2025', nome: 'Agosto 2025' },
    { mes: '09', ano: '2025', nome: 'Setembro 2025' },
    { mes: '07', ano: '2025', nome: 'Julho 2025' }
  ];
  
  for (const periodo of periodos) {
    console.log(`\n📅 Testando: ${periodo.nome}`);
    
    const periodStart = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-01`;
    const lastDay = new Date(Number(periodo.ano), Number(periodo.mes), 0).getDate();
    const periodEnd = `${periodo.ano}-${periodo.mes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    const url = `${baseURL}/api/reconciliation/suggestions?bank_account_id=${bankAccountId}&period_start=${periodStart}&period_end=${periodEnd}&empresa_id=${empresaId}&include_reconciled=false`;
    
    console.log(`📡 URL: ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${periodo.nome}:`, {
          pares: data.pairs?.length || 0,
          reconciliationId: data.reconciliation_id || 'N/A',
          summary: data.summary ? 'Presente' : 'Ausente'
        });
        
        if (data.pairs?.length > 0) {
          console.log(`   📊 Exemplo de par:`, {
            status: data.pairs[0].status,
            bankAmount: data.pairs[0].bankTransaction?.amount,
            systemAmount: data.pairs[0].systemTransaction?.valor
          });
        }
      } else {
        console.log(`❌ ${periodo.nome}: Erro ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${periodo.nome}: Erro de rede -`, error.message);
    }
  }
  
  console.log('\n✅ Teste da API concluído!');
}

// Aguardar servidor estar pronto
setTimeout(testPeriodAPI, 2000);
