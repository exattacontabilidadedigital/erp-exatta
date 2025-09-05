  // ✅ FUNÇÃO SIMPLIFICADA - FLUXO DIRETO: CLICA → API ATUALIZA → RECARREGA → CARD VERDE
  const handleConfirmTransfer = async (pair: ReconciliationPair) => {
    console.log('🚀 Confirmando transferência:', {
      bankTransactionId: pair.bankTransaction?.id,
      systemTransactionId: pair.systemTransaction?.id,
      statusAtual: pair.bankTransaction?.status_conciliacao
    });

    if (!pair.bankTransaction || !pair.systemTransaction) {
      console.error('❌ Dados insuficientes para confirmar transferência');
      return;
    }

    try {
      const response = await fetch('/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: pair.bankTransaction.id,
          system_transaction_id: pair.systemTransaction.id,
          confidence_level: 'high',
          rule_applied: 'transfer_confirmation'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API:', errorText);
        throw new Error(`Erro ao confirmar transferência: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Transferência confirmada com sucesso:', result);
      
      // Recarregar dados para refletir as mudanças
      setTimeout(() => {
        loadSuggestions();
      }, 500);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao confirmar transferência:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO SIMPLIFICADA - FLUXO DIRETO: CLICA → API ATUALIZA → RECARREGA → CARD VERDE
  const handleAutoConciliate = async (pair: ReconciliationPair) => {
    console.log('🚀 Conciliando automaticamente:', {
      bankTransactionId: pair.bankTransaction?.id,
      systemTransactionId: pair.systemTransaction?.id,
      statusAtual: pair.bankTransaction?.status_conciliacao
    });

    if (!pair.bankTransaction || !pair.systemTransaction) {
      console.error('❌ Dados insuficientes para conciliação');
      return;
    }

    try {
      const response = await fetch('/api/reconciliation/conciliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_transaction_id: pair.bankTransaction.id,
          system_transaction_id: pair.systemTransaction.id,
          confidence_level: pair.confidenceLevel,
          rule_applied: pair.ruleApplied
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API:', errorText);
        throw new Error(`Erro ao conciliar: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Conciliação bem-sucedida:', result);
      
      // Recarregar dados para refletir as mudanças
      setTimeout(() => {
        loadSuggestions();
      }, 500);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao conciliar:', error);
      throw error;
    }
  };
