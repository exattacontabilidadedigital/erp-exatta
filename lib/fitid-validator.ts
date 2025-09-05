/**
 * VALIDAÇÃO DE FITID PARA PREVENÇÃO DE ERROS DE CONCILIAÇÃO
 * 
 * Este utilitário usa o FITID (Financial Institution Transaction ID) para:
 * 1. Prevenir conciliação duplicada de uma mesma transação bancária
 * 2. Detectar tentativas de conciliação de transações já processadas
 * 3. Garantir integridade referencial usando o identificador único do banco
 */

export interface FITIDValidationResult {
  isValid: boolean;
  error?: string;
  conflictingTransactions?: any[];
  fitId?: string;
}

export class FITIDValidator {
  
  /**
   * Valida se uma transação pode ser conciliada baseada no FITID
   */
  static async validateForConciliation(
    bankTransactionId: string,
    supabase: any
  ): Promise<FITIDValidationResult> {
    
    try {
      // 1. Buscar a transação bancária com FITID
      const { data: bankTrans, error: bankError } = await supabase
        .from('bank_transactions')
        .select('id, fit_id, status_conciliacao, reconciliation_status, matched_lancamento_id')
        .eq('id', bankTransactionId)
        .single();

      if (bankError) {
        return {
          isValid: false,
          error: `Transação bancária não encontrada: ${bankError.message}`
        };
      }

      // 2. Se não tem FITID, permitir (pode ser transação manual ou importação antiga)
      if (!bankTrans.fit_id) {
        console.log('⚠️ Transação sem FITID - permitindo conciliação com cautela');
        return { isValid: true };
      }

      // 3. Verificar se já está conciliada
      if (bankTrans.status_conciliacao === 'conciliado' || 
          bankTrans.reconciliation_status === 'matched') {
        return {
          isValid: false,
          error: `Transação com FITID ${bankTrans.fit_id} já está conciliada`,
          fitId: bankTrans.fit_id
        };
      }

      // 4. Verificar se existem outras transações com mesmo FITID já conciliadas
      const { data: conflictingTrans, error: conflictError } = await supabase
        .from('bank_transactions')
        .select('id, fit_id, status_conciliacao, matched_lancamento_id, amount, posted_at')
        .eq('fit_id', bankTrans.fit_id)
        .eq('status_conciliacao', 'conciliado')
        .neq('id', bankTransactionId);

      if (conflictError) {
        console.error('❌ Erro ao verificar conflitos de FITID:', conflictError);
        // Permitir continuar mesmo com erro de verificação
        return { isValid: true };
      }

      if (conflictingTrans && conflictingTrans.length > 0) {
        return {
          isValid: false,
          error: `FITID ${bankTrans.fit_id} já foi usado em outra conciliação`,
          conflictingTransactions: conflictingTrans,
          fitId: bankTrans.fit_id
        };
      }

      // 5. Tudo OK - pode conciliar
      return { 
        isValid: true, 
        fitId: bankTrans.fit_id 
      };

    } catch (error) {
      console.error('❌ Erro na validação de FITID:', error);
      return {
        isValid: false,
        error: `Erro interno na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Busca transações potencialmente duplicadas baseado no FITID
   */
  static async findDuplicatesByFITID(
    fitId: string,
    supabase: any
  ): Promise<any[]> {
    if (!fitId) return [];

    try {
      const { data: duplicates, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('fit_id', fitId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar duplicatas por FITID:', error);
        return [];
      }

      return duplicates || [];
    } catch (error) {
      console.error('❌ Erro ao buscar duplicatas:', error);
      return [];
    }
  }

  /**
   * Gera relatório de integridade dos FITIDs
   */
  static async generateIntegrityReport(supabase: any) {
    try {
      console.log('📊 Gerando relatório de integridade FITID...');

      // Contar transações com FITID
      const { count: totalWithFITID } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .not('fit_id', 'is', null);

      // Contar transações sem FITID
      const { count: totalWithoutFITID } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .is('fit_id', null);

      // Buscar FITIDs duplicados
      const { data: duplicateFITIDs, error: dupError } = await supabase
        .rpc('find_duplicate_fitids'); // Função SQL personalizada

      const report = {
        total_with_fitid: totalWithFITID || 0,
        total_without_fitid: totalWithoutFITID || 0,
        duplicate_fitids: duplicateFITIDs || [],
        integrity_score: totalWithFITID ? ((totalWithFITID / (totalWithFITID + (totalWithoutFITID || 0))) * 100).toFixed(2) : '0'
      };

      console.log('📋 Relatório FITID:', report);
      return report;

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      return null;
    }
  }
}

// Função SQL para criar no banco (opcional)
export const CREATE_FITID_FUNCTIONS_SQL = `
-- Função para encontrar FITIDs duplicados
CREATE OR REPLACE FUNCTION find_duplicate_fitids()
RETURNS TABLE(fit_id TEXT, count_duplicates BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bt.fit_id,
    COUNT(*) as count_duplicates
  FROM bank_transactions bt
  WHERE bt.fit_id IS NOT NULL
  GROUP BY bt.fit_id
  HAVING COUNT(*) > 1
  ORDER BY count_duplicates DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar integridade de conciliação por FITID
CREATE OR REPLACE FUNCTION check_fitid_reconciliation_integrity()
RETURNS TABLE(
  fit_id TEXT, 
  transaction_count BIGINT,
  reconciled_count BIGINT,
  pending_count BIGINT,
  has_conflicts BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bt.fit_id,
    COUNT(*) as transaction_count,
    COUNT(CASE WHEN bt.status_conciliacao = 'conciliado' THEN 1 END) as reconciled_count,
    COUNT(CASE WHEN bt.status_conciliacao = 'pendente' THEN 1 END) as pending_count,
    (COUNT(CASE WHEN bt.status_conciliacao = 'conciliado' THEN 1 END) > 1) as has_conflicts
  FROM bank_transactions bt
  WHERE bt.fit_id IS NOT NULL
  GROUP BY bt.fit_id
  HAVING COUNT(*) > 1 OR COUNT(CASE WHEN bt.status_conciliacao = 'conciliado' THEN 1 END) > 1
  ORDER BY has_conflicts DESC, transaction_count DESC;
END;
$$ LANGUAGE plpgsql;
`;
