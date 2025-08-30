const { createClient } = require('@supabase/supabase-js')

// Credenciais diretas do Supabase
const supabaseUrl = 'https://gcefhrwvijehxzrxwyfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZWZocnd2aWplaHh6cnh3eWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDUxMTgsImV4cCI6MjA3MDY4MTExOH0.H3yTE4k6n-n8WtIDkFZM1k4_y9uKFV7TLA7AVTh5Lj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLancamentosSchema() {
  console.log('🔍 Verificando schema da tabela lancamentos...')
  console.log('')
  
  try {
    // Tentar fazer um select simples para ver as colunas
    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela:', error)
    } else {
      console.log('✅ Tabela acessível')
      if (data && data.length > 0) {
        console.log('📋 Colunas existentes:', Object.keys(data[0]))
      } else {
        console.log('📋 Tabela vazia, mas acessível')
      }
    }
    
    // Tentar inserir dados mínimos sem as novas colunas
    console.log('')
    console.log('🧪 Testando inserção sem novas colunas...')
    
    const testData = {
      tipo: 'entrada',
      numero_documento: 'TEST-002',
      plano_conta_id: '1',
      centro_custo_id: '1',
      valor: 100.00,
      descricao: 'Teste sem novas colunas',
      status: 'pendente',
      empresa_id: '3cdbb91a-29cd-4a02-8bf8-f09fa1df439d',
      usuario_id: '7317f5bd-f288-4433-8283-596936caf9b2'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('lancamentos')
      .insert([testData])
      .select()
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError)
    } else {
      console.log('✅ Inserção bem-sucedida sem novas colunas!')
      console.log('📄 Dados inseridos:', insertData)
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