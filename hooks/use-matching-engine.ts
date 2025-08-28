import { useState, useCallback } from 'react';

export interface BankTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
}

export interface SystemTransaction {
  id: string;
  data_lancamento: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: string;
}

export interface MatchSuggestion {
  bankTransaction: BankTransaction;
  systemTransaction: SystemTransaction;
  confidence: number;
  reasons: string[];
}

export interface MatchingResult {
  exactMatches: MatchSuggestion[];
  suggestedMatches: MatchSuggestion[];
  unmatchedBank: BankTransaction[];
  unmatchedSystem: SystemTransaction[];
}

export interface MatchingRule {
  id: string;
  name: string;
  conditions: {
    valueRange?: { min: number; max: number };
    descriptionKeywords?: string[];
    dateRange?: number; // dias de tolerância
  };
  priority: number;
  isActive: boolean;
}

export function useMatchingEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<MatchingResult | null>(null);

  const processMatching = useCallback(async (
    bankTransactions: BankTransaction[],
    systemTransactions: SystemTransaction[],
    rules: MatchingRule[] = []
  ): Promise<MatchingResult> => {
    setIsProcessing(true);
    
    try {
      const result: MatchingResult = {
        exactMatches: [],
        suggestedMatches: [],
        unmatchedBank: [...bankTransactions],
        unmatchedSystem: [...systemTransactions]
      };

      // Fase 1: Matching exato (valor e data iguais)
      console.log('🔍 Iniciando Fase A: Matching Exato...');
      
      for (let i = result.unmatchedBank.length - 1; i >= 0; i--) {
        const bankTxn = result.unmatchedBank[i];
        
        for (let j = result.unmatchedSystem.length - 1; j >= 0; j--) {
          const systemTxn = result.unmatchedSystem[j];
          
          if (isExactMatch(bankTxn, systemTxn)) {
            result.exactMatches.push({
              bankTransaction: bankTxn,
              systemTransaction: systemTxn,
              confidence: 1.0,
              reasons: ['Valor e data exatos']
            });
            
            result.unmatchedBank.splice(i, 1);
            result.unmatchedSystem.splice(j, 1);
            break;
          }
        }
      }

      // Fase 2: Matching baseado em regras
      console.log('🔍 Iniciando Fase B: Matching por Regras...');
      
      const activeRules = rules.filter(rule => rule.isActive).sort((a, b) => a.priority - b.priority);
      
      for (const rule of activeRules) {
        for (let i = result.unmatchedBank.length - 1; i >= 0; i--) {
          const bankTxn = result.unmatchedBank[i];
          
          for (let j = result.unmatchedSystem.length - 1; j >= 0; j--) {
            const systemTxn = result.unmatchedSystem[j];
            
            const match = evaluateRule(bankTxn, systemTxn, rule);
            if (match.confidence > 0.6) {
              result.suggestedMatches.push({
                bankTransaction: bankTxn,
                systemTransaction: systemTxn,
                confidence: match.confidence,
                reasons: match.reasons
              });
              
              result.unmatchedBank.splice(i, 1);
              result.unmatchedSystem.splice(j, 1);
              break;
            }
          }
        }
      }

      // Fase 3: Matching fuzzy (similaridade de descrição e proximidade de valor)
      console.log('🔍 Iniciando Fase C: Matching Fuzzy...');
      
      for (let i = result.unmatchedBank.length - 1; i >= 0; i--) {
        const bankTxn = result.unmatchedBank[i];
        
        for (let j = result.unmatchedSystem.length - 1; j >= 0; j--) {
          const systemTxn = result.unmatchedSystem[j];
          
          const fuzzyMatch = evaluateFuzzyMatch(bankTxn, systemTxn);
          if (fuzzyMatch.confidence > 0.5) {
            result.suggestedMatches.push({
              bankTransaction: bankTxn,
              systemTransaction: systemTxn,
              confidence: fuzzyMatch.confidence,
              reasons: fuzzyMatch.reasons
            });
            
            result.unmatchedBank.splice(i, 1);
            result.unmatchedSystem.splice(j, 1);
            break;
          }
        }
      }

      // Ordenar sugestões por confiança
      result.suggestedMatches.sort((a, b) => b.confidence - a.confidence);

      console.log('✅ Matching concluído:', {
        exatos: result.exactMatches.length,
        sugeridos: result.suggestedMatches.length,
        bancarios_nao_pareados: result.unmatchedBank.length,
        sistema_nao_pareados: result.unmatchedSystem.length
      });

      setResults(result);
      return result;

    } finally {
      setIsProcessing(false);
    }
  }, []);

  const confirmMatch = useCallback((matchId: string) => {
    if (!results) return;

    // Move da lista de sugestões para exatos
    const matchIndex = results.suggestedMatches.findIndex(m => 
      m.bankTransaction.id === matchId || m.systemTransaction.id === matchId
    );

    if (matchIndex >= 0) {
      const match = results.suggestedMatches[matchIndex];
      results.exactMatches.push({ ...match, confidence: 1.0 });
      results.suggestedMatches.splice(matchIndex, 1);
      setResults({ ...results });
    }
  }, [results]);

  const rejectMatch = useCallback((matchId: string) => {
    if (!results) return;

    // Remove da lista de sugestões e volta para não pareados
    const matchIndex = results.suggestedMatches.findIndex(m => 
      m.bankTransaction.id === matchId || m.systemTransaction.id === matchId
    );

    if (matchIndex >= 0) {
      const match = results.suggestedMatches[matchIndex];
      results.unmatchedBank.push(match.bankTransaction);
      results.unmatchedSystem.push(match.systemTransaction);
      results.suggestedMatches.splice(matchIndex, 1);
      setResults({ ...results });
    }
  }, [results]);

  return {
    processMatching,
    confirmMatch,
    rejectMatch,
    isProcessing,
    results
  };
}

// Funções auxiliares
function isExactMatch(bankTxn: BankTransaction, systemTxn: SystemTransaction): boolean {
  const valueMatch = Math.abs(bankTxn.valor - systemTxn.valor) < 0.01;
  const dateMatch = bankTxn.data === systemTxn.data_lancamento;
  const typeMatch = (bankTxn.tipo === 'credito' && systemTxn.tipo === 'receita') ||
                   (bankTxn.tipo === 'debito' && systemTxn.tipo === 'despesa');
  
  return valueMatch && dateMatch && typeMatch;
}

function evaluateRule(bankTxn: BankTransaction, systemTxn: SystemTransaction, rule: MatchingRule): {
  confidence: number;
  reasons: string[];
} {
  let confidence = 0;
  const reasons: string[] = [];

  // Verificar valor
  if (rule.conditions.valueRange) {
    const { min, max } = rule.conditions.valueRange;
    if (bankTxn.valor >= min && bankTxn.valor <= max && 
        systemTxn.valor >= min && systemTxn.valor <= max) {
      confidence += 0.3;
      reasons.push(`Valor dentro da faixa da regra "${rule.name}"`);
    }
  }

  // Verificar palavras-chave
  if (rule.conditions.descriptionKeywords) {
    const bankDesc = bankTxn.descricao.toLowerCase();
    const systemDesc = systemTxn.descricao.toLowerCase();
    
    const matchingKeywords = rule.conditions.descriptionKeywords.filter(keyword => 
      bankDesc.includes(keyword.toLowerCase()) || systemDesc.includes(keyword.toLowerCase())
    );
    
    if (matchingKeywords.length > 0) {
      confidence += 0.4 * (matchingKeywords.length / rule.conditions.descriptionKeywords.length);
      reasons.push(`Palavras-chave encontradas: ${matchingKeywords.join(', ')}`);
    }
  }

  // Verificar proximidade de data
  if (rule.conditions.dateRange) {
    const bankDate = new Date(bankTxn.data);
    const systemDate = new Date(systemTxn.data_lancamento);
    const daysDiff = Math.abs((bankDate.getTime() - systemDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= rule.conditions.dateRange) {
      confidence += 0.3;
      reasons.push(`Datas próximas (${daysDiff.toFixed(1)} dias de diferença)`);
    }
  }

  return { confidence: Math.min(confidence, 1.0), reasons };
}

function evaluateFuzzyMatch(bankTxn: BankTransaction, systemTxn: SystemTransaction): {
  confidence: number;
  reasons: string[];
} {
  let confidence = 0;
  const reasons: string[] = [];

  // Similaridade de valor (tolerância de 5%)
  const valueDiff = Math.abs(bankTxn.valor - systemTxn.valor);
  const valuePercent = valueDiff / Math.max(bankTxn.valor, systemTxn.valor);
  
  if (valuePercent <= 0.05) {
    confidence += 0.4;
    reasons.push(`Valores similares (${valuePercent.toFixed(2)}% de diferença)`);
  }

  // Similaridade de descrição
  const descSimilarity = calculateStringSimilarity(bankTxn.descricao, systemTxn.descricao);
  if (descSimilarity > 0.3) {
    confidence += 0.3 * descSimilarity;
    reasons.push(`Descrições similares (${(descSimilarity * 100).toFixed(1)}% similaridade)`);
  }

  // Proximidade de data (até 7 dias)
  const bankDate = new Date(bankTxn.data);
  const systemDate = new Date(systemTxn.data_lancamento);
  const daysDiff = Math.abs((bankDate.getTime() - systemDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) {
    confidence += 0.3 * (1 - daysDiff / 7);
    reasons.push(`Datas próximas (${daysDiff.toFixed(1)} dias)`);
  }

  return { confidence: Math.min(confidence, 1.0), reasons };
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchingWords = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  words1.forEach(word1 => {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matchingWords++;
    }
  });
  
  return matchingWords / totalWords;
}
