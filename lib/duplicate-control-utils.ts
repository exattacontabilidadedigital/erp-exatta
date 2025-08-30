// =========================================================
// UTILITIES PARA CONTROLE DE DUPLICIDADE
// Funções auxiliares para o sistema anti-duplicidade
// =========================================================

export interface BankTransactionStatus {
  status_conciliacao: 'pendente' | 'conciliado' | 'ignorado';
  is_duplicate?: boolean;
  reconciliation_rate?: number;
}

export interface DuplicateCheckResult {
  fit_id: string;
  is_duplicate: boolean;
  existing_transaction_id?: string;
  status_atual?: string;
}

export interface ReconciliationStats {
  total_transactions: number;
  reconciled_transactions: number;
  pending_transactions: number;
  reconciliation_rate: number;
}

// Função para verificar duplicatas por FIT_ID
export async function checkDuplicateTransactions(
  fitIds: string[], 
  bankStatementId: string
): Promise<DuplicateCheckResult[]> {
  try {
    const response = await fetch('/api/bank-transactions/check-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fit_ids: fitIds,
        bank_statement_id: bankStatementId,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar duplicatas');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
    return [];
  }
}

// Função para obter estatísticas de conciliação
export async function getReconciliationStats(
  bankAccountId: string,
  dateStart: string,
  dateEnd: string
): Promise<ReconciliationStats | null> {
  try {
    const response = await fetch(`/api/bank-transactions/reconciliation-stats?` + new URLSearchParams({
      bank_account_id: bankAccountId,
      date_start: dateStart,
      date_end: dateEnd,
    }));

    if (!response.ok) {
      throw new Error('Erro ao obter estatísticas');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return null;
  }
}

// Função para marcar transação como ignorada
export async function markTransactionAsIgnored(transactionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/bank-transactions/${transactionId}/ignore`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao marcar como ignorada:', error);
    return false;
  }
}

// Função para resetar status de transação para pendente
export async function resetTransactionStatus(transactionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/bank-transactions/${transactionId}/reset`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao resetar status:', error);
    return false;
  }
}

// Função para criar match aprimorado
export async function createEnhancedMatch(
  bankTransactionId: string,
  systemTransactionId: string,
  matchScore: number,
  matchType: 'manual' | 'suggested' | 'auto' | 'exact' | 'fuzzy',
  reconciliationSessionId?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/matches/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bank_transaction_id: bankTransactionId,
        system_transaction_id: systemTransactionId,
        match_score: matchScore,
        match_type: matchType,
        reconciliation_session_id: reconciliationSessionId,
        confidence_level: matchScore > 0.9 ? 'high' : matchScore > 0.7 ? 'medium' : 'low',
        status: 'confirmed',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao criar match aprimorado:', error);
    return false;
  }
}

// Função para buscar transações pendentes usando a nova view
export async function getPendingTransactions(
  bankAccountId?: string,
  limit?: number
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (bankAccountId) params.append('bank_account_id', bankAccountId);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`/api/bank-transactions/pending?${params}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar transações pendentes');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar transações pendentes:', error);
    return [];
  }
}

// Função para obter badge de status baseado no status_conciliacao
export function getStatusBadge(status: 'pendente' | 'conciliado' | 'ignorado') {
  switch (status) {
    case 'conciliado':
      return {
        label: 'Conciliado',
        variant: 'default' as const,
        color: 'bg-green-100 text-green-800',
        icon: '✅'
      };
    case 'ignorado':
      return {
        label: 'Ignorado',
        variant: 'secondary' as const,
        color: 'bg-gray-100 text-gray-800',
        icon: '⏭️'
      };
    case 'pendente':
    default:
      return {
        label: 'Pendente',
        variant: 'outline' as const,
        color: 'bg-yellow-100 text-yellow-800',
        icon: '⏳'
      };
  }
}

// Função para verificar se uma transação deve aparecer esmaecida
export function shouldShowFaded(status: 'pendente' | 'conciliado' | 'ignorado'): boolean {
  return status === 'conciliado' || status === 'ignorado';
}

// Função para formatar taxa de conciliação
export function formatReconciliationRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}
