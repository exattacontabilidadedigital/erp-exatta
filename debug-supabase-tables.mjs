import { supabase } from './lib/supabase/client.js'

console.log('=== DIAGNÓSTICO SUPABASE ===')

// Verificar conexão
console.log('1. Testando conexão com Supabase...')

try {
  // Verificar se o usuário está autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.log('❌ Erro de autenticação:', authError.message)
  } else if (user) {
    console.log('✅ Usuário autenticado:', user.email)
    
    // Tentar buscar dados do usuário na tabela usuarios
    console.log('2. Testando acesso à tabela usuarios...')
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      console.log('❌ Erro ao acessar tabela usuarios:', userError)
      console.log('   Code:', userError.code)
      console.log('   Details:', userError.details)
      console.log('   Hint:', userError.hint)
    } else {
      console.log('✅ Dados do usuário encontrados:', userData)
    }
    
    // Verificar se a tabela usuarios existe
    console.log('3. Verificando se a tabela usuarios existe...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'usuarios')
    
    if (tableError) {
      console.log('❌ Erro ao verificar tabelas:', tableError)
    } else {
      console.log('📋 Tabela usuarios existe?', tables.length > 0 ? 'SIM' : 'NÃO')
    }
    
  } else {
    console.log('⚠️ Nenhum usuário autenticado')
  }
  
} catch (error) {
  console.log('❌ Erro geral:', error)
}

console.log('=== FIM DO DIAGNÓSTICO ===')
