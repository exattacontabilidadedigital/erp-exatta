// Debug: Como debugar o sistema de estrelas

console.log('🔍 GUIA DE DEBUG - Sistema de Estrelas');
console.log('=====================================\n');

console.log('1. 📋 PASSOS PARA VERIFICAR:');
console.log('   - Abra o navegador em http://localhost:3000');
console.log('   - Vá para conciliação bancária');
console.log('   - Abra modal de buscar lançamentos');
console.log('   - Pressione F12 para abrir DevTools');
console.log('   - Olhe a aba Console');
console.log('');

console.log('2. 🔍 LOGS ESPERADOS NO CONSOLE:');
console.log('   - "🔍 Iniciando verificação de uso para lançamentos: [...]"');
console.log('   - "🧪 TESTE: Aplicando mock de usage status: {...}"');
console.log('   - "🔍 Renderizando coluna Primário para [id]: {...}"');
console.log('   - "⭐ Renderizando estrela para lançamento [id]: {...}"');
console.log('');

console.log('3. ⭐ O QUE DEVE APARECER:');
console.log('   - 1º lançamento: ESTRELA VERDE (conciliado)');
console.log('   - 2º lançamento: ESTRELA LARANJA (sugestão)');
console.log('   - Demais: sem estrela');
console.log('');

console.log('4. 🐛 SE NÃO APARECER ESTRELAS:');
console.log('   - Verifique se os logs aparecem no console');
console.log('   - Verifique se usage.inUse = true nos logs');
console.log('   - Verifique se a condição "if (usage?.inUse)" está sendo executada');
console.log('');

console.log('5. 🔧 PRÓXIMOS PASSOS:');
console.log('   - Se mock funcionar: problema na API');
console.log('   - Se mock não funcionar: problema na renderização');
console.log('   - Copie e cole os logs do console aqui para análise');
console.log('');

console.log('✅ Ready para debug!');
