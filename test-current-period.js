// Teste do período atual
console.log('🗓️ Teste do período atual');

const hoje = new Date();
const mesAtual = (hoje.getMonth() + 1).toString().padStart(2, '0');
const anoAtual = hoje.getFullYear().toString();

console.log('📅 Data atual:', hoje.toLocaleDateString('pt-BR'));
console.log('📊 Mês atual calculado:', mesAtual);
console.log('📊 Ano atual calculado:', anoAtual);

// Calcular período
const periodStart = `${anoAtual}-${mesAtual.padStart(2, '0')}-01`;
const lastDay = new Date(Number(anoAtual), Number(mesAtual), 0).getDate();
const periodEnd = `${anoAtual}-${mesAtual.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

console.log('📊 Período calculado:');
console.log('   Início:', periodStart);
console.log('   Fim:', periodEnd);

// Nomes dos meses
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const nomeMes = meses[parseInt(mesAtual) - 1];

console.log('🎯 Período esperado no seletor:', `${nomeMes} ${anoAtual}`);
console.log('🎯 Se estiver mostrando outro período, há inconsistência!');
