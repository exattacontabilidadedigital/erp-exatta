import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface BankTransaction {
  id: string;
  fit_id?: string;
  memo?: string;
  payee?: string;
  amount: number;
  posted_at: string;
  reconciliation_status?: string;
  matched_lancamento_id?: string;
  transaction_type?: string;
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
}

export interface ReconciliationPair {
  id: string;
  bankTransaction?: BankTransaction;
  systemTransaction?: SystemTransaction;
  systemTransactions?: SystemTransaction[];
  matchScore?: number;
  matchType?: string;
  status: 'matched' | 'suggested' | 'no_match' | 'transfer';
  matchReason?: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

export function useConciliacao() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<ReconciliationPair[]>([]);
  const [reconciliationId, setReconciliationId] = useState<string>('');

  const loadSuggestions = useCallback(async (bankAccountId: string, force = false) => {
    if (!bankAccountId) {
      setPairs([]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Carregando sugestões de conciliação...', { 
        bankAccountId, 
        force 
      });

      const url = `/api/reconciliation/suggestions?bank_account_id=${bankAccountId}${force ? '&force=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Dados de conciliação recebidos:', data);

      if (data.reconciliation_id) {
        setReconciliationId(data.reconciliation_id);
      }

      setPairs(data.pairs || []);

      toast({
        title: "Sucesso",
        description: `${data.pairs?.length || 0} pares de conciliação carregados`,
      });

      return data;

    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar sugestões",
        variant: "destructive",
      });
      setPairs([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const confirmMatch = useCallback(async (pair: ReconciliationPair, action: any) => {
    if (!reconciliationId) {
      toast({
        title: "Erro de Sessão",
        description: "Sessão de conciliação não encontrada. Recarregue a página.",
        variant: "destructive",
      });
      return;
    }

    if (!pair.bankTransaction?.id) {
      toast({
        title: "Erro de Dados", 
        description: "Transação bancária não encontrada.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      reconciliation_id: reconciliationId,
      bank_transaction_id: pair.bankTransaction.id,
      ...(pair.systemTransaction?.id && { 
        system_transaction_id: pair.systemTransaction.id 
      }),
      action: typeof action === 'string' ? action : action?.action || 'confirm'
    };

    try {
      const response = await fetch('/api/reconciliation/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
          // Usar mensagem padrão se não conseguir fazer parse
        }

        toast({
          title: "❌ Erro na Confirmação",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const actionType = action?.action || action;
      const successMessage = actionType === 'confirm_transfer' ? 'Transferência confirmada com sucesso' : 
                           actionType === 'reject' ? 'Match rejeitado com sucesso' :
                           'Conciliação confirmada com sucesso';

      toast({
        title: "✅ Sucesso!",
        description: successMessage,
      });

      // Atualizar status localmente
      setPairs(prevPairs => 
        prevPairs.map(p => 
          p.id === pair.id 
            ? { ...p, status: actionType === 'reject' ? 'no_match' as const : 'matched' as const }
            : p
        )
      );

      return true;

    } catch (error) {
      console.error('❌ Erro na confirmação:', error);
      
      let errorMessage = 'Falha ao confirmar conciliação';
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  }, [reconciliationId, toast]);

  const unlinkMatch = useCallback(async (pair: ReconciliationPair) => {
    try {
      const response = await fetch('/api/reconciliation/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconciliation_id: reconciliationId,
          bank_transaction_id: pair.bankTransaction?.id,
          system_transaction_id: pair.systemTransaction?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro ${response.status}` }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Sucesso",
        description: result.message || "Conciliação desfeita com sucesso",
      });

      // Atualizar o status do par localmente
      setPairs(prevPairs => 
        prevPairs.map(p => {
          if (p.id === pair.id) {
            if (p.systemTransaction && p.bankTransaction) {
              return { ...p, status: 'suggested' };
            }
            return { ...p, status: 'no_match' };
          }
          return p;
        })
      );

      return true;

    } catch (error) {
      console.error('❌ Erro ao desconciliar match:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Falha ao desfazer conciliação. Tente novamente.";
        
      toast({
        title: "Erro na Desconciliação",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  }, [reconciliationId, toast]);

  return {
    loading,
    pairs,
    reconciliationId,
    loadSuggestions,
    confirmMatch,
    unlinkMatch,
    setPairs
  };
}
