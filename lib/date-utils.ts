/**
 * Utilities para tratamento de datas em fuso horário brasileiro
 */

/**
 * Converte uma data para string no formato YYYY-MM-DD
 * considerando o fuso horário local (Brasil)
 */
export function formatDateForDatabase(date: Date): string {
  if (!date) return ''
  
  // Usar o fuso horário local do Brasil
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Converte uma data para string no formato YYYY-MM-DD
 * usando offset específico do Brasil (UTC-3)
 */
export function formatDateForDatabaseBR(date: Date): string {
  if (!date) return ''
  
  // Criar nova data ajustada para UTC-3 (Brasil)
  const brasilOffset = -3 * 60 // -3 horas em minutos
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
  const brasilTime = new Date(utcTime + (brasilOffset * 60000))
  
  const year = brasilTime.getFullYear()
  const month = String(brasilTime.getMonth() + 1).padStart(2, '0')
  const day = String(brasilTime.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Converte uma string de data do banco para objeto Date
 * considerando o fuso horário local
 */
export function parseDateFromDatabase(dateString: string): Date {
  if (!dateString) return new Date()
  
  // Assumir que a data no banco está no formato YYYY-MM-DD
  // e criar uma data local (sem conversão UTC)
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 */
export function formatDateForDisplay(date: Date | string): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? parseDateFromDatabase(date) : date
  
  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Converte Date para string considerando timezone Brasil
 * Usa método mais simples e confiável
 */
export function toDateString(date: Date): string {
  if (!date) return ''
  
  // Método mais direto: usar as funções nativas de data local
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Ajusta uma data para o fuso horário do Brasil mantendo a mesma data
 */
export function adjustToLocalTimezone(date: Date): string {
  // Pega os componentes da data local (sem conversão UTC)
  const localYear = date.getFullYear()
  const localMonth = String(date.getMonth() + 1).padStart(2, '0')
  const localDay = String(date.getDate()).padStart(2, '0')
  
  return `${localYear}-${localMonth}-${localDay}`
}
