const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateLancamentosSchema() {
  console.log('🔄 Atualizando schema da tabela lancamentos...')
  
  try {
    // SQL para adicionar as novas colunas
    const sql = `
      -- Adicionar colunas para informações de pagamento
      ALTER TABLE lancamentos 
      ADD COLUMN IF NOT EXISTS juros DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS multa DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS desconto DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS recebimento_realizado BOOLEAN DEFAULT false;
    `
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error)
      return
    }
    
    console.log('✅ Colunas adicionadas com sucesso!')
    
    // Verificar se as colunas foram criadas
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'lancamentos')
      .in('column_name', ['juros', 'multa', 'desconto', 'valor_pago', 'recebimento_realizado'])
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError)
      return
    }
    
    console.log('📋 Colunas criadas:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`)
    })
    
    console.log('🎉 Schema atualizado com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateLancamentosSchema()
}

module.exports = { updateLancamentosSchema }
