/**
 * ANÁLISE: Em qual tabela o filtro está sendo aplicado?
 */

console.log('🔍 ANÁLISE: Tabela onde o filtro está sendo aplicado');
console.log('=' .repeat(55));

console.log('📋 TABELA PRINCIPAL:');
console.log('   Nome: lancamentos');
console.log('   Tipo: Tabela principal do sistema de lançamentos financeiros');
console.log('   Localização: Banco de dados Supabase');

console.log('\n🔗 TABELAS RELACIONADAS (JOINs):');
console.log('   1. plano_contas - Relacionada via plano_conta_id');
console.log('   2. centro_custos - Relacionada via centro_custo_id');
console.log('   3. contas_bancarias - Relacionada via conta_bancaria_id');
console.log('   4. bancos - Relacionada via contas_bancarias.banco_id');

console.log('\n📊 ESTRUTURA DA CONSULTA:');
console.log(`
SELECT 
  l.*,
  pc.id, pc.nome, pc.codigo (plano_contas),
  cc.id, cc.nome, cc.codigo (centro_custos),
  cb.id, cb.agencia, cb.conta, cb.digito (contas_bancarias),
  b.nome (bancos)
FROM lancamentos l
LEFT JOIN plano_contas pc ON l.plano_conta_id = pc.id
LEFT JOIN centro_custos cc ON l.centro_custo_id = cc.id
LEFT JOIN contas_bancarias cb ON l.conta_bancaria_id = cb.id
LEFT JOIN bancos b ON cb.banco_id = b.id
WHERE 
  -- FILTROS APLICADOS NA TABELA lancamentos
  ABS(l.valor) = 25.00
  AND l.data_lancamento >= '2025-08-14'
  AND l.data_lancamento <= '2025-08-20'
  AND l.status = 'pendente'
ORDER BY l.data_lancamento DESC, l.created_at DESC;
`);

console.log('\n🎯 CAMPOS DA TABELA lancamentos UTILIZADOS NO FILTRO:');
console.log('   • valor - Para filtro de valor exato');
console.log('   • data_lancamento - Para filtro de intervalo de data');
console.log('   • status - Para filtrar apenas "pendente"');
console.log('   • created_at - Para ordenação secundária');

console.log('\n📄 CAMPOS PRINCIPAIS DA TABELA lancamentos:');
const camposLancamentos = [
  'id (UUID)',
  'data_lancamento (DATE)',
  'descricao (TEXT)',
  'valor (DECIMAL)',
  'tipo (receita/despesa)',
  'status (pendente/conciliado/cancelado)',
  'numero_documento (TEXT)',
  'observacoes (TEXT)',
  'plano_conta_id (UUID FK)',
  'centro_custo_id (UUID FK)',
  'conta_bancaria_id (UUID FK)',
  'empresa_id (UUID FK)',
  'created_at (TIMESTAMP)',
  'updated_at (TIMESTAMP)'
];

camposLancamentos.forEach((campo, index) => {
  console.log(`   ${index + 1}. ${campo}`);
});

console.log('\n🔍 LOCALIZAÇÃO NO CÓDIGO:');
console.log('   Arquivo: app/api/conciliacao/buscar-existentes/route.ts');
console.log('   Linha: ~99');
console.log('   Comando: supabase.from("lancamentos")');

console.log('\n✅ CONFIRMAÇÃO:');
console.log('   O filtro de valor exato + intervalo de data está sendo');
console.log('   aplicado na tabela "lancamentos" que contém todos os');
console.log('   lançamentos financeiros do sistema ERP.');

console.log('\n🎯 PROPÓSITO:');
console.log('   Buscar lançamentos financeiros existentes que correspondam');
console.log('   às transações bancárias para processo de conciliação');
console.log('   bancária automática.');

console.log('\n📋 EXEMPLO DE REGISTRO NA TABELA lancamentos:');
const exemploRegistro = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  data_lancamento: '2025-08-17',
  descricao: 'Pagamento fornecedor XYZ',
  valor: 25.00,
  tipo: 'despesa',
  status: 'pendente',
  numero_documento: 'NF-001',
  plano_conta_id: '456e7890-e89b-12d3-a456-426614174001',
  centro_custo_id: '789e0123-e89b-12d3-a456-426614174002',
  conta_bancaria_id: '012e3456-e89b-12d3-a456-426614174003',
  empresa_id: '345e6789-e89b-12d3-a456-426614174004',
  created_at: '2025-08-15T10:30:00Z',
  updated_at: '2025-08-15T10:30:00Z'
};

Object.entries(exemploRegistro).forEach(([campo, valor]) => {
  console.log(`   ${campo}: ${valor}`);
});
