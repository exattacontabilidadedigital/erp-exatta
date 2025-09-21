// Parser para arquivos CSV
// Arquivo: lib/parsers/csv-parser.ts

import { DadosTransacao } from '@/types/import';
import * as Papa from 'papaparse';

interface CSVRowData {
  [key: string]: string;
}

interface CSVParseOptions {
  delimiter?: string;
  headers?: string[];
  skipEmptyLines?: boolean;
  encoding?: string;
}

export class CSVParser {
  /**
   * Mapas de campos comuns para diferentes layouts de CSV
   */
  private static readonly FIELD_MAPPINGS = {
    // Campos de data
    date: ['data', 'date', 'dt', 'data_transacao', 'data_lancamento', 'dt_transacao'],
    
    // Campos de descrição
    description: ['descricao', 'description', 'desc', 'historico', 'memo', 'observacao', 'descr'],
    
    // Campos de valor
    amount: ['valor', 'amount', 'value', 'val', 'montante', 'quantia'],
    
    // Campos de documento
    document: ['documento', 'document', 'doc', 'numero_documento', 'num_doc', 'doc_number'],
    
    // Campos de referência
    reference: ['referencia', 'reference', 'ref', 'ref_bancaria', 'bank_ref', 'fitid'],
    
    // Campos de categoria
    category: ['categoria', 'category', 'cat', 'tipo', 'type'],
    
    // Campos de saldo
    balance: ['saldo', 'balance', 'bal', 'saldo_atual']
  };

  /**
   * Faz parsing de um buffer CSV e retorna array de transações
   */
  static parse(buffer: Buffer, options: CSVParseOptions = {}): DadosTransacao[] {
    try {
      const encoding = (options.encoding || 'utf-8') as BufferEncoding;
      const content = buffer.toString(encoding);
      return this.parseCSVContent(content, options);
    } catch (error) {
      console.error('Erro ao fazer parsing do arquivo CSV:', error);
      throw new Error('Erro ao processar arquivo CSV: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }

  /**
   * Processa o conteúdo CSV e extrai transações
   */
  private static parseCSVContent(content: string, options: CSVParseOptions): DadosTransacao[] {
    const transactions: DadosTransacao[] = [];
    
    // Configurações do Papa Parse
    const parseConfig: Papa.ParseConfig = {
      header: true,
      skipEmptyLines: options.skipEmptyLines !== false,
      delimiter: options.delimiter || this.detectDelimiter(content),
      transformHeader: (header: string) => this.normalizeHeader(header),
      transform: (value: string) => value.trim()
    };

    const result = Papa.parse<CSVRowData>(content, parseConfig);
    
    if (result.errors.length > 0) {
      console.warn('Avisos durante parsing CSV:', result.errors);
    }

    // Mapear campos automaticamente
    const fieldMapping = this.autoMapFields(result.meta.fields || []);
    
    // Processar cada linha
    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i];
      const transaction = this.parseRow(row, fieldMapping, i + 1);
      
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  }

  /**
   * Detecta o delimitador mais provável do CSV
   */
  private static detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let bestDelimiter = ',';

    for (const delimiter of delimiters) {
      const count = (firstLine.match(new RegExp('\\' + delimiter, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  /**
   * Normaliza cabeçalhos removendo acentos, espaços e caracteres especiais
   */
  private static normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '_') // Substitui caracteres especiais por _
      .replace(/_+/g, '_') // Remove _ duplicados
      .replace(/^_|_$/g, ''); // Remove _ do início e fim
  }

  /**
   * Mapeia automaticamente os campos do CSV para os campos padrão
   */
  private static autoMapFields(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    for (const [standardField, possibleFields] of Object.entries(this.FIELD_MAPPINGS)) {
      for (const header of headers) {
        const normalizedHeader = this.normalizeHeader(header);
        
        if (possibleFields.some(field => {
          const normalizedField = this.normalizeHeader(field);
          return normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader);
        })) {
          mapping[standardField] = header;
          break;
        }
      }
    }

    return mapping;
  }

  /**
   * Processa uma linha do CSV e converte para DadosTransacao
   */
  private static parseRow(row: CSVRowData, fieldMapping: Record<string, string>, lineNumber: number): DadosTransacao | null {
    try {
      // Extrair dados usando o mapeamento
      const dateStr = this.getFieldValue(row, fieldMapping.date);
      const descriptionStr = this.getFieldValue(row, fieldMapping.description);
      const amountStr = this.getFieldValue(row, fieldMapping.amount);
      const documentStr = this.getFieldValue(row, fieldMapping.document);
      const referenceStr = this.getFieldValue(row, fieldMapping.reference);
      const categoryStr = this.getFieldValue(row, fieldMapping.category);
      const balanceStr = this.getFieldValue(row, fieldMapping.balance);

      // Validar campos obrigatórios
      if (!dateStr || !amountStr) {
        console.warn(`Linha ${lineNumber}: Data ou valor ausente`);
        return null;
      }

      // Converter data
      const date = this.parseDate(dateStr);
      if (!date) {
        console.warn(`Linha ${lineNumber}: Data inválida: ${dateStr}`);
        return null;
      }

      // Converter valor
      const amount = this.parseAmount(amountStr);
      if (isNaN(amount)) {
        console.warn(`Linha ${lineNumber}: Valor inválido: ${amountStr}`);
        return null;
      }

      // Converter saldo (opcional)
      const balance = balanceStr ? this.parseAmount(balanceStr) : undefined;

      // Usar descrição ou valor padrão
      const description = descriptionStr || `Transação ${lineNumber}`;

      return {
        descricao: description,
        valor: amount,
        data: date,
        numeroDocumento: documentStr || undefined,
        referenciaBancaria: referenceStr || undefined,
        categoria: categoryStr || undefined,
        saldo: balance,
      };

    } catch (error) {
      console.warn(`Erro ao processar linha ${lineNumber}:`, error);
      return null;
    }
  }

  /**
   * Obtém o valor de um campo do row, considerando o mapeamento
   */
  private static getFieldValue(row: CSVRowData, fieldName?: string): string {
    if (!fieldName || !row[fieldName]) {
      return '';
    }
    return row[fieldName].trim();
  }

  /**
   * Converte string de data para Date
   */
  private static parseDate(dateStr: string): Date | null {
    try {
      // Limpar a string de data
      const cleanDate = dateStr.replace(/[^\d\/\-\.]/g, '');
      
      // Padrões de data suportados
      const patterns = [
        /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
        /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // D/M/YYYY
        /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
      ];

      for (const pattern of patterns) {
        const match = cleanDate.match(pattern);
        if (match) {
          let day: number, month: number, year: number;
          
          if (pattern.source.startsWith('^(\\d{4})')) {
            // Formato YYYY-MM-DD ou YYYY/MM/DD
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1; // JavaScript months são 0-based
            day = parseInt(match[3]);
          } else {
            // Formato DD/MM/YYYY ou DD-MM-YYYY
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1; // JavaScript months são 0-based
            year = parseInt(match[3]);
          }

          // Validar componentes da data
          if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
            continue;
          }

          const date = new Date(year, month, day);
          
          // Verificar se a data é válida
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
          }
        }
      }

      // Tentar parsing direto como último recurso
      const directParse = new Date(dateStr);
      if (!isNaN(directParse.getTime())) {
        return directParse;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Converte string de valor para number
   */
  private static parseAmount(amountStr: string): number {
    try {
      // Limpar a string de valor
      let cleanAmount = amountStr
        .replace(/[^\d,.\-+]/g, '') // Manter apenas dígitos, vírgulas, pontos e sinais
        .trim();

      // Tratar casos especiais
      if (!cleanAmount || cleanAmount === '-' || cleanAmount === '+') {
        return NaN;
      }

      // Detectar formato decimal (vírgula vs ponto)
      const commaCount = (cleanAmount.match(/,/g) || []).length;
      const dotCount = (cleanAmount.match(/\./g) || []).length;

      // Se tem vírgula e ponto, assumir que o último é decimal
      if (commaCount > 0 && dotCount > 0) {
        const lastComma = cleanAmount.lastIndexOf(',');
        const lastDot = cleanAmount.lastIndexOf('.');
        
        if (lastComma > lastDot) {
          // Vírgula é decimal, pontos são separadores de milhares
          cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
        } else {
          // Ponto é decimal, vírgulas são separadores de milhares
          cleanAmount = cleanAmount.replace(/,/g, '');
        }
      } else if (commaCount > 0) {
        // Apenas vírgulas - assumir que a última é decimal se houver 2 dígitos após ela
        const lastComma = cleanAmount.lastIndexOf(',');
        const afterComma = cleanAmount.substring(lastComma + 1);
        
        if (afterComma.length <= 2 && commaCount === 1) {
          // Vírgula decimal
          cleanAmount = cleanAmount.replace(',', '.');
        } else {
          // Vírgulas como separadores de milhares
          cleanAmount = cleanAmount.replace(/,/g, '');
        }
      }

      return parseFloat(cleanAmount);
    } catch {
      return NaN;
    }
  }

  /**
   * Valida se o conteúdo é um arquivo CSV válido
   */
  static isValidCSV(content: string): boolean {
    try {
      const result = Papa.parse(content, { 
        header: true, 
        skipEmptyLines: true,
        preview: 5 // Analisar apenas as primeiras 5 linhas
      });

      // Verificar se tem pelo menos uma linha de dados e headers
      return result.data.length > 0 && 
             result.meta.fields !== undefined && 
             result.meta.fields.length > 0 &&
             result.errors.length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Obtém estatísticas do arquivo CSV
   */
  static getFileStatistics(buffer: Buffer): {
    totalRows: number;
    totalColumns: number;
    dateRange: { start?: Date; end?: Date };
    totalAmount: number;
    fileSize: number;
    isValid: boolean;
    detectedDelimiter: string;
    headers: string[];
  } {
    try {
      const content = buffer.toString('utf-8');
      const delimiter = this.detectDelimiter(content);
      
      const result = Papa.parse<CSVRowData>(content, {
        header: true,
        skipEmptyLines: true,
        delimiter,
      });

      const isValid = this.isValidCSV(content);
      
      if (!isValid) {
        return {
          totalRows: 0,
          totalColumns: 0,
          dateRange: {},
          totalAmount: 0,
          fileSize: buffer.length,
          isValid: false,
          detectedDelimiter: delimiter,
          headers: []
        };
      }

      // Tentar extrair datas e valores para estatísticas
      const fieldMapping = this.autoMapFields(result.meta.fields || []);
      const dates: Date[] = [];
      const amounts: number[] = [];

      for (const row of result.data) {
        const dateStr = this.getFieldValue(row, fieldMapping.date);
        const amountStr = this.getFieldValue(row, fieldMapping.amount);
        
        if (dateStr) {
          const date = this.parseDate(dateStr);
          if (date) dates.push(date);
        }
        
        if (amountStr) {
          const amount = this.parseAmount(amountStr);
          if (!isNaN(amount)) amounts.push(amount);
        }
      }

      return {
        totalRows: result.data.length,
        totalColumns: result.meta.fields?.length || 0,
        dateRange: {
          start: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined,
          end: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined,
        },
        totalAmount: amounts.reduce((sum, amount) => sum + amount, 0),
        fileSize: buffer.length,
        isValid: true,
        detectedDelimiter: delimiter,
        headers: result.meta.fields || []
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do arquivo CSV:', error);
      return {
        totalRows: 0,
        totalColumns: 0,
        dateRange: {},
        totalAmount: 0,
        fileSize: buffer.length,
        isValid: false,
        detectedDelimiter: ',',
        headers: []
      };
    }
  }

  /**
   * Gera um mapeamento de campos sugerido para o usuário
   */
  static suggestFieldMapping(headers: string[]): Record<string, string[]> {
    const suggestions: Record<string, string[]> = {};
    
    for (const [standardField, possibleFields] of Object.entries(this.FIELD_MAPPINGS)) {
      const matches = headers.filter(header => {
        const normalizedHeader = this.normalizeHeader(header);
        return possibleFields.some(field => {
          const normalizedField = this.normalizeHeader(field);
          return normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader);
        });
      });
      
      if (matches.length > 0) {
        suggestions[standardField] = matches;
      }
    }
    
    return suggestions;
  }
}

// Funções de conveniência para usar o parser
export function parseCSV(buffer: Buffer, options?: CSVParseOptions): DadosTransacao[] {
  return CSVParser.parse(buffer, options);
}

// Função para validar arquivo CSV
export function isValidCSVFile(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf-8');
    return CSVParser.isValidCSV(content);
  } catch {
    return false;
  }
}

// Função para obter informações do arquivo
export function getCSVFileInfo(buffer: Buffer) {
  return CSVParser.getFileStatistics(buffer);
}

// Função para sugerir mapeamento de campos
export function suggestCSVFieldMapping(buffer: Buffer): Record<string, string[]> {
  try {
    const content = buffer.toString('utf-8');
    const delimiter = CSVParser['detectDelimiter'](content);
    
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      preview: 1 // Apenas para obter os headers
    });

    return CSVParser.suggestFieldMapping(result.meta.fields || []);
  } catch {
    return {};
  }
}