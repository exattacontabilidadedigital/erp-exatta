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
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
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
   * Valida se o OFX pertence à conta bancária selecionada
   */
  static async validateAccountMatch(
    ofxContent: string, 
    accountId: string, 
    supabaseClient: any
  ): Promise<{ valid: boolean; error?: string; accountInfo?: any }> {
    try {
      console.log('🔍 Validando correspondência do OFX com a conta selecionada...');
      
      // Extrair dados da conta do OFX
      const normalizedContent = ofxContent
        .replace(/\n|\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const ofxBankId = this.extractValue(normalizedContent, 'BANKID') || '';
      const ofxAccountId = this.extractValue(normalizedContent, 'ACCTID') || '';
      
      console.log('📋 Dados do OFX:', { ofxBankId, ofxAccountId });

      if (!ofxBankId || !ofxAccountId) {
        return { 
          valid: false, 
          error: 'Dados da conta não encontrados no arquivo OFX'
        };
      }

      // Buscar dados da conta bancária selecionada
      const { data: contaData, error: contaError } = await supabaseClient
        .from('contas_bancarias')
        .select(`
          id,
          agencia,
          conta,
          digito,
          bancos!inner (
            codigo,
            nome
          )
        `)
        .eq('id', accountId)
        .single();

      if (contaError || !contaData) {
        return { 
          valid: false, 
          error: 'Conta bancária não encontrada no sistema'
        };
      }

      console.log('📋 Dados da conta do sistema:', contaData);

      // Validar correspondência do banco - Banco do Brasil tem múltiplos códigos
      const systemBankCode = contaData.bancos.codigo;
      
      // Mapeamento de códigos do Banco do Brasil
      const bancoBrasilCodes = ['001', '01', '1', '004', '04', '4'];
      
      const bankMatches = 
        // Comparação direta
        systemBankCode === ofxBankId || 
        systemBankCode.padStart(3, '0') === ofxBankId.padStart(3, '0') ||
        // Banco do Brasil - aceitar qualquer código válido
        (bancoBrasilCodes.includes(systemBankCode) && bancoBrasilCodes.includes(ofxBankId)) ||
        // Verificação pelo nome do banco
        (contaData.bancos.nome?.toLowerCase().includes('banco do brasil') && 
         bancoBrasilCodes.includes(ofxBankId));

      console.log('🔍 Validação do banco:', {
        ofxBankId,
        systemBankCode,
        systemBankName: contaData.bancos.nome,
        bankMatches,
        isBancoBrasil: bancoBrasilCodes.includes(ofxBankId)
      });

      if (!bankMatches) {
        return {
          valid: false,
          error: `Banco do OFX (${ofxBankId}) não corresponde ao banco da conta selecionada (${contaData.bancos.codigo} - ${contaData.bancos.nome})`,
          accountInfo: {
            ofx: { bankId: ofxBankId, accountId: ofxAccountId },
            system: { 
              bankCode: contaData.bancos.codigo, 
              bankName: contaData.bancos.nome,
              agencia: contaData.agencia,
              conta: contaData.conta,
              digito: contaData.digito
            }
          }
        };
      }

      // Validar correspondência da conta (número da conta com possível dígito)
      const systemAccount = contaData.conta + (contaData.digito ? contaData.digito : '');
      const systemAccountOnly = contaData.conta;
      
      const accountMatches = 
        systemAccount === ofxAccountId || 
        systemAccountOnly === ofxAccountId ||
        systemAccount.replace(/[^0-9]/g, '') === ofxAccountId.replace(/[^0-9]/g, '') ||
        // Comparação mais flexível removendo zeros à esquerda
        parseInt(systemAccount, 10) === parseInt(ofxAccountId, 10) ||
        parseInt(systemAccountOnly, 10) === parseInt(ofxAccountId, 10);

      console.log('🔍 Validação da conta:', {
        ofxAccountId,
        systemAccount,
        systemAccountOnly,
        accountMatches
      });

      if (!accountMatches) {
        return {
          valid: false,
          error: `Conta do OFX (${ofxAccountId}) não corresponde à conta selecionada (${systemAccount})`,
          accountInfo: {
            ofx: { bankId: ofxBankId, accountId: ofxAccountId },
            system: { 
              bankCode: contaData.bancos.codigo, 
              bankName: contaData.bancos.nome,
              agencia: contaData.agencia,
              conta: contaData.conta,
              digito: contaData.digito
            }
          }
        };
      }

      console.log('✅ OFX corresponde à conta selecionada:', {
        banco: `${ofxBankId} → ${contaData.bancos.codigo} (${contaData.bancos.nome})`,
        conta: `${ofxAccountId} → ${systemAccount}`
      });
      
      return { 
        valid: true,
        accountInfo: {
          ofx: { bankId: ofxBankId, accountId: ofxAccountId },
          system: { 
            bankCode: contaData.bancos.codigo, 
            bankName: contaData.bancos.nome,
            agencia: contaData.agencia,
            conta: contaData.conta,
            digito: contaData.digito
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao validar correspondência da conta:', error);
      return { 
        valid: false, 
        error: 'Erro interno ao validar correspondência da conta'
      };
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
