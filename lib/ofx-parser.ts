export interface OFXTransaction {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  date: string;
  description: string;
  memo?: string;
  checkNumber?: string;
}

export interface OFXAccount {
  accountId: string;
  bankId: string;
  accountType: string;
  balance: number;
  balanceDate: string;
  transactions: OFXTransaction[];
}

export interface OFXData {
  bankId: string;
  accounts: OFXAccount[];
  startDate: string;
  endDate: string;
}

export class OFXParser {
  static parse(ofxContent: string): OFXData {
    try {
      // Remove quebras de linha desnecessárias e normaliza o conteúdo
      const normalizedContent = ofxContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();

      // Extrai informações básicas
      const bankId = this.extractValue(normalizedContent, 'BANKID') || 'UNKNOWN';
      const accountId = this.extractValue(normalizedContent, 'ACCTID') || 'UNKNOWN';
      const accountType = this.extractValue(normalizedContent, 'ACCTTYPE') || 'CHECKING';
      
      // Extrai datas do extrato
      const startDate = this.extractValue(normalizedContent, 'DTSTART') || '';
      const endDate = this.extractValue(normalizedContent, 'DTEND') || '';
      
      // Extrai saldo
      const balanceAmount = parseFloat(this.extractValue(normalizedContent, 'BALAMT') || '0');
      const balanceDate = this.extractValue(normalizedContent, 'DTASOF') || endDate;

      // Extrai transações
      const transactions = this.extractTransactions(normalizedContent);

      const account: OFXAccount = {
        accountId,
        bankId,
        accountType,
        balance: balanceAmount,
        balanceDate: this.formatDate(balanceDate),
        transactions
      };

      return {
        bankId,
        accounts: [account],
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate)
      };

    } catch (error) {
      console.error('Erro ao analisar arquivo OFX:', error);
      throw new Error('Formato de arquivo OFX inválido');
    }
  }

  private static extractValue(content: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>([^<]*)`);
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private static extractTransactions(content: string): OFXTransaction[] {
    const transactions: OFXTransaction[] = [];
    
    // Busca por blocos STMTTRN
    const transactionBlocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g);
    
    if (!transactionBlocks) {
      return transactions;
    }

    transactionBlocks.forEach((block, index) => {
      try {
        const trnType = this.extractValue(block, 'TRNTYPE');
        const dtPosted = this.extractValue(block, 'DTPOSTED');
        const trnAmt = this.extractValue(block, 'TRNAMT');
        const fitId = this.extractValue(block, 'FITID');
        const memo = this.extractValue(block, 'MEMO');
        const name = this.extractValue(block, 'NAME');
        const checkNum = this.extractValue(block, 'CHECKNUM');

        if (!trnAmt || !dtPosted) {
          console.warn(`Transação ${index + 1} ignorada: dados obrigatórios ausentes`);
          return;
        }

        const amount = parseFloat(trnAmt);
        const type: 'DEBIT' | 'CREDIT' = amount < 0 ? 'DEBIT' : 'CREDIT';

        transactions.push({
          id: fitId || `TXN_${index + 1}_${Date.now()}`,
          type,
          amount: Math.abs(amount),
          date: this.formatDate(dtPosted),
          description: name || memo || 'Transação bancária',
          memo: memo || undefined,
          checkNumber: checkNum || undefined
        });

      } catch (error) {
        console.warn(`Erro ao processar transação ${index + 1}:`, error);
      }
    });

    return transactions;
  }

  private static formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      // OFX usa formato YYYYMMDD ou YYYYMMDDHHMMSS
      const cleanDate = dateStr.replace(/[^\d]/g, '').substring(0, 8);
      
      if (cleanDate.length !== 8) {
        throw new Error('Data inválida');
      }

      const year = cleanDate.substring(0, 4);
      const month = cleanDate.substring(4, 6);
      const day = cleanDate.substring(6, 8);

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('Erro ao formatar data:', dateStr, error);
      return dateStr;
    }
  }

  static validateOFX(content: string): boolean {
    try {
      // Verificações básicas de formato OFX
      const hasOFXHeader = content.includes('OFXHEADER') || content.includes('<OFX>');
      const hasAccountInfo = content.includes('<BANKACCTFROM>') || content.includes('<ACCTID>');
      const hasTransactions = content.includes('<STMTTRN>') || content.includes('<BANKTRANLIST>');

      return hasOFXHeader && hasAccountInfo && hasTransactions;
    } catch (error) {
      return false;
    }
  }
}

export default OFXParser;
