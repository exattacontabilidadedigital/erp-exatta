import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Executa uma query de forma segura, evitando erros 400 se a tabela não existir
 * @param supabase - Cliente do Supabase
 * @param tableName - Nome da tabela
 * @param queryBuilder - Função que constrói a query
 * @returns Promise com data e error
 */
export async function safeQuery<T = any>(
  supabase: SupabaseClient,
  tableName: string,
  queryBuilder: (table: any) => any
) {
  try {
    const table = supabase.from(tableName)
    const query = queryBuilder(table)
    return await query
  } catch (error) {
    console.warn(`Erro ao consultar tabela ${tableName}:`, error)
    return { data: null, error }
  }
}

/**
 * Verifica se uma tabela existe no banco de dados
 * @param supabase - Cliente do Supabase
 * @param tableName - Nome da tabela
 * @returns Promise<boolean>
 */
export async function tableExists(
  supabase: SupabaseClient,
  tableName: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    return !error
  } catch {
    return false
  }
}

/**
 * Executa uma query com retry em caso de erro de timeout
 * @param supabase - Cliente do Supabase
 * @param tableName - Nome da tabela
 * @param queryBuilder - Função que constrói a query
 * @param maxRetries - Número máximo de tentativas
 * @returns Promise com data e error
 */
export async function queryWithRetry<T = any>(
  supabase: SupabaseClient,
  tableName: string,
  queryBuilder: (table: any) => any,
  maxRetries: number = 3
) {
  let lastError: any = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await safeQuery(supabase, tableName, queryBuilder)
      
      if (!result.error) {
        return result
      }
      
      lastError = result.error
      
      // Aguarda um pouco antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }
  
  return { data: null, error: lastError }
}
