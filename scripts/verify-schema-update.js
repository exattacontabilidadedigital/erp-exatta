const { createClient } = require('@supabase/supabase-js')

// Credenciais diretas do Supabase
const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchemaUpdate() {
  console.log('🔍 Verificando se as colunas foram adicionadas...')
  console.log('')
  
  try {
    // Verificar se as colunas existem
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
    
    console.log('📋 RESULTADO DA VERIFICAÇÃO:')
    console.log('')
    
    if (existingFields.length > 0) {
      console.log('✅ Colunas existentes:', existingFields.join(', '))
    }
    
    if (missingFields.length > 0) {
      console.log('❌ Colunas ainda faltando:', missingFields.join(', '))
      console.log('')
      console.log('⚠️  Execute o SQL no painel do Supabase primeiro!')
    } else {
      console.log('🎉 Todas as colunas foram adicionadas com sucesso!')
      console.log('')
      console.log('✅ O formulário de lançamentos está pronto para usar!')
      console.log('✅ Você pode testar criando um novo lançamento com as informações de pagamento.')
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  verifySchemaUpdate()
}

module.exports = { verifySchemaUpdate }
