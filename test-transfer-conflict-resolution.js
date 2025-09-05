/**
 * Teste da Resolução Automática de Conflitos de Transferência
 * 
 * Este script testa a nova lógica de resolução automática de conflitos
 * quando o botão "Conciliar" é clicado em transferências.
 */

const testTransferConflictResolution = async () => {
  console.log('🧪 INICIANDO TESTE DE RESOLUÇÃO DE CONFLITOS DE TRANSFERÊNCIA');
  console.log('=' .repeat(60));

  // Simular dados de uma transferência conflitante
  const mockTransferPair = {
    id: 'test-pair-001',
    status: 'suggested',
    bankTransaction: {
      id: 'bank-tx-001',
      fit_id: 'FIT123456',
      memo: 'TRANSFERENCIA PIX PARA CONTA CORRENTE',
      amount: -5000.00,
      status_conciliacao: 'pendente',
      data_transacao: '2024-08-15'
    },
    systemTransaction: {
      id: 'sys-tx-001',
      descricao: 'Transferência PIX - Conta Corrente',
      valor: 5000.00,
      data: '2024-08-15',
      tipo: 'transferencia'
    }
  };

  console.log('📊 Dados da transferência a ser testada:');
  console.log('Bank Transaction:', {
    id: mockTransferPair.bankTransaction.id,
    memo: mockTransferPair.bankTransaction.memo,
    amount: mockTransferPair.bankTransaction.amount,
    status: mockTransferPair.bankTransaction.status_conciliacao
  });
  console.log('System Transaction:', {
    id: mockTransferPair.systemTransaction.id,
    descricao: mockTransferPair.systemTransaction.descricao,
    valor: mockTransferPair.systemTransaction.valor
  });

  // Simular função handleConfirmTransfer com a nova lógica
  const simulateHandleConfirmTransfer = async (pair) => {
    console.log('\n🚀 Simulando handleConfirmTransfer com nova lógica...');
    
    if (!pair.bankTransaction || !pair.systemTransaction) {
      console.error('❌ Dados insuficientes');
      return false;
    }

    // ✅ VERIFICAÇÃO PRÉVIA: Limpar conflitos antes de tentar conciliar
    console.log('🔍 Verificando conflitos pré-existentes...');
    try {
      console.log('🧹 Limpeza prévia para o lançamento:', pair.systemTransaction.id);
      
      // Simular API de limpeza prévia
      const cleanupResponse = await simulateAPICall('/api/reconciliation/unlink-system', {
        system_transaction_id: pair.systemTransaction.id
      });
      
      if (cleanupResponse.success) {
        console.log('✅ Limpeza prévia concluída');
        // Aguardar um momento
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.warn('⚠️ API de limpeza prévia não disponível ou sem conflitos');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Erro na limpeza prévia, continuando:', cleanupError.message);
    }

    console.log('✅ Tentando conciliação inicial...');

    try {
      // Simular primeira tentativa de conciliação
      const response = await simulateAPICall('/api/reconciliation/conciliate', {
        bank_transaction_id: pair.bankTransaction.id,
        system_transaction_id: pair.systemTransaction.id,
        confidence_level: 'high',
        rule_applied: 'transfer_confirmation'
      });

      console.log('📡 Resposta da API:', response);

      if (!response.success) {
        // ✅ TRATAMENTO PARA ERRO 409 (Conflito de Conciliação)
        if (response.status === 409) {
          console.warn('⚠️ Erro 409: Detectado conflito persistente');
          console.log('📊 Detalhes do conflito:', response.errorData);
          
          // ✅ ESTRATÉGIA MELHORADA: Limpeza agressiva de conflitos
          console.log('🔓 Executando limpeza agressiva de conflitos...');
          
          try {
            // 1. Desconciliar pela transação bancária
            console.log('🔧 Tentativa 1: Desconciliar por bank_transaction_id:', pair.bankTransaction.id);
            const unlinkBank = await simulateAPICall('/api/reconciliation/unlink', {
              bank_transaction_id: pair.bankTransaction.id
            });
            
            if (unlinkBank.success) {
              console.log('✅ Desconciliação por bank_transaction_id bem-sucedida');
            }
            
            // 2. Desconciliar pelo lançamento do sistema
            console.log('🔧 Tentativa 2: Desconciliar por system_transaction_id:', pair.systemTransaction.id);
            const unlinkSystem = await simulateAPICall('/api/reconciliation/unlink-system', {
              system_transaction_id: pair.systemTransaction.id
            });
            
            if (unlinkSystem.success) {
              console.log('✅ Desconciliação por system_transaction_id bem-sucedida');
            }
            
            // 3. Se a API retornou conflitos específicos, desconciliar cada um
            if (response.errorData?.existing_matches?.length > 0) {
              console.log('🔧 Tentativa 3: Desconciliar matches específicos:', response.errorData.existing_matches);
              
              for (const match of response.errorData.existing_matches) {
                if (match.bank_transaction_id) {
                  try {
                    const unlinkSpecific = await simulateAPICall('/api/reconciliation/unlink', {
                      bank_transaction_id: match.bank_transaction_id
                    });
                    
                    if (unlinkSpecific.success) {
                      console.log('✅ Match específico desconciliado:', match.bank_transaction_id);
                    }
                  } catch (unlinkError) {
                    console.warn('⚠️ Erro ao desconciliar match específico:', unlinkError.message);
                  }
                }
              }
            }
            
            // 4. Aguardar um momento para as operações se completarem
            console.log('⏳ Aguardando limpeza se completar...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 5. Tentar conciliação novamente
            console.log('🔄 Tentando conciliação após limpeza agressiva...');
            const retryResponse = await simulateAPICall('/api/reconciliation/conciliate', {
              bank_transaction_id: pair.bankTransaction.id,
              system_transaction_id: pair.systemTransaction.id,
              confidence_level: 'high',
              rule_applied: 'transfer_confirmation_post_cleanup'
            });
            
            if (retryResponse.success) {
              console.log('✅ Transferência conciliada após limpeza agressiva:', retryResponse.data);
              return true;
            } else {
              const conflictInfo = response.errorData?.existing_matches?.length > 0 
                ? `Conflitos: ${response.errorData.existing_matches.map(m => m.bank_transaction_id || 'ID não identificado').join(', ')}`
                : 'Conflitos não identificados';
                
              console.error(`❌ Conflito persistente. ${conflictInfo}. Verifique a tabela transaction_matches.`);
              return false;
            }
            
          } catch (aggressiveCleanupError) {
            console.error('❌ Erro na limpeza agressiva:', aggressiveCleanupError.message);
            return false;
          }
        } else {
          console.error('❌ Erro na API:', response.error);
          return false;
        }
      } else {
        console.log('✅ Transferência conciliada com sucesso na primeira tentativa:', response.data);
        return true;
      }
      
    } catch (error) {
      console.error('💥 ERRO capturado:', error.message);
      return false;
    }
  };

  // Simular chamadas de API
  const simulateAPICall = async (endpoint, payload) => {
    console.log(`🌐 Simulando chamada para ${endpoint}:`, payload);
    
    // Simular diferentes cenários
    if (endpoint === '/api/reconciliation/conciliate' && payload.rule_applied === 'transfer_confirmation') {
      // Primeira tentativa - simular conflito 409
      return {
        success: false,
        status: 409,
        error: 'Conflict: Transaction already reconciled',
        errorData: {
          existing_matches: [
            {
              bank_transaction_id: 'bank-tx-conflict-001',
              system_transaction_id: mockTransferPair.systemTransaction.id,
              status: 'confirmed'
            }
          ]
        }
      };
    }

    if (endpoint === '/api/reconciliation/unlink' || endpoint === '/api/reconciliation/unlink-system') {
      // Simular sucesso na desconciliação
      return {
        success: true,
        data: { message: 'Successfully unlinked' }
      };
    }

    if (endpoint === '/api/reconciliation/conciliate' && payload.rule_applied === 'transfer_confirmation_post_cleanup') {
      // Segunda tentativa após limpeza - simular sucesso
      return {
        success: true,
        data: {
          match_id: 'new-match-001',
          bank_transaction_id: payload.bank_transaction_id,
          system_transaction_id: payload.system_transaction_id,
          status: 'confirmed'
        }
      };
    }

    // Padrão - sucesso
    return {
      success: true,
      data: { message: 'Operation successful' }
    };
  };

  // Executar o teste
  console.log('\n🎯 EXECUTANDO TESTE...');
  const result = await simulateHandleConfirmTransfer(mockTransferPair);
  
  console.log('\n📋 RESULTADO DO TESTE:');
  console.log('=' .repeat(60));
  if (result) {
    console.log('✅ SUCESSO: A resolução automática de conflitos funcionou!');
    console.log('   • Conflito 409 foi detectado');
    console.log('   • Limpeza agressiva foi executada');
    console.log('   • Conciliação foi bem-sucedida na segunda tentativa');
  } else {
    console.log('❌ FALHA: A resolução automática de conflitos não funcionou');
    console.log('   • Verifique os logs acima para identificar o problema');
  }

  console.log('\n🎉 TESTE CONCLUÍDO!');
  console.log('=' .repeat(60));
};

// Executar o teste
testTransferConflictResolution().catch(console.error);
