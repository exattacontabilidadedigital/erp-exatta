// =========================================================
// ALGORITMO DE MATCHING PARA CONCILIAÇÃO BANCÁRIA
// Baseado no blueprint fornecido
// =========================================================

export interface BankTransaction {
  id: string;
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

export interface SystemTransaction {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  centro_custo?: string;
  plano_conta?: string;
  numero_documento?: string;
  conta_bancaria_id?: string;
}

export interface MatchingRule {
  id: string;
  nome: string;
  tipo: 'valor_data' | 'descricao' | 'transferencia' | 'historico';
  parametros: {
    tolerancia_valor?: number; // Percentual
    tolerancia_dias?: number; // Dias
    similaridade_minima?: number; // Percentual
    palavras_chave?: string[];
  };
  peso: number;
  ativa: boolean;
}

export interface MatchResult {
  bankTransaction: BankTransaction;
  systemTransaction?: SystemTransaction;
  systemTransactions?: SystemTransaction[];
  status: 'conciliado' | 'sugerido' | 'transferencia' | 'sem_match';
  matchScore: number; // 0-100
  matchReason: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'fuzzy' | 'manual' | 'rule';
}

export interface MatchingSummary {
  total: number;
  conciliados: number;
  sugeridos: number;
  transferencias: number;
  sem_match: number;
  percentageComplete: number;
}

export class MatchingEngine {
  private rules: MatchingRule[] = [];

  constructor(rules: MatchingRule[] = []) {
    this.rules = rules;
  }

  /**
   * Executa o algoritmo de matching completo
   */
  async processMatching(
    bankTransactions: BankTransaction[],
    systemTransactions: SystemTransaction[],
    rules: MatchingRule[] = this.rules
  ): Promise<MatchResult[]> {
    console.log('🔍 Iniciando processo de matching...');
    console.log(`📊 Transações bancárias: ${bankTransactions.length}`);
    console.log(`📊 Lançamentos do sistema: ${systemTransactions.length}`);

    const results: MatchResult[] = [];
    const usedSystemTransactions = new Set<string>();

    // Fase 1: Matching Exato (valor + data)
    console.log('🎯 Fase 1: Matching Exato...');
    for (const bankTxn of bankTransactions) {
      const exactMatch = this.findExactMatch(bankTxn, systemTransactions, usedSystemTransactions);
      if (exactMatch) {
        results.push(exactMatch);
        usedSystemTransactions.add(exactMatch.systemTransaction!.id);
      }
    }

    // Fase 2: Matching por Regras
    console.log('🎯 Fase 2: Matching por Regras...');
    const activeRules = rules.filter(rule => rule.ativa).sort((a, b) => b.peso - a.peso);
    
    for (const bankTxn of bankTransactions) {
      if (results.find(r => r.bankTransaction.id === bankTxn.id)) continue;
      
      const ruleMatch = this.findRuleMatch(bankTxn, systemTransactions, activeRules, usedSystemTransactions);
      if (ruleMatch) {
        results.push(ruleMatch);
        if (ruleMatch.systemTransaction) {
          usedSystemTransactions.add(ruleMatch.systemTransaction.id);
        }
      }
    }

    // Fase 3: Detecção de Transferências
    console.log('🎯 Fase 3: Detecção de Transferências...');
    for (const bankTxn of bankTransactions) {
      if (results.find(r => r.bankTransaction.id === bankTxn.id)) continue;
      
      const transferMatch = this.detectTransfer(bankTxn, systemTransactions, usedSystemTransactions);
      if (transferMatch) {
        results.push(transferMatch);
        if (transferMatch.systemTransaction) {
          usedSystemTransactions.add(transferMatch.systemTransaction.id);
        }
      }
    }

    // Fase 4: Sem Match
    console.log('🎯 Fase 4: Identificando sem match...');
    for (const bankTxn of bankTransactions) {
      if (results.find(r => r.bankTransaction.id === bankTxn.id)) continue;
      
      results.push({
        bankTransaction: bankTxn,
        status: 'sem_match',
        matchScore: 0,
        matchReason: 'Nenhuma correspondência encontrada',
        confidenceLevel: 'low',
        matchType: 'manual'
      });
    }

    console.log(`✅ Matching concluído: ${results.length} resultados`);
    return results;
  }

  /**
   * Busca match exato (valor + data)
   */
  private findExactMatch(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    usedTransactions: Set<string>
  ): MatchResult | null {
    for (const systemTxn of systemTransactions) {
      if (usedTransactions.has(systemTxn.id)) continue;

      const amountMatch = Math.abs(bankTxn.amount - systemTxn.valor) < 0.01;
      const dateMatch = this.isSameDate(bankTxn.posted_at, systemTxn.data_lancamento);

      if (amountMatch && dateMatch) {
        return {
          bankTransaction: bankTxn,
          systemTransaction: systemTxn,
          status: 'conciliado',
          matchScore: 100,
          matchReason: 'Valor e data exatos',
          confidenceLevel: 'high',
          matchType: 'exact'
        };
      }
    }

    return null;
  }

  /**
   * Busca match por regras configuradas
   */
  private findRuleMatch(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    rules: MatchingRule[],
    usedTransactions: Set<string>
  ): MatchResult | null {
    for (const rule of rules) {
      const match = this.applyRule(bankTxn, systemTransactions, rule, usedTransactions);
      if (match) {
        return match;
      }
    }

    return null;
  }

  /**
   * Aplica uma regra específica
   */
  private applyRule(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    rule: MatchingRule,
    usedTransactions: Set<string>
  ): MatchResult | null {
    switch (rule.tipo) {
      case 'valor_data':
        return this.applyValueDateRule(bankTxn, systemTransactions, rule, usedTransactions);
      case 'descricao':
        return this.applyDescriptionRule(bankTxn, systemTransactions, rule, usedTransactions);
      case 'historico':
        return this.applyHistoryRule(bankTxn, systemTransactions, rule, usedTransactions);
      default:
        return null;
    }
  }

  /**
   * Regra de matching por valor e data com tolerância
   */
  private applyValueDateRule(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    rule: MatchingRule,
    usedTransactions: Set<string>
  ): MatchResult | null {
    const { tolerancia_valor = 0, tolerancia_dias = 0 } = rule.parametros;

    for (const systemTxn of systemTransactions) {
      if (usedTransactions.has(systemTxn.id)) continue;

      // Verificar tolerância de valor
      const valueTolerance = (systemTxn.valor * tolerancia_valor) / 100;
      const amountMatch = Math.abs(bankTxn.amount - systemTxn.valor) <= valueTolerance;

      // Verificar tolerância de data
      const dateMatch = this.isWithinDateRange(
        bankTxn.posted_at, 
        systemTxn.data_lancamento, 
        tolerancia_dias
      );

      if (amountMatch && dateMatch) {
        const score = this.calculateScore(amountMatch, dateMatch, rule.peso);
        return {
          bankTransaction: bankTxn,
          systemTransaction: systemTxn,
          status: score >= 80 ? 'conciliado' : 'sugerido',
          matchScore: score,
          matchReason: `Valor e data com tolerância (${tolerancia_valor}%, ${tolerancia_dias} dias)`,
          confidenceLevel: score >= 80 ? 'high' : 'medium',
          matchType: 'rule'
        };
      }
    }

    return null;
  }

  /**
   * Regra de matching por similaridade de descrição
   */
  private applyDescriptionRule(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    rule: MatchingRule,
    usedTransactions: Set<string>
  ): MatchResult | null {
    const { similaridade_minima = 80 } = rule.parametros;

    for (const systemTxn of systemTransactions) {
      if (usedTransactions.has(systemTxn.id)) continue;

      const similarity = this.calculateTextSimilarity(
        bankTxn.memo.toLowerCase(),
        systemTxn.descricao.toLowerCase()
      );

      if (similarity >= similaridade_minima) {
        const score = (similarity * rule.peso) / 10;
        return {
          bankTransaction: bankTxn,
          systemTransaction: systemTxn,
          status: score >= 80 ? 'conciliado' : 'sugerido',
          matchScore: score,
          matchReason: `Descrição similar (${similarity.toFixed(1)}%)`,
          confidenceLevel: score >= 80 ? 'high' : 'medium',
          matchType: 'rule'
        };
      }
    }

    return null;
  }

  /**
   * Regra de matching por histórico (padrões anteriores)
   */
  private applyHistoryRule(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    rule: MatchingRule,
    usedTransactions: Set<string>
  ): MatchResult | null {
    // Implementar lógica de histórico baseada em matches anteriores
    // Por enquanto, retorna null
    return null;
  }

  /**
   * Detecta transferências por palavras-chave
   */
  private detectTransfer(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    usedTransactions: Set<string>
  ): MatchResult | null {
    const transferKeywords = ['TRANSFER', 'DOC', 'PIX', 'TED', 'TRANSFERENCIA', 'TEF'];
    const memo = bankTxn.memo.toUpperCase();

    const isTransfer = transferKeywords.some(keyword => memo.includes(keyword));

    if (isTransfer) {
      // Buscar lançamentos de transferência no sistema
      const transferTransactions = systemTransactions.filter(txn => 
        txn.tipo === 'transferencia' && 
        !usedTransactions.has(txn.id) &&
        Math.abs(txn.valor - bankTxn.amount) < 0.01
      );

      if (transferTransactions.length > 0) {
        return {
          bankTransaction: bankTxn,
          systemTransaction: transferTransactions[0],
          status: 'transferencia',
          matchScore: 90,
          matchReason: 'Transferência detectada por palavras-chave',
          confidenceLevel: 'high',
          matchType: 'rule'
        };
      } else {
        return {
          bankTransaction: bankTxn,
          status: 'transferencia',
          matchScore: 70,
          matchReason: 'Transferência detectada, mas sem contrapartida no sistema',
          confidenceLevel: 'medium',
          matchType: 'rule'
        };
      }
    }

    return null;
  }

  /**
   * Calcula score de matching
   */
  private calculateScore(amountMatch: boolean, dateMatch: boolean, ruleWeight: number): number {
    let score = 0;
    if (amountMatch) score += 50;
    if (dateMatch) score += 30;
    score += (ruleWeight * 2); // Peso da regra
    return Math.min(score, 100);
  }

  /**
   * Verifica se duas datas são iguais
   */
  private isSameDate(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  }

  /**
   * Verifica se duas datas estão dentro de uma faixa de tolerância
   */
  private isWithinDateRange(date1: string, date2: string, toleranceDays: number): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= toleranceDays;
  }

  /**
   * Calcula similaridade entre dois textos (algoritmo simples)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 100;
    
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        matches++;
      }
    }
    
    const totalWords = Math.max(words1.length, words2.length);
    return (matches / totalWords) * 100;
  }

  /**
   * Gera resumo do matching
   */
  generateSummary(results: MatchResult[]): MatchingSummary {
    const total = results.length;
    const conciliados = results.filter(r => r.status === 'conciliado').length;
    const sugeridos = results.filter(r => r.status === 'sugerido').length;
    const transferencias = results.filter(r => r.status === 'transferencia').length;
    const sem_match = results.filter(r => r.status === 'sem_match').length;
    
    return {
      total,
      conciliados,
      sugeridos,
      transferencias,
      sem_match,
      percentageComplete: total > 0 ? ((conciliados + sugeridos + transferencias) / total) * 100 : 0
    };
  }
}
