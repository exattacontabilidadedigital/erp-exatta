// Script para debug - por que card não tem botões?
console.log('🔍 ANÁLISE: Por que card aparece sem botões?');
console.log('');

// Cenários onde botões aparecem:
console.log('📋 CENÁRIOS COM BOTÕES:');
console.log('');

console.log('1️⃣ CONCILIADO:');
console.log('   - Condição: pair.bankTransaction?.status_conciliacao === "conciliado"');
console.log('   - Botão: "desconciliar"');
console.log('');

console.log('2️⃣ SUGERIDO:');
console.log('   - Condição: status_conciliacao !== "conciliado" && (status === "suggested" || status === "sugerido")');
console.log('   - Botões: "Conciliar" e "desvincular"');
console.log('');

console.log('3️⃣ TRANSFERÊNCIA:');
console.log('   - Condição: status_conciliacao !== "conciliado" && (status === "transfer" || status === "transferencia")');
console.log('   - Botões: "Conciliar" e "desvincular"');
console.log('');

console.log('4️⃣ SEM MATCH:');
console.log('   - Condição: status_conciliacao !== "conciliado" && (status === "no_match" || status === "sem_match")');
console.log('   - Botão: "Ignorar"');
console.log('');

console.log('❌ CENÁRIOS SEM BOTÕES:');
console.log('');

console.log('🚨 PROBLEMA IDENTIFICADO:');
console.log('   Se o card tem status que NÃO se encaixa em nenhuma condição acima,');
console.log('   ele aparece SEM BOTÕES!');
console.log('');

console.log('🔍 POSSÍVEIS STATUS PROBLEMÁTICOS:');
console.log('   - status === "matched"');
console.log('   - status === "conciliado" (mas status_conciliacao !== "conciliado")');
console.log('   - status === undefined ou null');
console.log('   - status com valor não previsto');
console.log('');

console.log('📸 ANÁLISE DA IMAGEM:');
console.log('   Card mostra: "[TRANSFERÊNCIA ENTRADA] teste"');
console.log('   Origem: sistema');
console.log('   Provavelmente status = "matched" ou "transferencia" com status_conciliacao !== "conciliado"');
console.log('');

console.log('✅ SOLUÇÃO:');
console.log('   Verificar o status exato do pair e ajustar as condições');
console.log('   ou adicionar um case default para status não previstos');
