// =========================================================
// PARSER OFX ROBUSTO PARA CONCILIAÇÃO BANCÁRIA
// Baseado no blueprint fornecido
// =========================================================

export interface OFXTransaction {
  fit_id: string;
  memo: string;
  payee?: string;
  amount: number;
  posted_at: string;
  transaction_type: 'DEBIT' | 'CREDIT';
  check_number?: string;
  reference_number?: string;
  bank_reference?: string;
}

export interface OFXAccount {
  account_id: string;
  bank_id: string;
  account_type: string;
  balance: number;
  balance_date: string;
  transactions: OFXTransaction[];
}

export interface OFXData {
  bank_id: string;
  accounts: OFXAccount[];
  start_date: string;
  end_date: string;
}

export interface ParsedBankStatement {
  bank_statement_id: string;
  conta_bancaria_id: string;
  empresa_id: string;
  file_name: string;
  file_hash: string;
  file_size: number;
  period_start: string;
  period_end: string;
  total_transactions: number;
  transactions: OFXTransaction[];
  raw_ofx_data: string;
}

export class OFXParserEnhanced {
  /**
   * Parse do arquivo OFX com tratamento robusto de erros
   */
  static parse(ofxContent: string): OFXData {
    try {
      console.log('🔍 Iniciando parsing do arquivo OFX...');
      console.log('📏 Tamanho do conteúdo:', ofxContent.length);
      
      // Normalizar conteúdo
      const normalizedContent = ofxContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
      
      console.log('📄 Conteúdo normalizado:', normalizedContent.substring(0, 300) + '...');

      // Extrair informações básicas
      const bankId = this.extractValue(normalizedContent, 'BANKID') || 'UNKNOWN';
      const accountId = this.extractValue(normalizedContent, 'ACCTID') || 'UNKNOWN';
      const accountType = this.extractValue(normalizedContent, 'ACCTTYPE') || 'CHECKING';
      
      // Extrair datas do extrato
      const startDate = this.extractValue(normalizedContent, 'DTSTART') || '';
      const endDate = this.extractValue(normalizedContent, 'DTEND') || '';
      
      console.log('📅 Datas extraídas:', { startDate, endDate });
      
      // Extrair saldo
      const balanceAmount = parseFloat(this.extractValue(normalizedContent, 'BALAMT') || '0');
      const balanceDate = this.extractValue(normalizedContent, 'DTASOF') || endDate;

      // Extrair transações
      const transactions = this.extractTransactions(normalizedContent);

      console.log(`✅ Parsing concluído: ${transactions.length} transações encontradas`);
      console.log('📊 Transações extraídas:', transactions.map(t => ({
        fit_id: t.fit_id,
        amount: t.amount,
        memo: t.memo,
        posted_at: t.posted_at
      })));

      // Se as datas do período estiverem vazias, calcular baseado nas transações
      let finalStartDate = startDate;
      let finalEndDate = endDate;
      
      if (!finalStartDate || !finalEndDate) {
        if (transactions.length > 0) {
          const dates = transactions.map(t => new Date(t.posted_at)).sort();
          finalStartDate = finalStartDate || this.formatDate(dates[0].toISOString().split('T')[0].replace(/-/g, ''));
          finalEndDate = finalEndDate || this.formatDate(dates[dates.length - 1].toISOString().split('T')[0].replace(/-/g, ''));
        }
      }
      
      console.log('📅 Datas finais:', { finalStartDate, finalEndDate });

      const account: OFXAccount = {
        account_id: accountId,
        bank_id: bankId,
        account_type: accountType,
        balance: balanceAmount,
        balance_date: this.formatDate(balanceDate),
        transactions
      };

      return {
        bank_id: bankId,
        accounts: [account],
        start_date: this.formatDate(finalStartDate),
        end_date: this.formatDate(finalEndDate)
      };

    } catch (error) {
      console.error('❌ Erro ao analisar arquivo OFX:', error);
      throw new Error('Formato de arquivo OFX inválido');
    }
  }

  /**
   * Extrai valor de uma tag específica
   */
  private static extractValue(content: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extrai todas as transações do arquivo OFX
   */
  private static extractTransactions(content: string): OFXTransaction[] {
    const transactions: OFXTransaction[] = [];
    
    // Regex para encontrar blocos de transações
    const transactionRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gis;
    let match;

    while ((match = transactionRegex.exec(content)) !== null) {
      try {
        const transactionBlock = match[1];
        
        const fitId = this.extractValue(transactionBlock, 'FITID') || '';
        const memo = this.extractValue(transactionBlock, 'MEMO') || '';
        const payee = this.extractValue(transactionBlock, 'NAME') || '';
        const amount = parseFloat(this.extractValue(transactionBlock, 'TRNAMT') || '0');
        const postedAt = this.extractValue(transactionBlock, 'DTPOSTED') || '';
        const transactionType = this.extractValue(transactionBlock, 'TRNTYPE') || 'DEBIT';
        const checkNumber = this.extractValue(transactionBlock, 'CHECKNUM') || '';
        const referenceNumber = this.extractValue(transactionBlock, 'REFNUM') || '';
        const bankReference = this.extractValue(transactionBlock, 'BANKREF') || '';

        if (fitId && postedAt) {
          transactions.push({
            fit_id: fitId,
            memo: memo,
            payee: payee || undefined,
            amount: amount,
            posted_at: this.formatDate(postedAt),
            transaction_type: transactionType.toUpperCase() as 'DEBIT' | 'CREDIT',
            check_number: checkNumber || undefined,
            reference_number: referenceNumber || undefined,
            bank_reference: bankReference || undefined
          });
        }
      } catch (error) {
        console.warn('⚠️ Erro ao processar transação:', error);
        // Continua processando outras transações
      }
    }

    return transactions;
  }

  /**
   * Formata data OFX para formato ISO
   */
  private static formatDate(ofxDate: string): string {
    if (!ofxDate) return '';
    
    try {
      // Formato OFX: YYYYMMDDHHMMSS ou YYYYMMDD
      if (ofxDate.length === 8) {
        // YYYYMMDD
        const year = ofxDate.substring(0, 4);
        const month = ofxDate.substring(4, 6);
        const day = ofxDate.substring(6, 8);
        return `${year}-${month}-${day}`;
      } else if (ofxDate.length >= 14) {
        // YYYYMMDDHHMMSS
        const year = ofxDate.substring(0, 4);
        const month = ofxDate.substring(4, 6);
        const day = ofxDate.substring(6, 8);
        const hour = ofxDate.substring(8, 10);
        const minute = ofxDate.substring(10, 12);
        const second = ofxDate.substring(12, 14);
        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
      }
      
      return ofxDate;
    } catch (error) {
      console.warn('⚠️ Erro ao formatar data:', ofxDate, error);
      return ofxDate;
    }
  }

  /**
   * Valida se o arquivo é um OFX válido
   */
  static validateOFX(content: string): { valid: boolean; error?: string } {
    try {
      console.log('🔍 Validando arquivo OFX...');
      console.log('📏 Tamanho do conteúdo:', content.length);
      
      if (!content || content.trim().length === 0) {
        console.log('❌ Arquivo vazio');
        return { valid: false, error: 'Arquivo vazio' };
      }

      // Verificar se contém tags OFX básicas
      const requiredTags = ['OFX', 'BANKMSGSRSV1', 'STMTTRNRS', 'STMTRS'];
      for (const tag of requiredTags) {
        if (!content.includes(`<${tag}`)) {
          console.log(`❌ Tag obrigatória não encontrada: ${tag}`);
          return { valid: false, error: `Tag obrigatória não encontrada: ${tag}` };
        }
      }

      // Verificar se tem pelo menos uma transação
      if (!content.includes('<STMTTRN>')) {
        console.log('❌ Nenhuma transação encontrada');
        return { valid: false, error: 'Nenhuma transação encontrada no arquivo' };
      }

      console.log('✅ Arquivo OFX válido');
      return { valid: true };
    } catch (error) {
      console.log('❌ Erro ao validar arquivo OFX:', error);
      return { valid: false, error: 'Erro ao validar arquivo OFX' };
    }
  }

  /**
   * Gera hash do arquivo para evitar duplicatas
   */
  static generateFileHash(content: string): string {
    // Implementação simples de hash (em produção, usar crypto)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extrai informações do arquivo para o banco de dados
   */
  static parseForDatabase(
    ofxContent: string, 
    fileName: string, 
    contaBancariaId: string, 
    empresaId: string
  ): ParsedBankStatement {
    const ofxData = this.parse(ofxContent);
    const account = ofxData.accounts[0];
    
    return {
      bank_statement_id: '', // Será gerado pelo banco
      conta_bancaria_id: contaBancariaId,
      empresa_id: empresaId,
      file_name: fileName,
      file_hash: this.generateFileHash(ofxContent),
      file_size: ofxContent.length,
      period_start: ofxData.start_date,
      period_end: ofxData.end_date,
      total_transactions: account.transactions.length,
      transactions: account.transactions,
      raw_ofx_data: ofxContent
    };
  }
}
