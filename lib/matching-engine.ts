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
   * Busca match exato (valor + data + descrição idênticos)
   */
  private findExactMatch(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    usedTransactions: Set<string>
  ): MatchResult | null {
    console.log(`🔍 Buscando match exato para transação bancária:`, {
      id: bankTxn.id,
      memo: bankTxn.memo,
      amount: bankTxn.amount,
      posted_at: bankTxn.posted_at
    });

    for (const systemTxn of systemTransactions) {
      if (usedTransactions.has(systemTxn.id)) continue;

      // Verificar valor exato
      const amountDiff = Math.abs(bankTxn.amount - systemTxn.valor);
      const amountMatch = amountDiff < 0.01;
      
      // Verificar data exata
      const dateMatch = this.isSameDate(bankTxn.posted_at, systemTxn.data_lancamento);
      
      // Verificar descrição similar 
      // Usar payee se memo estiver vazio
      const bankDescription = bankTxn.memo?.trim() || bankTxn.payee?.trim() || '';
      const descriptionSimilarity = this.calculateTextSimilarity(
        bankDescription.toLowerCase(),
        systemTxn.descricao.toLowerCase().trim()
      );
      
      // Se valor e data são exatos, aceitar menor similaridade de descrição
      let minSimilarity = 85; // Padrão para match exato
      if (amountMatch && dateMatch) {
        minSimilarity = 40; // Reduzir para 40% quando valor e data são exatos
        console.log(`🎯 Valor e data exatos - reduzindo exigência de similaridade para ${minSimilarity}%`);
      }
      
      const descriptionMatch = descriptionSimilarity >= minSimilarity;

      console.log(`📊 Comparando com lançamento sistema:`, {
        systemId: systemTxn.id,
        systemDescricao: systemTxn.descricao,
        systemValor: systemTxn.valor,
        systemData: systemTxn.data_lancamento,
        amountMatch,
        amountDiff,
        dateMatch,
        descriptionSimilarity: descriptionSimilarity.toFixed(1),
        descriptionMatch
      });

      if (amountMatch && dateMatch && descriptionMatch) {
        console.log(`✅ Match exato encontrado!`, {
          bankId: bankTxn.id,
          systemId: systemTxn.id,
          score: 100
        });

        return {
          bankTransaction: bankTxn,
          systemTransaction: systemTxn,
          status: 'conciliado',
          matchScore: 100,
          matchReason: 'Valor, data e descrição idênticos',
          confidenceLevel: 'high',
          matchType: 'exact'
        };
      }
    }

    console.log(`❌ Nenhum match exato encontrado para transação ${bankTxn.id}`);
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
   * Regra de matching por valor e data com tolerância (SUGERIDO)
   */
  private applyValueDateRule(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    rule: MatchingRule,
    usedTransactions: Set<string>
  ): MatchResult | null {
    const { tolerancia_valor = 1, tolerancia_dias = 3 } = rule.parametros; // Valores padrão mais conservadores

    console.log(`🎯 Aplicando regra valor+data para transação ${bankTxn.id}:`, {
      tolerancia_valor,
      tolerancia_dias,
      memo: bankTxn.memo,
      amount: bankTxn.amount,
      posted_at: bankTxn.posted_at
    });

    for (const systemTxn of systemTransactions) {
      if (usedTransactions.has(systemTxn.id)) continue;

      // Verificar tolerância de valor (percentual ou valor absoluto pequeno)
      const valueTolerancePercent = (Math.abs(systemTxn.valor) * tolerancia_valor) / 100;
      const valueToleranceAbsolute = Math.max(valueTolerancePercent, 0.10); // Mínimo 10 centavos
      const valueDiff = Math.abs(bankTxn.amount - systemTxn.valor);
      const amountMatch = valueDiff <= valueToleranceAbsolute;

      // Verificar tolerância de data (alguns dias permitidos)
      const dateMatch = this.isWithinDateRange(
        bankTxn.posted_at, 
        systemTxn.data_lancamento, 
        tolerancia_dias
      );

      const dateDiff = this.getDaysDifference(bankTxn.posted_at, systemTxn.data_lancamento);

      console.log(`📊 Verificando lançamento ${systemTxn.id}:`, {
        descricao: systemTxn.descricao,
        valor: systemTxn.valor,
        data_lancamento: systemTxn.data_lancamento,
        valueDiff,
        valueToleranceAbsolute,
        amountMatch,
        dateDiff,
        tolerancia_dias,
        dateMatch
      });

      if (amountMatch && dateMatch) {
        // Calcular score baseado na precisão
        
        // Score menor para diferenças maiores
        let score = 90;
        if (valueDiff > 0.01) score -= (valueDiff / Math.abs(systemTxn.valor)) * 20; // Penalizar diferença de valor
        if (dateDiff > 0) score -= dateDiff * 5; // Penalizar diferença de data (5 pontos por dia)
        
        score = Math.max(score, 60); // Score mínimo de 60 para sugestões

        console.log(`✅ Match por regra valor+data encontrado!`, {
          bankId: bankTxn.id,
          systemId: systemTxn.id,
          score: Math.round(score),
          valueDiff,
          dateDiff
        });

        return {
          bankTransaction: bankTxn,
          systemTransaction: systemTxn,
          status: 'sugerido', // Sempre sugerido quando há tolerância
          matchScore: Math.round(score),
          matchReason: `Data e valor semelhantes (±${tolerancia_valor}%, ±${tolerancia_dias} dias)`,
          confidenceLevel: score >= 80 ? 'high' : 'medium',
          matchType: 'fuzzy'
        };
      }
    }

    console.log(`❌ Nenhum match por regra valor+data encontrado para transação ${bankTxn.id}`);
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

      const bankDescription = bankTxn.memo?.trim() || bankTxn.payee?.trim() || '';
      const similarity = this.calculateTextSimilarity(
        bankDescription.toLowerCase(),
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
   * Detecta transferências com lógica aprimorada
   */
  private detectTransfer(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    usedTransactions: Set<string>
  ): MatchResult | null {
    const transferKeywords = [
      'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
      'TRANSF-', 'TRANSF ', 'DOC', 'TED', 'PIX',
      'ENVIO', 'RECEBIMENTO', 'REMESSA', 'TEF',
      'TRANSFER NCIA ENTRADA', 'TRANSFER NCIA SAIDA',
      '[TRANSFER NCIA ENTRADA]', '[TRANSFER NCIA SAIDA]',
      'TRANSFERÊNCIA ENTRADA', 'TRANSFERÊNCIA SAIDA'
    ];
    
    const bankDescription = bankTxn.memo?.trim() || bankTxn.payee?.trim() || '';
    const memo = bankDescription.toUpperCase();

    // Verificar se é transferência por palavras-chave (mais abrangente)
    const isTransfer = transferKeywords.some(keyword => memo.includes(keyword));

    if (isTransfer) {
      console.log(`🔄 Transferência detectada no OFX: "${bankDescription}"`);
      
      // Buscar lançamentos de transferência no sistema com mesmo valor e data próxima
      for (const systemTxn of systemTransactions) {
        if (usedTransactions.has(systemTxn.id)) continue;
        
        // Verificar se é transferência no sistema
        const systemDesc = (systemTxn.descricao || '').toUpperCase();
        const systemDoc = (systemTxn.numero_documento || '').toUpperCase();
        const isSystemTransfer = systemTxn.tipo === 'transferencia' ||
                               transferKeywords.some(keyword => 
                                 systemDesc.includes(keyword) || systemDoc.includes(keyword)
                               );
        
        if (!isSystemTransfer) continue;
        
        // Verificar valor exato ou muito próximo
        const valueMatch = Math.abs(Math.abs(bankTxn.amount) - Math.abs(systemTxn.valor)) < 0.01;
        
        // Verificar data próxima (até 3 dias de diferença para transferências)
        const dateMatch = this.isWithinDateRange(bankTxn.posted_at, systemTxn.data_lancamento, 3);
        
        // Verificar se o sentido está correto (entrada no OFX = saída no sistema ou vice-versa)
        const correctDirection = this.isCorrectTransferDirection(bankTxn, systemTxn);
        
        console.log(`📊 Comparando transferência:`, {
          bankMemo: bankDescription,
          systemDesc: systemTxn.descricao,
          valueMatch,
          dateMatch,
          correctDirection,
          bankAmount: bankTxn.amount,
          systemAmount: systemTxn.valor
        });
        
        if (valueMatch && dateMatch) { // Removendo verificação de direção para ser mais flexível
          console.log(`✅ Match de transferência encontrado!`);
          return {
            bankTransaction: bankTxn,
            systemTransaction: systemTxn,
            status: 'transferencia',
            matchScore: 95,
            matchReason: 'Transferência identificada - valor e data corretos',
            confidenceLevel: 'high',
            matchType: 'rule'
          };
        }
      }
      
      // Se não encontrou correspondência exata, marcar como transferência sem match
      console.log(`🔍 Transferência detectada mas sem match no sistema`);
      return {
        bankTransaction: bankTxn,
        status: 'transferencia',
        matchScore: 75,
        matchReason: 'Transferência detectada por descrição - aguardando lançamento no sistema',
        confidenceLevel: 'medium',
        matchType: 'rule'
      };
    }

    return null;
  }

  /**
   * Verifica se a direção da transferência está correta
   */
  private isCorrectTransferDirection(bankTxn: BankTransaction, systemTxn: SystemTransaction): boolean {
    // Entrada no OFX (valor positivo) deve corresponder a saída no sistema (despesa/valor negativo)
    // Saída no OFX (valor negativo) deve corresponder a entrada no sistema (receita/valor positivo)
    
    const bankIsIncoming = bankTxn.amount > 0;
    const systemIsIncoming = systemTxn.valor > 0;
    
    // Para transferências, a direção deve ser oposta
    return bankIsIncoming !== systemIsIncoming;
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
   * Calcula diferença em dias entre duas datas
   */
  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula similaridade entre dois textos (algoritmo melhorado)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 100;
    
    // Normalizar textos removendo acentos, caracteres especiais e convertendo para minúsculo
    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais
        .replace(/\s+/g, ' ') // Remove espaços extras
        .trim();
    };

    const normalizedText1 = normalize(text1);
    const normalizedText2 = normalize(text2);
    
    console.log(`📝 Calculando similaridade:`, {
      original1: text1,
      original2: text2,
      normalized1: normalizedText1,
      normalized2: normalizedText2
    });

    // Se após normalização são iguais, retorna 100%
    if (normalizedText1 === normalizedText2) {
      console.log(`✅ Textos idênticos após normalização: 100%`);
      return 100;
    }

    const words1 = normalizedText1.split(/\s+/).filter(w => w.length > 2); // Palavras com mais de 2 caracteres
    const words2 = normalizedText2.split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 && words2.length === 0) return 100;
    if (words1.length === 0 || words2.length === 0) return 0;

    // Contar palavras em comum
    let matches = 0;
    const checked = new Set<string>();
    
    for (const word1 of words1) {
      if (checked.has(word1)) continue;
      
      // Busca palavra exata
      if (words2.includes(word1)) {
        matches++;
        checked.add(word1);
        continue;
      }
      
      // Busca palavra similar (começa com as mesmas 3 letras para palavras grandes)
      if (word1.length >= 4) {
        const prefix = word1.substring(0, 3);
        const similarWord = words2.find(w => w.startsWith(prefix) && w.length >= 4);
        if (similarWord && !checked.has(word1)) {
          matches += 0.8; // 80% de peso para match parcial
          checked.add(word1);
        }
      }
    }
    
    const totalWords = Math.max(words1.length, words2.length);
    const similarity = (matches / totalWords) * 100;
    
    console.log(`📊 Resultado similaridade:`, {
      words1,
      words2,
      matches,
      totalWords,
      similarity: similarity.toFixed(1)
    });
    
    return Math.round(similarity);
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
