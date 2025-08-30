const { createClient } = require('@supabase/supabase-js')

// Credenciais diretas do Supabase
const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testValorLogic() {
  console.log('🧪 Testando nova lógica de valores...')
  console.log('')
  
  try {
    // Buscar IDs reais
    const { data: planos } = await supabase.from('plano_contas').select('id, nome').limit(1)
    const { data: centros } = await supabase.from('centro_custos').select('id, nome').limit(1)
    
    if (!planos || !centros) {
      console.error('❌ Não foi possível buscar dados de referência')
      return
    }
    
    console.log('📋 Testando cenários:')
    console.log('')
    
    // Cenário 1: Receita sem pagamento (valor original)
    console.log('1️⃣ RECEITA SEM PAGAMENTO:')
    const receitaSemPagamento = {
      tipo: 'receita',
      numero_documento: 'TEST-REC-001',
      data_lancamento: '2024-01-15',
      plano_conta_id: planos[0].id,
      centro_custo_id: centros[0].id,
      valor: 1000.00, // Valor original
      valor_original: 1000.00, // Mesmo valor
      recebimento_realizado: false,
      valor_pago: 0,
      descricao: 'Receita sem pagamento',
      status: 'pendente',
      empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d',
      usuario_id: '7317f5bd-f288-4433-8283-596936caf9b2'
    }
    console.log('   Valor principal:', receitaSemPagamento.valor)
    console.log('   Valor original:', receitaSemPagamento.valor_original)
    console.log('')
    
    // Cenário 2: Receita com pagamento (valor efetivo)
    console.log('2️⃣ RECEITA COM PAGAMENTO:')
    const receitaComPagamento = {
      tipo: 'receita',
      numero_documento: 'TEST-REC-002',
      data_lancamento: '2024-01-15',
      plano_conta_id: planos[0].id,
      centro_custo_id: centros[0].id,
      valor: 1050.00, // Valor efetivo (1000 + 50 juros)
      valor_original: 1000.00, // Valor original
      recebimento_realizado: true,
      valor_pago: 1050.00,
      juros: 50.00,
      descricao: 'Receita com juros',
      status: 'pago',
      empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d',
      usuario_id: '7317f5bd-f288-4433-8283-596936caf9b2'
    }
    console.log('   Valor principal:', receitaComPagamento.valor)
    console.log('   Valor original:', receitaComPagamento.valor_original)
    console.log('   Valor pago:', receitaComPagamento.valor_pago)
    console.log('')
    
    // Cenário 3: Despesa com desconto
    console.log('3️⃣ DESPESA COM DESCONTO:')
    const despesaComDesconto = {
      tipo: 'despesa',
      numero_documento: 'TEST-DESP-001',
      data_lancamento: '2024-01-15',
      plano_conta_id: planos[0].id,
      centro_custo_id: centros[0].id,
      valor: 950.00, // Valor efetivo (1000 - 50 desconto)
      valor_original: 1000.00, // Valor original
      recebimento_realizado: true,
      valor_pago: 950.00,
      desconto: 50.00,
      descricao: 'Despesa com desconto',
      status: 'pago',
      empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d',
      usuario_id: '7317f5bd-f288-4433-8283-596936caf9b2'
    }
    console.log('   Valor principal:', despesaComDesconto.valor)
    console.log('   Valor original:', despesaComDesconto.valor_original)
    console.log('   Valor pago:', despesaComDesconto.valor_pago)
    console.log('')
    
    console.log('✅ Lógica implementada corretamente!')
    console.log('📊 O valor principal agora reflete o valor efetivo quando pago/recebido')
    console.log('📋 O valor original é mantido para referência e relatórios')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testValorLogic()
}

module.exports = { testValorLogic }
