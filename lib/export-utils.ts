/**
 * Utilitário para exportação de dados em diferentes formatos
 */

export interface ExportColumn {
  key: string
  header: string
  formatter?: (value: any, row: any) => string
}

export interface ExportOptions {
  filename?: string
  columns?: ExportColumn[]
  includeTimestamp?: boolean
  encoding?: string
}

export class DataExporter {
  /**
   * Exporta dados para CSV
   */
  static exportToCSV(data: any[], options: ExportOptions = {}) {
    if (!data || data.length === 0) {
      throw new Error('Não há dados para exportar')
    }

    const {
      filename = 'dados_exportados',
      columns,
      includeTimestamp = true,
      encoding = 'utf-8'
    } = options

    // Se colunas não foram especificadas, usar todas as chaves do primeiro objeto
    const exportColumns: ExportColumn[] = columns || Object.keys(data[0]).map(key => ({
      key,
      header: key
    }))

    // Criar cabeçalho CSV
    const header = exportColumns.map(col => `"${col.header}"`).join(',')

    // Criar linhas de dados
    const rows = data.map(row => {
      return exportColumns.map(col => {
        let value = row[col.key]
        
        // Aplicar formatador personalizado se existir
        if (col.formatter) {
          value = col.formatter(value, row)
        } else {
          // Formatação padrão
          value = this.formatValue(value)
        }
        
        return `"${value}"`
      }).join(',')
    })

    // Combinar cabeçalho e dados
    const csvContent = [header, ...rows].join('\n')

    // Adicionar BOM para UTF-8 (melhora compatibilidade com Excel)
    const BOM = '\uFEFF'
    const finalContent = BOM + csvContent

    // Gerar nome do arquivo
    const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : ''
    const finalFilename = `${filename}${timestamp}.csv`

    // Criar e baixar arquivo
    this.downloadFile(finalContent, finalFilename, 'text/csv;charset=utf-8;')
  }

  /**
   * Exporta dados para Excel (XLSX)
   */
  static exportToExcel(data: any[], options: ExportOptions = {}) {
    // Para implementação futura com biblioteca XLSX
    console.warn('Exportação para Excel não implementada ainda. Usando CSV como alternativa.')
    this.exportToCSV(data, options)
  }

  /**
   * Exporta dados para JSON
   */
  static exportToJSON(data: any[], options: ExportOptions = {}) {
    const {
      filename = 'dados_exportados',
      includeTimestamp = true
    } = options

    const jsonContent = JSON.stringify(data, null, 2)
    
    const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : ''
    const finalFilename = `${filename}${timestamp}.json`

    this.downloadFile(jsonContent, finalFilename, 'application/json;charset=utf-8;')
  }

  /**
   * Formata valores para exportação
   */
  private static formatValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString('pt-BR')
      }
      return JSON.stringify(value)
    }

    if (typeof value === 'number') {
      // Se for um valor monetário (contém decimais), formatar adequadamente
      if (value % 1 !== 0) {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
      return value.toString()
    }

    // Escapar aspas duplas e quebras de linha no texto
    return String(value)
      .replace(/"/g, '""')
      .replace(/\r?\n/g, ' ')
      .replace(/\r/g, ' ')
  }

  /**
   * Realiza o download do arquivo
   */
  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpar URL objeto para liberar memória
    URL.revokeObjectURL(url)
  }
}

/**
 * Formatadores específicos para lançamentos contábeis
 */
export const LancamentosFormatters = {
  data: (value: any) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('pt-BR')
  },
  
  valor: (value: any) => {
    if (!value) return '0,00'
    return Number(value).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  },
  
  tipo: (value: any) => {
    const tipos: { [key: string]: string } = {
      'receita': 'Receita',
      'despesa': 'Despesa',
      'transferencia': 'Transferência'
    }
    return tipos[value] || value || ''
  },
  
  status: (value: any) => {
    const status: { [key: string]: string } = {
      'pago': 'Pago',
      'pendente': 'Pendente',
      'cancelado': 'Cancelado',
      'em_processo': 'Em Processo'
    }
    return status[value] || value || ''
  }
}

/**
 * Configuração de colunas para exportação de lançamentos
 */
export const LancamentosExportColumns: ExportColumn[] = [
  { key: 'data_lancamento', header: 'Data', formatter: LancamentosFormatters.data },
  { key: 'tipo', header: 'Tipo', formatter: LancamentosFormatters.tipo },
  { key: 'numero_documento', header: 'Nº Documento' },
  { key: 'plano_conta_nome', header: 'Plano de Contas' },
  { key: 'centro_custo_nome', header: 'Centro de Custo' },
  { key: 'cliente_fornecedor_nome', header: 'Cliente/Fornecedor' },
  { key: 'conta_bancaria_nome', header: 'Conta Bancária' },
  { key: 'valor', header: 'Valor', formatter: LancamentosFormatters.valor },
  { key: 'descricao', header: 'Descrição' },
  { key: 'status', header: 'Status', formatter: LancamentosFormatters.status },
]
