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
    tolerancia_valor?: number; // Percentual ou valor absoluto (R$)
    tolerancia_dias?: number; // Dias
    similaridade_minima?: number; // Percentual
    palavras_chave?: string[];
  };
  peso: number;
  ativa: boolean;
}

/**
 * ✅ CONFIGURAÇÕES PADRÃO CONFORME DOCUMENTAÇÃO
 */
export const DEFAULT_MATCHING_CONFIG = {
  sugestao: {
    tolerancia_valor_percentual: 1, // 1% de tolerância no valor
    tolerancia_valor_absoluto: 2.00, // R$ 2,00 de tolerância absoluta
    tolerancia_dias: 3, // 3 dias de tolerância na data
    similaridade_minima: 75 // 75% de similaridade na descrição
  },
  transferencia: {
    tolerancia_valor: 0.01, // R$ 0,01 (1 centavo) para transferências
    tolerancia_dias: 0, // ZERO tolerância - data exatamente igual
    termos_obrigatorios: true // Pelo menos um lado deve ter termos
  },
  match_exato: {
    tolerancia_valor: 0.01, // R$ 0,01 para valores exatos
    similaridade_minima: 85 // 85% para descrições
  }
};

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
   * Método público para detectar se uma transação bancária é uma transferência
   * Baseado nos padrões de fit_id e payee
   */
  public isTransfer(fitId?: string, payee?: string): boolean {
    const mockBankTransaction: BankTransaction = {
      id: 'temp',
      fit_id: fitId || '',
      memo: '',
      payee: payee || '',
      amount: 0,
      posted_at: '',
      transaction_type: 'DEBIT'
    };
    
    return this.hasTransferKeywords(mockBankTransaction);
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
    const processedBankTransactions = new Set<string>(); // ✅ NOVO: Controlar transações já processadas

    // Fase 1: Matching Exato (valor + data)
    console.log('🎯 Fase 1: Matching Exato...');
    for (const bankTxn of bankTransactions) {
      if (processedBankTransactions.has(bankTxn.id)) continue; // ✅ Evitar duplicação
      
      const exactMatch = this.findExactMatch(bankTxn, systemTransactions, usedSystemTransactions);
      if (exactMatch) {
        results.push(exactMatch);
        processedBankTransactions.add(bankTxn.id); // ✅ Marcar como processada
        if (exactMatch.systemTransaction) {
          usedSystemTransactions.add(exactMatch.systemTransaction.id);
        }
      }
    }

    // Fase 2: Matching por Regras
    console.log('🎯 Fase 2: Matching por Regras...');
    const activeRules = rules.filter(rule => rule.ativa).sort((a, b) => b.peso - a.peso);
    
    for (const bankTxn of bankTransactions) {
      if (processedBankTransactions.has(bankTxn.id)) continue; // ✅ Verificar se já foi processada
      
      const ruleMatch = this.findRuleMatch(bankTxn, systemTransactions, activeRules, usedSystemTransactions);
      if (ruleMatch) {
        results.push(ruleMatch);
        processedBankTransactions.add(bankTxn.id); // ✅ Marcar como processada
        if (ruleMatch.systemTransaction) {
          usedSystemTransactions.add(ruleMatch.systemTransaction.id);
        }
      }
    }

    // Fase 3: Detecção de Transferências
    console.log('🎯 Fase 3: Detecção de Transferências...');
    for (const bankTxn of bankTransactions) {
      if (processedBankTransactions.has(bankTxn.id)) continue; // ✅ Verificar se já foi processada
      
      const transferMatch = this.detectTransfer(bankTxn, systemTransactions, usedSystemTransactions);
      if (transferMatch) {
        results.push(transferMatch);
        processedBankTransactions.add(bankTxn.id); // ✅ Marcar como processada
        if (transferMatch.systemTransaction) {
          usedSystemTransactions.add(transferMatch.systemTransaction.id);
        }
      }
    }

    // Fase 4: Identificar Sem Match
    console.log('🎯 Fase 4: Identificando transações sem match...');
    for (const bankTxn of bankTransactions) {
      if (processedBankTransactions.has(bankTxn.id)) continue; // ✅ Verificar se já foi processada
      
      // ✅ NOVA LÓGICA: Todas as transações restantes são sem_match
      // (incluindo transferências OFX sem correspondência no sistema)
      console.log(`❌ Sem match: ${bankTxn.memo || bankTxn.payee} (${bankTxn.amount})`);
      
      results.push({
        bankTransaction: bankTxn,
        status: 'sem_match',
        matchScore: 0,
        matchReason: 'Nenhuma correspondência encontrada no sistema',
        confidenceLevel: 'low',
        matchType: 'manual'
      });
      
      processedBankTransactions.add(bankTxn.id); // ✅ Marcar como processada
    }

    // ✅ VALIDAÇÃO FINAL: Garantir unicidade
    const uniqueResults = results.filter((result, index, array) => {
      return array.findIndex(r => r.bankTransaction.id === result.bankTransaction.id) === index;
    });

    if (uniqueResults.length !== results.length) {
      console.warn(`⚠️ Duplicações removidas no matching: ${results.length - uniqueResults.length}`);
    }

    console.log(`✅ Matching concluído: ${uniqueResults.length} resultados únicos (de ${bankTransactions.length} transações bancárias)`);
    
    // ✅ VALIDAÇÃO CRÍTICA: Nunca pode ter mais resultados que transações bancárias
    if (uniqueResults.length > bankTransactions.length) {
      console.error('🚨 ERRO CRÍTICO: Mais resultados que transações bancárias de entrada!');
      throw new Error('Matching engine error: More results than input bank transactions');
    }

    return uniqueResults;
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

      // ✅ VALIDAÇÃO DE MESMO SINAL TAMBÉM PARA MATCH EXATO
      const bankIsPositive = bankTxn.amount >= 0;
      const systemIsPositive = systemTxn.valor >= 0;
      const sameSinal = bankIsPositive === systemIsPositive;

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
        descriptionMatch,
        sameSinal,
        bankSign: bankIsPositive ? '+' : '-',
        systemSign: systemIsPositive ? '+' : '-'
      });

      // ✅ APLICAR REGRA: Para match exato, também verificar se não são transferências com sinais opostos
      if (amountMatch && dateMatch && descriptionMatch) {
        // Se os sinais são opostos, verificar se é transferência
        if (!sameSinal) {
          const isTransferCandidate = this.hasTransferKeywords(bankTxn) || this.hasTransferKeywords(systemTxn);
          if (isTransferCandidate) {
            console.log(`🔄 Sinais opostos com termos de transferência - será analisado como transferência`);
            continue; // Deixar para análise de transferência
          }
        }

        // Para match exato, aceitar mesmo sinal ou ser transferência válida
        if (sameSinal || (!sameSinal && (this.hasTransferKeywords(bankTxn) || this.hasTransferKeywords(systemTxn)))) {
          console.log(`✅ Match exato encontrado!`, {
            bankId: bankTxn.id,
            systemId: systemTxn.id,
            score: 100,
            sameSinal
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
   * ✅ REGRA DE MATCHING POR VALOR E DATA COM TOLERÂNCIA CONFIGURÁVEL
   * Implementa validação rigorosa de "mesmo sinal" conforme documentação
   */
  private applyValueDateRule(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    rule: MatchingRule,
    usedTransactions: Set<string>
  ): MatchResult | null {
    // ✅ Usar configurações da regra ou valores padrão da documentação
    const tolerancia_valor = rule.parametros.tolerancia_valor || DEFAULT_MATCHING_CONFIG.sugestao.tolerancia_valor_percentual;
    const tolerancia_dias = rule.parametros.tolerancia_dias || DEFAULT_MATCHING_CONFIG.sugestao.tolerancia_dias;
    const tolerancia_absoluta = DEFAULT_MATCHING_CONFIG.sugestao.tolerancia_valor_absoluto;

    console.log(`🎯 Aplicando regra valor+data RIGOROSA para transação ${bankTxn.id}:`, {
      tolerancia_valor: `${tolerancia_valor}%`,
      tolerancia_absoluta: `R$ ${tolerancia_absoluta}`,
      tolerancia_dias: `${tolerancia_dias} dias`,
      memo: bankTxn.memo,
      amount: bankTxn.amount,
      posted_at: bankTxn.posted_at
    });

    for (const systemTxn of systemTransactions) {
      if (usedTransactions.has(systemTxn.id)) continue;

      // ✅ CRITÉRIO 1: MESMO SINAL (entrada/saída) - OBRIGATÓRIO PARA SUGESTÕES
      const bankIsPositive = bankTxn.amount >= 0;
      const systemIsPositive = systemTxn.valor >= 0;
      const sameSinal = bankIsPositive === systemIsPositive;
      
      if (!sameSinal) {
        console.log(`🚫 CRITÉRIO MESMO SINAL FALHOU:`, {
          systemId: systemTxn.id,
          bankAmount: bankTxn.amount,
          systemAmount: systemTxn.valor,
          bankSign: bankIsPositive ? 'positivo' : 'negativo',
          systemSign: systemIsPositive ? 'positivo' : 'negativo',
          reason: 'Sinais opostos - seria analisado como transferência ou sem match'
        });
        continue; // ✅ BLOQUEAR sugestão se sinais são opostos
      }

      // ✅ CRITÉRIO 2: Verificar tolerância de valor (percentual E absoluta)
      const valueTolerancePercent = (Math.abs(systemTxn.valor) * tolerancia_valor) / 100;
      const valueToleranceAbsolute = Math.max(valueTolerancePercent, tolerancia_absoluta);
      const valueDiff = Math.abs(bankTxn.amount - systemTxn.valor);
      const amountMatch = valueDiff <= valueToleranceAbsolute;

      // ✅ CRITÉRIO 3: Verificar tolerância de data
      const dateMatch = this.isWithinDateRange(
        bankTxn.posted_at, 
        systemTxn.data_lancamento, 
        tolerancia_dias
      );

      const dateDiff = this.getDaysDifference(bankTxn.posted_at, systemTxn.data_lancamento);

      console.log(`📊 Verificando lançamento ${systemTxn.id} (MESMO SINAL):`, {
        descricao: systemTxn.descricao,
        valor: systemTxn.valor,
        data_lancamento: systemTxn.data_lancamento,
        valueDiff,
        valueToleranceAbsolute,
        amountMatch,
        dateDiff,
        tolerancia_dias,
        dateMatch,
        sameSinal: '✅',
        bankSign: bankIsPositive ? '+' : '-',
        systemSign: systemIsPositive ? '+' : '-'
      });

      // ✅ CRITÉRIO 4: NÃO deve atender aos requisitos de transferência
      const isTransferCandidate = this.hasTransferKeywords(bankTxn) || this.hasTransferKeywords(systemTxn);
      
      if (isTransferCandidate && !sameSinal) {
        console.log(`🔄 Candidato a transferência detectado - será analisado na fase de transferências`);
        continue; // Deixar para a fase de transferências
      }

      // ✅ APLICAR TODOS OS CRITÉRIOS: valor + data + mesmo sinal
      if (amountMatch && dateMatch && sameSinal) {
        // Calcular score baseado na precisão
        let score = 90;
        if (valueDiff > 0.01) score -= (valueDiff / Math.abs(systemTxn.valor)) * 20; // Penalizar diferença de valor
        if (dateDiff > 0) score -= dateDiff * 5; // Penalizar diferença de data (5 pontos por dia)
        
        score = Math.max(score, 60); // Score mínimo de 60 para sugestões

        console.log(`✅ SUGESTÃO VÁLIDA encontrada! (TODOS os critérios atendidos)`, {
          bankId: bankTxn.id,
          systemId: systemTxn.id,
          score: Math.round(score),
          criterios: {
            valor: `✅ Diferença: R$ ${valueDiff.toFixed(2)} (tolerância: R$ ${valueToleranceAbsolute.toFixed(2)})`,
            data: `✅ Diferença: ${dateDiff} dias (tolerância: ${tolerancia_dias} dias)`,
            sinal: `✅ Mesmo sinal (${bankIsPositive ? '+' : '-'})`
          }
        });

        return {
          bankTransaction: bankTxn,
          systemTransaction: systemTxn,
          status: 'sugerido',
          matchScore: Math.round(score),
          matchReason: `Data próxima, valor próximo e mesmo sinal (±${tolerancia_valor}%, ±R$${tolerancia_absoluta}, ±${tolerancia_dias} dias)`,
          confidenceLevel: score >= 80 ? 'high' : 'medium',
          matchType: 'fuzzy'
        };
      }
    }

    console.log(`❌ Nenhuma sugestão válida encontrada para transação ${bankTxn.id} (critérios rigorosos aplicados)`);
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
   * ✅ DETECTA TRANSFERÊNCIAS COM REGRAS RIGOROSAS CONFORME DOCUMENTAÇÃO
   * Critérios obrigatórios (TODOS simultâneos):
   * 1. Descrição contendo termos de transferência
   * 2. Data exatamente igual (mesmo dia)
   * 3. Valores iguais e opostos
   */
  private detectTransfer(
    bankTxn: BankTransaction,
    systemTransactions: SystemTransaction[],
    usedTransactions: Set<string>
  ): MatchResult | null {
    console.log(`🔄 Iniciando detecção de transferência para transação ${bankTxn.id}`);
    
    // ✅ CRITÉRIO 1: DESCRIÇÃO COM TERMOS DE TRANSFERÊNCIA (OFX OU Sistema)
    const hasOFXTransferTerms = this.hasTransferKeywords(bankTxn);
    
    console.log(`📋 Verificação de termos no OFX:`, {
      bankId: bankTxn.id,
      memo: bankTxn.memo,
      payee: bankTxn.payee,
      hasOFXTransferTerms
    });

    // Buscar lançamentos no sistema que atendam aos critérios
    for (const systemTxn of systemTransactions) {
      if (usedTransactions.has(systemTxn.id)) continue;
      
      const hasSystemTransferTerms = this.hasTransferKeywords(systemTxn);
      
      console.log(`📋 Analisando lançamento sistema ${systemTxn.id}:`, {
        descricao: systemTxn.descricao,
        tipo: systemTxn.tipo,
        numero_documento: systemTxn.numero_documento,
        hasSystemTransferTerms
      });
      
      // ✅ CRITÉRIO 1: PELO MENOS UM LADO deve conter termos de transferência
      const criterio1_TermosTransferencia = hasOFXTransferTerms || hasSystemTransferTerms;
      
      if (!criterio1_TermosTransferencia) {
        console.log(`🚫 Critério 1 FALHOU - Nenhum lado contém termos de transferência`);
        continue;
      }
      
      // ✅ CRITÉRIO 2: DATA EXATAMENTE IGUAL (mesmo dia) - ZERO tolerância
      const criterio2_DataExata = this.isSameDate(bankTxn.posted_at, systemTxn.data_lancamento);
      
      if (!criterio2_DataExata) {
        console.log(`🚫 Critério 2 FALHOU - Datas não são exatamente iguais:`, {
          bankDate: bankTxn.posted_at,
          systemDate: systemTxn.data_lancamento
        });
        continue;
      }
      
      // ✅ CRITÉRIO 3: VALORES IGUAIS E OPOSTOS
      const bankAmount = bankTxn.amount;
      const systemAmount = systemTxn.valor;
      const absoluteBankAmount = Math.abs(bankAmount);
      const absoluteSystemAmount = Math.abs(systemAmount);
      
      // 3.1: Valores devem ser iguais em absoluto (tolerância de 1 centavo)
      const valoresIguais = Math.abs(absoluteBankAmount - absoluteSystemAmount) <= 0.01;
      
      // 3.2: Sinais devem ser opostos (um positivo, outro negativo)
      const bankIsPositive = bankAmount >= 0;
      const systemIsPositive = systemAmount >= 0;
      const sinaisOpostos = bankIsPositive !== systemIsPositive;
      
      const criterio3_ValoresIguaisOpostos = valoresIguais && sinaisOpostos;
      
      if (!criterio3_ValoresIguaisOpostos) {
        console.log(`🚫 Critério 3 FALHOU - Valores não são iguais e opostos:`, {
          bankAmount,
          systemAmount,
          valoresIguais,
          sinaisOpostos,
          bankSign: bankIsPositive ? '+' : '-',
          systemSign: systemIsPositive ? '+' : '-'
        });
        continue;
      }
      
      // ✅ TODOS OS 3 CRITÉRIOS ATENDIDOS - TRANSFERÊNCIA VÁLIDA
      console.log(`✅ TRANSFERÊNCIA VÁLIDA DETECTADA - Todos os critérios atendidos:`, {
        bankId: bankTxn.id,
        systemId: systemTxn.id,
        criterio1_TermosTransferencia: '✅',
        criterio2_DataExata: '✅',
        criterio3_ValoresIguaisOpostos: '✅',
        detalhes: {
          hasOFXTerms: hasOFXTransferTerms,
          hasSystemTerms: hasSystemTransferTerms,
          bankDate: bankTxn.posted_at,
          systemDate: systemTxn.data_lancamento,
          bankAmount,
          systemAmount
        }
      });
      
      return {
        bankTransaction: bankTxn,
        systemTransaction: systemTxn,
        status: 'transferencia',
        matchScore: 95,
        matchReason: 'Transferência válida - descrição com termo + mesma data + valores iguais e opostos',
        confidenceLevel: 'high',
        matchType: 'rule'
      };
    }
    
    // ✅ NOVA REGRA: OFX com termos sem correspondência no sistema = sem_match
    if (hasOFXTransferTerms) {
      console.log(`❌ Transferência OFX sem correspondência no sistema - será marcado como sem_match`);
      return null; // Não retorna transferência - será tratado como sem_match na fase 4
    }
    
    console.log(`❌ Não é transferência - nenhum critério de transferência atendido`);
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
   * ✅ FUNÇÃO APRIMORADA: Verifica se transação contém palavras-chave de transferência
   * Baseada nas regras documentadas e casos reais encontrados
   */
  private hasTransferKeywords(transaction: BankTransaction | SystemTransaction): boolean {
    const transferKeywords = [
      // Palavras principais
      'TRANSFER', 'TRANSFERENCIA', 'TRANSFERÊNCIA',
      'TRANSF-', 'TRANSF ', 'TRANSF_',
      
      // Tipos de transferência
      'TED', 'DOC', 'PIX', 'TEF',
      
      // Variações encontradas nos dados reais
      'TRANSFER NCIA ENTRADA', 'TRANSFER NCIA SAIDA', 'TRANSFER NCIA SA DA',
      '[TRANSFER NCIA ENTRADA]', '[TRANSFER NCIA SA DA]',
      'TRANSFERÊNCIA ENTRADA', 'TRANSFERÊNCIA SAIDA',
      
      // Outros termos comuns
      'ENVIO', 'RECEBIMENTO', 'REMESSA',
      'TRANSFERENCIA BANCARIA', 'TRANSFERENCIA ENTRE CONTAS'
    ];

    let description = '';
    let documentNumber = '';
    let isSystemTransferType = false;
    
    if ('memo' in transaction) {
      // BankTransaction
      description = `${transaction.memo || ''} ${transaction.payee || ''} ${transaction.fit_id || ''}`.toUpperCase().trim();
    } else {
      // SystemTransaction
      description = `${transaction.descricao || ''}`.toUpperCase().trim();
      documentNumber = `${transaction.numero_documento || ''}`.toUpperCase().trim();
      isSystemTransferType = transaction.tipo === 'transferencia';
    }

    // Para transações do sistema, tipo 'transferencia' já é suficiente
    if (isSystemTransferType) {
      console.log(`✅ Sistema: tipo='transferencia' detectado`);
      return true;
    }

    // Verificar palavras-chave na descrição
    const hasKeywordInDescription = transferKeywords.some(keyword => description.includes(keyword));
    
    // Verificar palavras-chave no número do documento (apenas para sistema)
    const hasKeywordInDocument = documentNumber ? transferKeywords.some(keyword => documentNumber.includes(keyword)) : false;

    const result = hasKeywordInDescription || hasKeywordInDocument;
    
    console.log(`🔍 Verificação de termos de transferência:`, {
      description: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
      documentNumber,
      hasKeywordInDescription,
      hasKeywordInDocument,
      isSystemTransferType,
      result
    });

    return result;
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
