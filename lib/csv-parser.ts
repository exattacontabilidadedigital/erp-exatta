/**
 * Utilitário para parsing de arquivos CSV
 */

export interface CSVParseResult<T = any> {
  data: T[]
  errors: string[]
  totalRows: number
  validRows: number
}

export class CSVParser {
  /**
   * Parse um arquivo CSV e retorna os dados estruturados
   */
  static async parseFile<T = any>(
    file: File,
    options: {
      headers?: string[]
      skipEmptyLines?: boolean
      delimiter?: string
      encoding?: string
    } = {}
  ): Promise<CSVParseResult<T>> {
    const {
      headers,
      skipEmptyLines = true,
      delimiter,
      encoding = 'utf-8'
    } = options

    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        let text = e.target?.result as string
        
        // Tenta corrigir problemas de encoding comuns
        text = this.fixEncoding(text)
        
        const result = this.parseText<T>(text, {
          headers,
          skipEmptyLines,
          delimiter
        })
        resolve(result)
      }

      reader.onerror = () => {
        resolve({
          data: [],
          errors: ['Erro ao ler arquivo'],
          totalRows: 0,
          validRows: 0
        })
      }

      // Tenta primeiro com UTF-8, depois com Latin-1 se necessário
      try {
        reader.readAsText(file, encoding)
      } catch (error) {
        reader.readAsText(file, 'iso-8859-1')
      }
    })
  }

  /**
   * Parse texto CSV
   */
  static parseText<T = any>(
    text: string,
    options: {
      headers?: string[]
      skipEmptyLines?: boolean
      delimiter?: string
    } = {}
  ): CSVParseResult<T> {
    const {
      headers,
      skipEmptyLines = true,
      delimiter: providedDelimiter
    } = options

    // Detecta o delimiter automaticamente se não foi fornecido
    const delimiter = providedDelimiter || this.detectDelimiter(text)
    
    // Debug: log do texto original e delimiter
    console.log('Texto original (primeiras 200 chars):', text.substring(0, 200))
    console.log('Delimiter detectado/usado:', delimiter)

    // Limpa e divide as linhas, removendo caracteres de controle
    const lines = text
      .replace(/\r\n/g, '\n')  // Normaliza quebras de linha
      .replace(/\r/g, '\n')    // Remove carriage returns restantes
      .split('\n')
      .map(line => line.trim()) // Remove espaços em branco
      .filter(line => line.length > 0 || !skipEmptyLines) // Filtra linhas vazias se necessário
    
    const data: T[] = []
    const errors: string[] = []
    let totalRows = 0
    let validRows = 0

    // Debug: log das linhas
    console.log('Total de linhas após filtro:', lines.length)
    console.log('Primeira linha:', lines[0])
    if (lines[1]) console.log('Segunda linha:', lines[1])

    // Se não há cabeçalhos definidos, usa a primeira linha
    const csvHeaders = headers || this.parseCSVLine(lines[0], delimiter)
    const dataStartIndex = headers ? 0 : 1

    // Debug: log dos headers encontrados
    console.log('Headers CSV:', csvHeaders)
    console.log('Índice de início dos dados:', dataStartIndex)

    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i]
      
      // Debug: log de cada linha processada (apenas as primeiras 5)
      if (i < dataStartIndex + 5) {
        console.log(`Linha ${i + 1} original:`, JSON.stringify(line))
      }
      
      if (!line && skipEmptyLines) continue
      if (!line) {
        totalRows++
        continue
      }

      totalRows++

      try {
        const values = this.parseCSVLine(line, delimiter)
        
        // Debug: log das primeiras linhas para verificar parsing
        if (i < dataStartIndex + 5 || (i >= 65 && i <= 70)) {
          console.log(`Linha ${i + 1} valores:`, values)
          console.log(`Linha ${i + 1} número de valores:`, values.length)
          console.log(`Número de headers:`, csvHeaders.length)
          console.log(`Delimitador usado:`, JSON.stringify(delimiter))
        }
        
        if (values.length !== csvHeaders.length) {
          // Se faltam colunas, preenche com strings vazias
          while (values.length < csvHeaders.length) {
            values.push('')
          }
          
          // Se tem colunas demais, ajusta o array
          if (values.length > csvHeaders.length) {
            const adjustedValues = values.slice(0, csvHeaders.length)
            values.length = 0
            values.push(...adjustedValues)
          }
          
          // Debug: log do ajuste para as primeiras ocorrências
          console.log(`AJUSTE - Linha ${i + 1}: Ajustado número de colunas para ${csvHeaders.length}`)
          console.log('Linha original:', JSON.stringify(line))
          console.log('Valores ajustados:', values)
          console.log('Headers:', csvHeaders)
        }

        const row: any = {}
        csvHeaders.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ''
        })

        data.push(row as T)
        validRows++
      } catch (error) {
        errors.push(`Linha ${i + 1}: Erro ao processar - ${error}`)
      }
    }

    return {
      data,
      errors,
      totalRows,
      validRows
    }
  }

  /**
   * Corrige problemas comuns de encoding em texto CSV
   */
  private static fixEncoding(text: string): string {
    let fixedText = text
    
    // Correções específicas para problemas de encoding comum
    fixedText = fixedText.replace(/Ã¡/g, 'á')
    fixedText = fixedText.replace(/Ã£/g, 'ã') 
    fixedText = fixedText.replace(/Ã©/g, 'é')
    fixedText = fixedText.replace(/Ã­/g, 'í')
    fixedText = fixedText.replace(/Ã³/g, 'ó')
    fixedText = fixedText.replace(/Ãº/g, 'ú')
    fixedText = fixedText.replace(/Ã§/g, 'ç')
    fixedText = fixedText.replace(/Ã‰/g, 'É')
    fixedText = fixedText.replace(/Ã‡/g, 'Ç')
    
    // Correções específicas conhecidas
    fixedText = fixedText.replace(/PATRIMÃ"NIO/g, 'PATRIMÔNIO')
    fixedText = fixedText.replace(/LÃQUIDO/g, 'LÍQUIDO')
    fixedText = fixedText.replace(/PatrimÃ´nio/g, 'Patrimônio')
    fixedText = fixedText.replace(/LÃ­quido/g, 'Líquido')
    
    // Casos específicos do plano de contas
    fixedText = fixedText.replace(/Patrim\s*�\s*nio\s+L\s*�\s*quido/gi, 'Patrimônio Líquido')
    fixedText = fixedText.replace(/Patrim.*nio.*L.*quido/gi, 'Patrimônio Líquido')
    
    // Correções específicas para o problema atual
    fixedText = fixedText.replace(/├º├Áes/g, 'ções')
    fixedText = fixedText.replace(/├º├úo/g, 'ção')
    fixedText = fixedText.replace(/├úu/g, 'çu')
    fixedText = fixedText.replace(/Aplica├º├Áes/g, 'Aplicações')
    fixedText = fixedText.replace(/obriga├º├Áes/gi, 'obrigações')
    fixedText = fixedText.replace(/instala├º├Áes/gi, 'instalações')
    fixedText = fixedText.replace(/Obriga├º├Áes/gi, 'Obrigações')
    fixedText = fixedText.replace(/Instala├º├Áes/gi, 'Instalações')

    // Debug: log se houve correções
    if (fixedText !== text) {
      console.log('Correções de encoding aplicadas')
      // Log específico para "Aplicações"
      if (fixedText.includes('Aplicações') && !text.includes('Aplicações')) {
        console.log('Corrigido: "Aplicações" foi restaurado do encoding problemático')
      }
    }

    return fixedText
  }

  /**
   * Detecta automaticamente o delimiter usado no CSV
   */
  private static detectDelimiter(text: string): string {
    const firstLine = text.split('\n')[0]
    const delimiters = [',', ';', '\t', '|'] // Prioriza vírgula primeiro
    
    // Conta a frequência de cada delimiter
    const counts = delimiters.map(delimiter => ({
      delimiter,
      count: firstLine.split(delimiter).length - 1
    }))
    
    // Ordena por frequência decrescente
    counts.sort((a, b) => b.count - a.count)
    
    // Debug: log da detecção do delimiter
    console.log('Primeira linha para análise:', firstLine)
    console.log('Contagem de delimiters:', counts)
    
    // Se o delimiter mais frequente tem pelo menos 2 ocorrências, usa ele
    const selectedDelimiter = counts[0].count >= 2 ? counts[0].delimiter : ','
    console.log('Delimiter selecionado:', selectedDelimiter)
    
    return selectedDelimiter
  }

  /**
   * Parse uma linha CSV considerando aspas e escapamentos
   */
  private static parseCSVLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Aspas escapadas dentro de aspas
          current += '"'
          i += 2
        } else {
          // Início ou fim de aspas
          inQuotes = !inQuotes
          i++
        }
      } else if (char === delimiter && !inQuotes) {
        // Delimitador fora de aspas
        result.push(current)
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current)
    return result
  }

  /**
   * Valida se um arquivo é CSV válido
   */
  static validateCSVFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain']
    const validExtensions = ['.csv', '.txt']

    if (!validTypes.includes(file.type) && !validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return {
        valid: false,
        error: 'Formato de arquivo inválido. Use apenas arquivos CSV ou TXT.'
      }
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return {
        valid: false,
        error: 'Arquivo muito grande. Tamanho máximo: 10MB.'
      }
    }

    return { valid: true }
  }
}
