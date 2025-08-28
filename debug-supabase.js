const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente manualmente
const fs = require('fs')
const path = require('path')

// Ler arquivo .env.local
try {
  const envFile = fs.readFileSync('.env.local', 'utf8')
  const envVars = {}
  
  envFile.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      envVars[key.trim()] = value.trim()
    }
  })
  
  // Definir as variáveis no process.env
  Object.assign(process.env, envVars)
} catch (err) {
  console.log('Erro ao carregar .env.local:', err.message)
}

console.log('=== DIAGNÓSTICO SUPABASE ===')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl ? 'Configurado' : 'Não encontrado')
console.log('Key:', supabaseAnonKey ? 'Configurado' : 'Não encontrado')

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Credenciais não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnose() {
  try {
    // Testar conexão básica
    console.log('\n1. Testando conexão básica...')
    const { data, error } = await supabase.from('usuarios').select('count').limit(1)
    
    if (error) {
      console.log('❌ Erro ao acessar tabela usuarios:', error.message)
      console.log('   Code:', error.code)
      console.log('   Details:', error.details)
      console.log('   Hint:', error.hint)
      
      // Verificar se é problema de RLS
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        console.log('\n⚠️ Possível problema de Row Level Security (RLS)')
        console.log('   A tabela usuarios pode existir mas estar protegida por RLS')
      }
      
      // Verificar se a tabela não existe
      if (error.code === '42P01' || error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n❌ A tabela usuarios não existe no banco de dados')
      }
    } else {
      console.log('✅ Conexão com tabela usuarios OK')
    }
    
    // Testar uma consulta sem autenticação
    console.log('\n2. Testando consulta sem autenticação...')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Erro de autenticação:', authError.message)
    } else if (authData.user) {
      console.log('✅ Usuário autenticado:', authData.user.email)
    } else {
      console.log('⚠️ Nenhum usuário autenticado')
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
}

diagnose().then(() => {
  console.log('\n=== FIM DO DIAGNÓSTICO ===')
})
