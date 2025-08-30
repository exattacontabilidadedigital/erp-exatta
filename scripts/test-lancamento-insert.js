const { createClient } = require('@supabase/supabase-js')

// Credenciais diretas do Supabase
const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLancamentoInsert() {
  console.log('🧪 Testando inserção de lançamento...')
  console.log('')
  
  try {
    // Dados de teste
    const testData = {
      tipo: 'entrada',
      numero_documento: 'TEST-001',
      plano_conta_id: '1', // Assumindo que existe
      centro_custo_id: '1', // Assumindo que existe
      valor: 100.00,
      cliente_fornecedor_id: null,
      conta_bancaria_id: null,
      forma_pagamento_id: null,
      descricao: 'Teste de inserção',
      status: 'pendente',
      empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d', // ID da empresa do usuário
      usuario_id: '7317f5bd-f288-4433-8283-596936caf9b2', // ID do usuário
      // Novos campos
      vencimento: null,
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
  testLancamentoInsert()
}

module.exports = { testLancamentoInsert }
