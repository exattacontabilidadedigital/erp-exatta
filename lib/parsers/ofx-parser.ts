// Parser para arquivos OFX (Open Financial Exchange)
// Arquivo: lib/parsers/ofx-parser.ts

import { DadosTransacao } from '@/types/import';

interface TransacaoOFX {
  trntype: string;
  dtposted: string;
  trnamt: string;
  fitid: string;
  memo?: string;
  name?: string;
  checknum?: string;
}

export class OFXParser {
  /**
   * Faz parsing de um buffer OFX e retorna array de transações
   */
  static parse(buffer: Buffer): DadosTransacao[] {
    try {
      const content = buffer.toString('utf-8');
      return this.parseOFXContent(content);
    } catch (error) {
      console.error('Erro ao fazer parsing do arquivo OFX:', error);
      throw new Error('Erro ao processar arquivo OFX: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }

  /**
   * Processa o conteúdo OFX e extrai transações
   */
  private static parseOFXContent(content: string): DadosTransacao[] {
    const transactions: DadosTransacao[] = [];
    
    // Limpar e normalizar o conteúdo
    const cleanContent = this.cleanOFXContent(content);
    
    // Extrair todas as transações STMTTRN
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    
    while ((match = transactionRegex.exec(cleanContent)) !== null) {
      const transactionBlock = match[1];
      const transaction = this.parseTransaction(transactionBlock);
      
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    // Se não encontrou transações com STMTTRN, tentar outras estruturas
    if (transactions.length === 0) {
      const alternativeTransactions = this.parseAlternativeStructure(cleanContent);
      transactions.push(...alternativeTransactions);
    }
    
    return transactions;
  }

  /**
   * Limpa e normaliza o conteúdo OFX
   */
  private static cleanOFXContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Faz parsing de uma transação individual
   */
  private static parseTransaction(transactionBlock: string): DadosTransacao | null {
    try {
      const trnType = this.extractTag(transactionBlock, 'TRNTYPE');
      const datePosted = this.extractTag(transactionBlock, 'DTPOSTED');
      const amount = this.extractTag(transactionBlock, 'TRNAMT');
      const fitId = this.extractTag(transactionBlock, 'FITID');
      const memo = this.extractTag(transactionBlock, 'MEMO');
      const name = this.extractTag(transactionBlock, 'NAME');
      const checkNum = this.extractTag(transactionBlock, 'CHECKNUM');
      
      // Validar campos obrigatórios
      if (!datePosted || !amount) {
        return null;
      }

      const parsedDate = this.parseOFXDate(datePosted);
      const parsedAmount = parseFloat(amount);

      if (!parsedDate || isNaN(parsedAmount)) {
        return null;
      }

      // Construir descrição a partir dos campos disponíveis
      let description = memo || name || `Transação ${trnType || 'Genérica'}`;
      
      // Adicionar informações adicionais se disponíveis
      if (checkNum) {
        description += ` - Cheque: ${checkNum}`;
      }
      
      if (name && memo && name !== memo) {
        description = `${name} - ${memo}`;
      }

      return {
        descricao: description.trim(),
        valor: parsedAmount,
        data: parsedDate,
        numeroDocumento: checkNum || fitId,
        referenciaBancaria: fitId,
        tipoTransacao: trnType,
      };
    } catch (error) {
      console.warn('Erro ao processar transação OFX:', error);
      return null;
    }
  }

  /**
   * Extrai o valor de uma tag OFX
   */
  private static extractTag(content: string, tagName: string): string {
    // Buscar tag com fechamento opcional
    const patterns = [
      new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i'),
      new RegExp(`<${tagName}>(.*?)(?=<|$)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Converte data no formato OFX para Date
   */
  private static parseOFXDate(dateStr: string): Date | null {
    try {
      // Formato OFX típico: YYYYMMDD ou YYYYMMDDHHMMSS[.SSS][-TZ]
      const cleanDate = dateStr.replace(/[^\d]/g, '').substring(0, 8);
      
      if (cleanDate.length !== 8) {
        return null;
      }

      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1; // JavaScript months são 0-based
      const day = parseInt(cleanDate.substring(6, 8));

      // Validar componentes da data
      if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
        return null;
      }

      return new Date(year, month, day);
    } catch (error) {
      console.warn('Erro ao converter data OFX:', dateStr, error);
      return null;
    }
  }

  /**
   * Tenta parsing com estruturas alternativas de OFX
   */
  private static parseAlternativeStructure(content: string): DadosTransacao[] {
    const transactions: DadosTransacao[] = [];
    
    // Buscar por estruturas BANKTRANLIST alternativas
    const bankTransRegex = /<BANKTRANLIST>([\s\S]*?)<\/BANKTRANLIST>/gi;
    let bankMatch;
    
    while ((bankMatch = bankTransRegex.exec(content)) !== null) {
      const bankTransBlock = bankMatch[1];
      
      // Buscar transações dentro do bloco
      const lines = bankTransBlock.split('\n');
      let currentTransaction: Partial<DadosTransacao> = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('<DTPOSTED>')) {
          const dateStr = this.extractTag(trimmedLine, 'DTPOSTED');
          const date = this.parseOFXDate(dateStr);
          if (date) currentTransaction.data = date;
        }
        
        if (trimmedLine.startsWith('<TRNAMT>')) {
          const amountStr = this.extractTag(trimmedLine, 'TRNAMT');
          const amount = parseFloat(amountStr);
          if (!isNaN(amount)) currentTransaction.valor = amount;
        }
        
        if (trimmedLine.startsWith('<MEMO>') || trimmedLine.startsWith('<NAME>')) {
          const desc = this.extractTag(trimmedLine, trimmedLine.startsWith('<MEMO>') ? 'MEMO' : 'NAME');
          if (desc) currentTransaction.descricao = desc;
        }
        
        if (trimmedLine.startsWith('<FITID>')) {
          const fitId = this.extractTag(trimmedLine, 'FITID');
          if (fitId) {
            currentTransaction.referenciaBancaria = fitId;
            currentTransaction.numeroDocumento = fitId;
          }
        }
        
        // Se encontrou uma nova transação ou chegou ao fim, processar a atual
        if (trimmedLine.includes('</STMTTRN>') || trimmedLine === '') {
          if (currentTransaction.data && currentTransaction.valor && currentTransaction.descricao) {
            transactions.push(currentTransaction as DadosTransacao);
          }
          currentTransaction = {};
        }
      }
    }
    
    return transactions;
  }

  /**
   * Valida se o conteúdo é um arquivo OFX válido
   */
  static isValidOFX(content: string): boolean {
    const ofxIndicators = [
      /OFXHEADER/i,
      /DATA:OFXSGML/i,
      /<OFX>/i,
      /<BANKMSGSRSV1>/i,
      /<STMTRS>/i,
      /<STMTTRN>/i
    ];

    return ofxIndicators.some(indicator => indicator.test(content));
  }

  /**
   * Extrai informações básicas do arquivo OFX (banco, conta, etc.)
   */
  static extractAccountInfo(content: string): {
    bankId?: string;
    accountId?: string;
    accountType?: string;
    currency?: string;
    balanceAmount?: number;
    balanceDate?: Date;
  } {
    const info: any = {};

    try {
      // Extrair ID do banco
      const bankId = this.extractTag(content, 'BANKID');
      if (bankId) info.bankId = bankId;

      // Extrair ID da conta
      const accountId = this.extractTag(content, 'ACCTID');
      if (accountId) info.accountId = accountId;

      // Extrair tipo da conta
      const accountType = this.extractTag(content, 'ACCTTYPE');
      if (accountType) info.accountType = accountType;

      // Extrair moeda
      const currency = this.extractTag(content, 'CURDEF');
      if (currency) info.currency = currency;

      // Extrair saldo
      const balanceAmount = this.extractTag(content, 'BALAMT');
      if (balanceAmount) {
        const amount = parseFloat(balanceAmount);
        if (!isNaN(amount)) info.balanceAmount = amount;
      }

      // Extrair data do saldo
      const balanceDate = this.extractTag(content, 'DTASOF');
      if (balanceDate) {
        const date = this.parseOFXDate(balanceDate);
        if (date) info.balanceDate = date;
      }

    } catch (error) {
      console.warn('Erro ao extrair informações da conta:', error);
    }

    return info;
  }

  /**
   * Obtém estatísticas do arquivo OFX
   */
  static getFileStatistics(buffer: Buffer): {
    totalTransactions: number;
    dateRange: { start?: Date; end?: Date };
    totalAmount: number;
    fileSize: number;
    isValid: boolean;
  } {
    try {
      const content = buffer.toString('utf-8');
      const isValid = this.isValidOFX(content);
      
      if (!isValid) {
        return {
          totalTransactions: 0,
          dateRange: {},
          totalAmount: 0,
          fileSize: buffer.length,
          isValid: false
        };
      }

      const transactions = this.parseOFXContent(content);
      const dates = transactions.map(t => t.data).filter(Boolean) as Date[];
      const amounts = transactions.map(t => t.valor).filter(v => !isNaN(v));

      return {
        totalTransactions: transactions.length,
        dateRange: {
          start: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined,
          end: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined,
        },
        totalAmount: amounts.reduce((sum, amount) => sum + amount, 0),
        fileSize: buffer.length,
        isValid: true
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do arquivo OFX:', error);
      return {
        totalTransactions: 0,
        dateRange: {},
        totalAmount: 0,
        fileSize: buffer.length,
        isValid: false
      };
    }
  }
}

// Função de conveniência para usar o parser
export function parseOFX(buffer: Buffer): DadosTransacao[] {
  return OFXParser.parse(buffer);
}

// Função para validar arquivo OFX
export function isValidOFXFile(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf-8');
    return OFXParser.isValidOFX(content);
  } catch {
    return false;
  }
}

// Função para obter informações do arquivo
export function getOFXFileInfo(buffer: Buffer) {
  return OFXParser.getFileStatistics(buffer);
}