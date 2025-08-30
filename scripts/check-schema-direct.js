const { createClient } = require('@supabase/supabase-js')

// Credenciais diretas do Supabase
const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLancamentosSchema() {
  console.log('🔍 Verificando schema da tabela lancamentos...')
  console.log('📝 Verificando se as seguintes colunas existem:')
  console.log('  - juros DECIMAL(15,2) DEFAULT 0')
  console.log('  - multa DECIMAL(15,2) DEFAULT 0') 
  console.log('  - desconto DECIMAL(15,2) DEFAULT 0')
  console.log('  - valor_pago DECIMAL(15,2) DEFAULT 0')
  console.log('  - recebimento_realizado BOOLEAN DEFAULT false')
  console.log('')
  
  try {
    // Primeiro, vamos verificar se a tabela existe e é acessível
    console.log('🔍 Verificando acesso à tabela lancamentos...')
    
    const { data: testData, error: testError } = await supabase
      .from('lancamentos')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro ao acessar tabela lancamentos:', testError)
      return
    }
    
    console.log('✅ Tabela lancamentos acessível')
    
    // Verificar se as colunas já existem tentando fazer uma consulta
    const testColumns = ['juros', 'multa', 'desconto', 'valor_pago', 'recebimento_realizado']
    const existingFields = []
    const missingFields = []
    
    for (const column of testColumns) {
      try {
        const { error } = await supabase
          .from('lancamentos')
          .select(column)
          .limit(1)
        
        if (!error) {
          existingFields.push(column)
        } else {
          missingFields.push(column)
        }
      } catch (e) {
        missingFields.push(column)
      }
    }
    
    console.log('')
    console.log('📋 RESULTADO DA VERIFICAÇÃO:')
    console.log('')
    
    if (existingFields.length > 0) {
      console.log('✅ Colunas existentes:', existingFields.join(', '))
    }
    
    if (missingFields.length > 0) {
      console.log('❌ Colunas faltando:', missingFields.join(', '))
      console.log('')
      console.log('💡 Para adicionar as colunas faltantes, execute o seguinte SQL no painel do Supabase:')
      console.log('')
      console.log('ALTER TABLE lancamentos')
      console.log('ADD COLUMN IF NOT EXISTS juros DECIMAL(15,2) DEFAULT 0,')
      console.log('ADD COLUMN IF NOT EXISTS multa DECIMAL(15,2) DEFAULT 0,')
      console.log('ADD COLUMN IF NOT EXISTS desconto DECIMAL(15,2) DEFAULT 0,')
      console.log('ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15,2) DEFAULT 0,')
      console.log('ADD COLUMN IF NOT EXISTS recebimento_realizado BOOLEAN DEFAULT false;')
      console.log('')
      console.log('🔗 Acesse: https://supabase.com/dashboard/project/gcefhrwvijehxzrxwyfe/sql')
    } else {
      console.log('🎉 Todas as colunas já existem! O formulário está pronto para usar.')
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkLancamentosSchema()
}

module.exports = { checkLancamentosSchema }
