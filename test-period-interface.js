// Teste do seletor de período na conciliação
console.log('🧪 Testando seletor de período na aplicação...');

// Aguardar a página carregar
setTimeout(() => {
  console.log('🔍 Verificando se o seletor de período está visível...');
  
  // Buscar pelos elementos do seletor
  const calendarioIcon = document.querySelector('svg[data-lucide="calendar"]');
  const mesSelector = document.querySelector('button[role="combobox"]');
  const mesLabels = document.querySelectorAll('select, [role="combobox"]');
  
  console.log('📊 Estado dos elementos:');
  console.log('  📅 Ícone calendário:', calendarioIcon ? '✅ Encontrado' : '❌ Não encontrado');
  console.log('  🗓️ Seletores encontrados:', mesLabels.length);
  
  // Verificar período atual exibido
  mesLabels.forEach((selector, index) => {
    console.log(`    Seletor ${index + 1}:`, selector.textContent || selector.value);
  });
  
  // Verificar se há dados sendo exibidos
  const transactionCards = document.querySelectorAll('[class*="rounded-lg"][class*="border"]');
  const pairsInfo = document.querySelector('[class*="text-sm"][class*="font-medium"]');
  
  console.log('  💳 Cards de transação:', transactionCards.length);
  console.log('  📈 Info de pares:', pairsInfo?.textContent || 'Não encontrado');
  
  // Testar mudança de período
  if (mesLabels.length >= 2) {
    console.log('🔄 Testando mudança de período...');
    // Simular clique no seletor de mês (se possível)
    const primeiroSeletor = mesLabels[0];
    if (primeiroSeletor.click) {
      primeiroSeletor.click();
      console.log('✅ Clique no seletor executado');
    }
  }
  
  console.log('✅ Teste do seletor concluído!');
}, 3000);
