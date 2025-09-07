// Teste para verificar se há conflitos de CSS
console.log('🎨 TESTE: Verificação de Classes CSS');
console.log('=====================================');

const classesCores = [
  'text-green-600',  // Match exato
  'text-green-700',  // Receita/Entrada
  'text-red-700'     // Despesa/Saída
];

console.log('📋 Classes de cores que devem ser aplicadas:');
classesCores.forEach((classe, index) => {
  console.log(`${index + 1}. ${classe}`);
});

console.log('\n🔍 Possíveis problemas:');
console.log('1. CSS global sobrescrevendo as classes');
console.log('2. Ordem de especificidade CSS');
console.log('3. Classes sendo aplicadas mas não visíveis');
console.log('4. JavaScript não executando a lógica');

console.log('\n🛠️ Como debugar:');
console.log('1. Abrir F12 no navegador');
console.log('2. Ir para Console');
console.log('3. Abrir o modal de lançamentos');
console.log('4. Verificar os logs com "🔍 DEBUG"');
console.log('5. Inspecionar elemento para ver classes CSS aplicadas');

console.log('\n💡 O que verificar nos logs:');
console.log('- tipo: qual o tipo do lançamento no banco');
console.log('- numero_documento: se contém TRANSF-');
console.log('- isTransferencia: se foi identificada como transferência');
console.log('- corClasse: qual classe CSS foi aplicada');

console.log('\n🎯 Se os logs mostrarem as classes corretas mas ainda estiver verde:');
console.log('- Problema é CSS, não JavaScript');
console.log('- Verificar se há !important sobrescrevendo');
console.log('- Verificar ordem de carregamento dos estilos');
