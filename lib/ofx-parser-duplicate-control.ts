// =========================================================
// PARSER OFX COM CONTROLE DE DUPLICIDADE
// Implementa estratégia anti-duplicatas conforme blueprint
// =========================================================

import crypto from 'crypto';

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
  file_hash: string; // Hash do arquivo para controle de duplicidade
  file_name: string;
  original_content: string; // Conteúdo original para debugging
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingImportId?: string;
  existingImportDate?: string;
  message: string;
  duplicateTransactions: {
    fit_id: string;
    existingId?: string;
    status?: string;
  }[];
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
  duplicate_check?: DuplicateCheckResult;
}

export class OFXParserWithDuplicateControl {
  
  /**
   * Gera hash SHA-256 do conteúdo do arquivo para controle de duplicidade
   */
  static generateFileHash(content: string): string {
    return crypto.createHash('sha256')
      .update(content.trim().replace(/\s+/g, ' ')) // Normalizar espaços
      .digest('hex');
  }

  /**
   * Parse do arquivo OFX com verificação de duplicidade
   */
  static parse(
    ofxContent: string, 
    fileName: string = 'unknown.ofx'
  ): OFXData {
    try {
      console.log('🔍 Iniciando parsing OFX com controle de duplicidade...');
      console.log('📄 Arquivo:', fileName);
      console.log('📏 Tamanho:', ofxContent.length);
      
      // Gerar hash do arquivo
      const fileHash = this.generateFileHash(ofxContent);
      console.log('🔐 Hash do arquivo:', fileHash);
      
      // Normalizar conteúdo
      const normalizedContent = ofxContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
      
      // Extrair informações básicas
      const bankId = this.extractValue(normalizedContent, 'BANKID') || 'UNKNOWN';
      const accountId = this.extractValue(normalizedContent, 'ACCTID') || 'UNKNOWN';
      const accountType = this.extractValue(normalizedContent, 'ACCTTYPE') || 'CHECKING';
      
      console.log('🏦 Conta extraída:', { bankId, accountId, accountType });
      
      // Extrair datas do extrato
      const startDate = this.extractValue(normalizedContent, 'DTSTART') || '';
      const endDate = this.extractValue(normalizedContent, 'DTEND') || '';
      
      console.log('📅 Período:', { startDate, endDate });
      
      // Extrair saldo
      const balanceAmount = parseFloat(this.extractValue(normalizedContent, 'BALAMT') || '0');
      const balanceDate = this.extractValue(normalizedContent, 'DTASOF') || endDate;

      console.log('💰 Saldo:', { balanceAmount, balanceDate });

      // Extrair transações
      const transactions = this.extractTransactions(normalizedContent);

      console.log(`✅ Parsing concluído: ${transactions.length} transações encontradas`);
      
      // Verificar se há FIT_IDs duplicados no próprio arquivo
      const fitIds = transactions.map(t => t.fit_id);
      const duplicateFitIds = fitIds.filter((id, index) => fitIds.indexOf(id) !== index);
      
      if (duplicateFitIds.length > 0) {
        console.log('⚠️ FIT_IDs duplicados no arquivo:', duplicateFitIds);
      }

      // Calcular datas finais se não encontradas
      let finalStartDate = startDate;
      let finalEndDate = endDate;
      
      if (!finalStartDate || !finalEndDate) {
        if (transactions.length > 0) {
          const dates = transactions.map(t => new Date(t.posted_at)).sort();
          finalStartDate = finalStartDate || this.formatDate(dates[0].toISOString().split('T')[0].replace(/-/g, ''));
          finalEndDate = finalEndDate || this.formatDate(dates[dates.length - 1].toISOString().split('T')[0].replace(/-/g, ''));
        }
      }

      return {
        bank_id: bankId,
        accounts: [{
          account_id: accountId,
          bank_id: bankId,
          account_type: accountType,
          balance: balanceAmount,
          balance_date: this.formatDate(balanceDate),
          transactions: transactions
        }],
        start_date: this.formatDate(finalStartDate),
        end_date: this.formatDate(finalEndDate),
        file_hash: fileHash,
        file_name: fileName,
        original_content: ofxContent
      };

    } catch (error) {
      console.error('❌ Erro no parsing OFX:', error);
      throw new Error(`Falha no parsing do arquivo OFX: ${error}`);
    }
  }

  /**
   * Verifica duplicidade de arquivo antes da importação
   */
  static async checkFileDuplicate(
    fileHash: string,
    contaBancariaId: string,
    empresaId: string,
    supabaseClient: any
  ): Promise<{
    isDuplicate: boolean;
    existingImport?: any;
    message: string;
  }> {
    try {
      console.log('🔍 Verificando duplicidade de arquivo...', { fileHash, contaBancariaId });

      const { data, error } = await supabaseClient
        .rpc('check_duplicate_ofx_import', {
          p_arquivo_hash: fileHash,
          p_conta_bancaria_id: contaBancariaId,
          p_empresa_id: empresaId
        });

      if (error) {
        console.error('❌ Erro ao verificar duplicidade:', error);
        return {
          isDuplicate: false,
          message: 'Erro ao verificar duplicidade, mas pode prosseguir'
        };
      }

      const result = data[0];
      console.log('📊 Resultado verificação duplicidade:', result);

      return {
        isDuplicate: result.is_duplicate,
        existingImport: result.is_duplicate ? {
          id: result.existing_import_id,
          date: result.existing_import_date
        } : undefined,
        message: result.message
      };

    } catch (error) {
      console.error('❌ Erro na verificação de duplicidade:', error);
      return {
        isDuplicate: false,
        message: 'Erro na verificação, mas pode prosseguir'
      };
    }
  }

  /**
   * Verifica quais transações (FIT_IDs) já existem no banco
   */
  static async checkTransactionDuplicates(
    fitIds: string[],
    contaBancariaId: string,
    supabaseClient: any
  ): Promise<{
    fit_id: string;
    isDuplicate: boolean;
    existingTransactionId?: string;
    statusAtual?: string;
  }[]> {
    try {
      console.log('🔍 Verificando duplicidade de transações...', { fitIds: fitIds.length });

      const { data, error } = await supabaseClient
        .rpc('check_duplicate_transactions', {
          p_fit_ids: fitIds,
          p_conta_bancaria_id: contaBancariaId
        });

      if (error) {
        console.error('❌ Erro ao verificar transações duplicadas:', error);
        return fitIds.map(fit_id => ({
          fit_id,
          isDuplicate: false
        }));
      }

      console.log('📊 Transações duplicadas encontradas:', data.filter((t: any) => t.is_duplicate));

      return data.map((row: any) => ({
        fit_id: row.fit_id,
        isDuplicate: row.is_duplicate,
        existingTransactionId: row.existing_transaction_id,
        statusAtual: row.status_atual
      }));

    } catch (error) {
      console.error('❌ Erro na verificação de transações:', error);
      return fitIds.map(fit_id => ({
        fit_id,
        isDuplicate: false
      }));
    }
  }

  /**
   * Filtra transações removendo duplicatas
   */
  static filterDuplicateTransactions(
    transactions: OFXTransaction[],
    duplicateCheck: {
      fit_id: string;
      isDuplicate: boolean;
      statusAtual?: string;
    }[]
  ): {
    newTransactions: OFXTransaction[];
    duplicateTransactions: OFXTransaction[];
    alreadyConciliated: OFXTransaction[];
  } {
    const newTransactions: OFXTransaction[] = [];
    const duplicateTransactions: OFXTransaction[] = [];
    const alreadyConciliated: OFXTransaction[] = [];

    for (const transaction of transactions) {
      const duplicateInfo = duplicateCheck.find(d => d.fit_id === transaction.fit_id);
      
      if (!duplicateInfo || !duplicateInfo.isDuplicate) {
        // Transação nova
        newTransactions.push(transaction);
      } else if (duplicateInfo.statusAtual === 'conciliado') {
        // Transação já conciliada
        alreadyConciliated.push(transaction);
      } else {
        // Transação duplicada mas não conciliada
        duplicateTransactions.push(transaction);
      }
    }

    console.log('📊 Resultado filtragem:', {
      novas: newTransactions.length,
      duplicadas: duplicateTransactions.length,
      jaConciliadas: alreadyConciliated.length
    });

    return {
      newTransactions,
      duplicateTransactions,
      alreadyConciliated
    };
  }

  // === MÉTODOS DE PARSING (mantidos do parser original) ===

  private static extractValue(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private static extractTransactions(content: string): OFXTransaction[] {
    const transactions: OFXTransaction[] = [];
    
    // Procurar seção de transações
    const stmttrnsRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    
    while ((match = stmttrnsRegex.exec(content)) !== null) {
      const transactionContent = match[1];
      
      try {
        const transaction = this.parseTransaction(transactionContent);
        if (transaction.fit_id) { // Só adicionar se tiver FIT_ID válido
          transactions.push(transaction);
        } else {
          console.warn('⚠️ Transação sem FIT_ID ignorada:', transaction);
        }
      } catch (error) {
        console.error('❌ Erro ao processar transação:', error);
        console.error('Conteúdo da transação:', transactionContent);
      }
    }
    
    return transactions;
  }

  private static parseTransaction(content: string): OFXTransaction {
    const trntype = this.extractValue(content, 'TRNTYPE');
    const dtposted = this.extractValue(content, 'DTPOSTED');
    const trnamt = this.extractValue(content, 'TRNAMT');
    const fitid = this.extractValue(content, 'FITID');
    const memo = this.extractValue(content, 'MEMO');
    const payee = this.extractValue(content, 'PAYEE') || this.extractValue(content, 'NAME');
    const checknum = this.extractValue(content, 'CHECKNUM');
    const refnum = this.extractValue(content, 'REFNUM');

    const amount = parseFloat(trnamt);
    const transactionType: 'DEBIT' | 'CREDIT' = amount < 0 ? 'DEBIT' : 'CREDIT';

    return {
      fit_id: fitid || `MISSING_${Date.now()}_${Math.random()}`, // Gerar FIT_ID se não existir
      memo: memo || 'Sem descrição',
      payee: payee || undefined,
      amount: amount,
      posted_at: this.formatDate(dtposted),
      transaction_type: transactionType,
      check_number: checknum || undefined,
      reference_number: refnum || undefined,
      bank_reference: undefined
    };
  }

  private static formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Remover timezone se existir
    const cleanDate = dateStr.replace(/\[.*?\]/, '').trim();
    
    // Formato: YYYYMMDD ou YYYYMMDDHHMMSS
    if (/^\d{8}$/.test(cleanDate)) {
      const year = cleanDate.substring(0, 4);
      const month = cleanDate.substring(4, 6);
      const day = cleanDate.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    if (/^\d{14}$/.test(cleanDate)) {
      const year = cleanDate.substring(0, 4);
      const month = cleanDate.substring(4, 6);
      const day = cleanDate.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    return dateStr;
  }
}
