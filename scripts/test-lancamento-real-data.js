const { createClient } = require('@supabase/supabase-js')

// Credenciais diretas do Supabase
const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLancamentoRealData() {
  console.log('🧪 Testando inserção com dados reais...')
  console.log('')
  
  try {
    // Primeiro, buscar IDs reais das tabelas relacionadas
    console.log('📋 Buscando IDs reais...')
    
    // Buscar plano de conta
    const { data: planos, error: errorPlanos } = await supabase
      .from('plano_contas')
      .select('id, nome')
      .limit(1)
    
    if (errorPlanos || !planos || planos.length === 0) {
      console.error('❌ Erro ao buscar plano de conta:', errorPlanos)
      return
    }
    
    // Buscar centro de custo
    const { data: centros, error: errorCentros } = await supabase
      .from('centro_custos')
      .select('id, nome')
      .limit(1)
    
    if (errorCentros || !centros || centros.length === 0) {
      console.error('❌ Erro ao buscar centro de custo:', errorCentros)
      return
    }
    
    console.log('✅ Plano de conta encontrado:', planos[0].nome, '(ID:', planos[0].id, ')')
    console.log('✅ Centro de custo encontrado:', centros[0].nome, '(ID:', centros[0].id, ')')
    console.log('')
    
    // Dados de teste com IDs reais
    const testData = {
      tipo: 'receita',
      numero_documento: 'TEST-REAL-001',
      data_lancamento: '2024-01-15',
      plano_conta_id: planos[0].id,
      centro_custo_id: centros[0].id,
      valor: 100.00,
      cliente_fornecedor_id: null,
      conta_bancaria_id: null,
      forma_pagamento_id: null,
      descricao: 'Teste com dados reais',
      status: 'pendente',
      empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d',
      usuario_id: '7317f5bd-f288-4433-8283-596936caf9b2',
      // Novos campos
      data_vencimento: null,
      recebimento_realizado: false,
      data_pagamento: null,
      juros: 0,
      multa: 0,
      desconto: 0,
      valor_pago: 0
    }
    
    console.log('📋 Dados de teste:', JSON.stringify(testData, null, 2))
    console.log('')
    
    // Tentar inserir
    const { data, error } = await supabase
      .from('lancamentos')
      .insert([testData])
      .select()
    
    if (error) {
      console.error('❌ Erro na inserção:', error)
      console.error('Error.message:', error.message)
      console.error('Error.code:', error.code)
      console.error('Error.details:', error.details)
      console.error('Error.hint:', error.hint)
    } else {
      console.log('✅ Inserção bem-sucedida!')
      console.log('📄 Dados inseridos:', data)
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testLancamentoRealData()
}

module.exports = { testLancamentoRealData }
