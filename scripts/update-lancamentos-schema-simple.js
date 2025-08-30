const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log('Verifique se o arquivo .env.local existe e contém:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=...')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateLancamentosSchema() {
  console.log('🔄 Atualizando schema da tabela lancamentos...')
  console.log('📝 Este script adicionará as seguintes colunas:')
  console.log('  - juros DECIMAL(15,2) DEFAULT 0')
  console.log('  - multa DECIMAL(15,2) DEFAULT 0') 
  console.log('  - desconto DECIMAL(15,2) DEFAULT 0')
  console.log('  - valor_pago DECIMAL(15,2) DEFAULT 0')
  console.log('  - recebimento_realizado BOOLEAN DEFAULT false')
  console.log('')
  
  try {
    // Primeiro, vamos verificar se as colunas já existem
    console.log('🔍 Verificando colunas existentes...')
    
    const { data: existingColumns, error: checkError } = await supabase
      .from('lancamentos')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabela lancamentos:', checkError)
      return
    }
    
    console.log('✅ Tabela lancamentos acessível')
    
    // Verificar se as colunas já existem tentando fazer uma consulta
    const testColumns = ['juros', 'multa', 'desconto', 'valor_pago', 'recebimento_realizado']
    const existingFields = []
    
    for (const column of testColumns) {
      try {
        const { error } = await supabase
          .from('lancamentos')
          .select(column)
          .limit(1)
        
        if (!error) {
          existingFields.push(column)
        }
      } catch (e) {
        // Coluna não existe
      }
    }
    
    if (existingFields.length === testColumns.length) {
      console.log('✅ Todas as colunas já existem!')
      console.log('📋 Colunas encontradas:', existingFields.join(', '))
      return
    }
    
    console.log('⚠️  Algumas colunas não existem ainda.')
    console.log('📋 Colunas existentes:', existingFields.join(', ') || 'Nenhuma')
    console.log('📋 Colunas faltando:', testColumns.filter(col => !existingFields.includes(col)).join(', '))
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
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT]/sql')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateLancamentosSchema()
}

module.exports = { updateLancamentosSchema }
