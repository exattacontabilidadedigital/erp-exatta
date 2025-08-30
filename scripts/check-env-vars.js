// Script para verificar variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente...')
console.log('')

// Verificar se as variáveis estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Definida' : '❌ Não definida')

if (supabaseUrl) {
  console.log('URL (primeiros 20 chars):', supabaseUrl.substring(0, 20) + '...')
}

if (supabaseKey) {
  console.log('Key (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...')
}

console.log('')
console.log('📋 Todas as variáveis de ambiente:')
console.log(Object.keys(process.env).filter(key => key.includes('SUPABASE')).join(', '))

console.log('')
console.log('💡 Para definir as variáveis, você pode:')
console.log('1. Criar um arquivo .env.local na raiz do projeto')
console.log('2. Definir as variáveis no sistema operacional')
console.log('3. Usar o painel do Supabase para obter as credenciais')
