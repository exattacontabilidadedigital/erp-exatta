# Script PowerShell para simplificar as funções de conciliação
# Remove toda a complexidade desnecessária mantendo apenas o fluxo direto

$filePath = "c:\Users\romar\Downloads\erp-exatta\components\conciliacao\conciliacao-moderna-v2.tsx"

Write-Host "🚀 Simplificando funções de conciliação..."

# Ler o arquivo
$content = Get-Content $filePath -Raw

# Função handleAutoConciliate simplificada
$newHandleAutoConciliate = @"
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
        throw new Error(`Erro ao conciliar: `${errorText}`);
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
"@

# Função handleConfirmTransfer simplificada
$newHandleConfirmTransfer = @"
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
        throw new Error(`Erro ao confirmar transferência: `${errorText}`);
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
"@

Write-Host "✅ Funções simplificadas criadas"
Write-Host "📝 Agora você precisa substituir manualmente as funções no arquivo original"
Write-Host ""
Write-Host "🔧 LOCALIZAR E SUBSTITUIR:"
Write-Host "1. Encontre 'const handleAutoConciliate' até o fechamento da função"
Write-Host "2. Encontre 'const handleConfirmTransfer' até o fechamento da função"
Write-Host "3. Substitua por estas versões simplificadas"
Write-Host ""
Write-Host "💡 RESULTADO ESPERADO:"
Write-Host "   • Clica botão 'Conciliar' → API atualiza status_conciliacao → Recarrega dados → Card fica verde"
Write-Host "   • SEM tratamento de erro complexo"
Write-Host "   • SEM limpeza de conflitos"
Write-Host "   • SEM múltiplas tentativas"
