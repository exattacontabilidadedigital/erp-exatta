# 🔄 GUIA DE MIGRAÇÃO: INTERFACE DE CONCILIAÇÃO

## Como Integrar o Controle de Duplicidade na Interface Existente

### 1. Atualizando Componentes Existentes

#### A. Modificar `conciliacao-moderna-v2.tsx`

```typescript
// ANTES - Card simples sem controle de status
function BankTransactionCard({ transaction }) {
  return (
    <Card>
      <CardContent>
        <div>{transaction.memo}</div>
        <div>{transaction.amount}</div>
      </CardContent>
    </Card>
  );
}

// DEPOIS - Card com controle de duplicidade
import { TransactionStatusBadge, shouldShowFaded } from '@/components/conciliacao/duplicate-status-display';

function BankTransactionCard({ transaction, onStatusChange }) {
  const isFaded = shouldShowFaded(transaction.status_conciliacao);
  
  return (
    <Card className={`${isFaded ? 'opacity-50 bg-gray-50' : ''} transition-all duration-200`}>
      <CardHeader className="flex justify-between">
        <div>{transaction.memo}</div>
        <TransactionStatusBadge
          transactionId={transaction.id}
          status={transaction.status_conciliacao}
          showActions={true}
          onStatusChange={onStatusChange}
        />
      </CardHeader>
      <CardContent>
        <div>{transaction.amount}</div>
      </CardContent>
    </Card>
  );
}
```

#### B. Adicionar Dashboard de Estatísticas

```typescript
// No topo da interface de conciliação
import { ReconciliationStatsDisplay } from '@/components/conciliacao/duplicate-status-display';

function ConciliacaoModernaV2() {
  return (
    <div className="space-y-6">
      {/* Dashboard de Estatísticas */}
      <ReconciliationStatsDisplay
        bankAccountId={selectedAccount}
        dateStart={startDate}
        dateEnd={endDate}
        showActions={true}
      />
      
      {/* Interface existente */}
      <div className="grid grid-cols-3 gap-6">
        {/* Suas colunas existentes */}
      </div>
    </div>
  );
}
```

### 2. Carregamento de Dados Otimizado

#### A. Substituir Queries Diretas

```typescript
// ANTES - Query direta sem filtros de status
const { data: transactions } = useQuery({
  queryKey: ['bank-transactions'],
  queryFn: () => supabase
    .from('bank_transactions')
    .select('*')
    .eq('conta_bancaria_id', accountId)
});

// DEPOIS - Usar utilities com controle de status
import { getPendingTransactions } from '@/lib/duplicate-control-utils';

const { data: transactions, refetch } = useQuery({
  queryKey: ['pending-transactions', accountId],
  queryFn: () => getPendingTransactions(accountId),
  enabled: !!accountId
});
```

#### B. Adicionar Filtros de Status

```typescript
import { StatusFilter } from '@/components/conciliacao/exemplos-integracao';

function ConciliacaoModernaV2() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'conciliado' | 'ignorado'>('pendente');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pendente: 0,
    conciliado: 0,
    ignorado: 0
  });

  // Filtrar transações baseado no status
  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'all') return transactions;
    return transactions?.filter(t => t.status_conciliacao === statusFilter) || [];
  }, [transactions, statusFilter]);

  return (
    <div>
      <StatusFilter
        currentStatus={statusFilter}
        onStatusChange={setStatusFilter}
        counts={statusCounts}
      />
      
      {/* Renderizar transações filtradas */}
      {filteredTransactions.map(transaction => (
        <BankTransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
```

### 3. Sistema de Matches Aprimorado

#### A. Atualizar Lógica de Criação de Matches

```typescript
// ANTES - Match simples
const createMatch = async (bankTxnId, systemTxnId) => {
  return supabase
    .from('transaction_matches')
    .insert({ bank_transaction_id: bankTxnId, system_transaction_id: systemTxnId });
};

// DEPOIS - Match com controle aprimorado
import { createEnhancedMatch } from '@/lib/duplicate-control-utils';

const createMatch = async (bankTxnId, systemTxnId, score = 1.0) => {
  const success = await createEnhancedMatch(
    bankTxnId,
    systemTxnId,
    score,
    'manual' // Tipo do match
  );
  
  if (success) {
    // Atualizar estado local
    refetchTransactions();
    toast.success('Match criado com sucesso!');
  }
  
  return success;
};
```

#### B. Componente de Match Rápido

```typescript
import { QuickMatchAction } from '@/components/conciliacao/exemplos-integracao';

function TransactionPair({ bankTransaction, systemTransaction }) {
  return (
    <div className="flex gap-4 p-4 border rounded">
      <div className="flex-1">
        <h4>Transação Bancária</h4>
        <p>{bankTransaction.memo}</p>
        <p>{bankTransaction.amount}</p>
      </div>
      
      <div className="flex-1">
        <h4>Transação Sistema</h4>
        <p>{systemTransaction.descricao}</p>
        <p>{systemTransaction.valor}</p>
      </div>
      
      <div className="flex-shrink-0">
        <QuickMatchAction
          bankTransaction={bankTransaction}
          systemTransaction={systemTransaction}
          onMatchCreated={() => {
            refetchTransactions();
            toast.success('Transações conciliadas!');
          }}
        />
      </div>
    </div>
  );
}
```

### 4. Importação de OFX com Controle de Duplicidade

#### A. Modificar Fluxo de Upload

```typescript
// No componente de upload de OFX
import { checkDuplicateTransactions } from '@/lib/duplicate-control-utils';

const handleOFXUpload = async (file: File) => {
  try {
    // 1. Fazer upload do arquivo
    const formData = new FormData();
    formData.append('file', file);
    
    // 2. Verificar duplicatas ANTES de processar
    const duplicateCheck = await checkDuplicateTransactions(formData);
    
    if (duplicateCheck.hasDuplicates) {
      const confirm = window.confirm(
        `Encontradas ${duplicateCheck.duplicateCount} transações duplicadas. Continuar?`
      );
      
      if (!confirm) return;
    }
    
    // 3. Processar arquivo normalmente
    const response = await fetch('/api/ofx/import', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      refetchTransactions();
      toast.success('OFX importado com sucesso!');
    }
    
  } catch (error) {
    toast.error('Erro ao importar OFX');
  }
};
```

### 5. Configuração de Estados do Hook

#### A. Usar Hook Personalizado

```typescript
import { useReconciliationManager } from '@/components/conciliacao/exemplos-integracao';

function ConciliacaoModernaV2() {
  const {
    transactions,
    stats,
    loading,
    refreshData,
    createMatch,
    updateTransactionStatus
  } = useReconciliationManager(selectedBankAccount);

  // Interface reativa aos mudanças de status
  const handleStatusChange = (transactionId: string, newStatus: 'pendente' | 'conciliado' | 'ignorado') => {
    updateTransactionStatus(transactionId, newStatus);
    toast.success(`Status atualizado para ${newStatus}`);
  };

  return (
    <div>
      {loading && <div>Carregando...</div>}
      
      {transactions.map(transaction => (
        <EnhancedBankTransactionCard
          key={transaction.id}
          transaction={transaction}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
```

### 6. Checklist de Migração

#### ✅ Passos Obrigatórios

1. **Banco de Dados**
   - [ ] Executar script `016_controle_duplicidade_indices_reais.sql`
   - [ ] Verificar se índices foram criados corretamente
   - [ ] Testar funções PostgreSQL

2. **API Endpoints**
   - [ ] Verificar se todas as 6 rotas estão funcionando
   - [ ] Testar endpoints com dados reais
   - [ ] Configurar tratamento de erros

3. **Componentes Frontend**
   - [ ] Importar `duplicate-status-display.tsx`
   - [ ] Adicionar `duplicate-control-utils.ts`
   - [ ] Testar componentes em ambiente de desenvolvimento

4. **Interface Existente**
   - [ ] Adicionar badges de status nas transações
   - [ ] Implementar dashboard de estatísticas
   - [ ] Configurar filtros por status
   - [ ] Testar responsividade

#### 🔧 Configurações Opcionais

1. **Performance**
   - [ ] Implementar paginação nas transações
   - [ ] Adicionar cache para estatísticas
   - [ ] Otimizar queries com índices personalizados

2. **UX/UI**
   - [ ] Adicionar animações nas mudanças de status
   - [ ] Implementar tooltips explicativos
   - [ ] Configurar temas personalizados para badges

3. **Monitoramento**
   - [ ] Adicionar logs de atividade
   - [ ] Implementar métricas de performance
   - [ ] Configurar alertas para duplicatas

### 7. Exemplo de Uso Completo

```typescript
// Arquivo: app/conciliacao/page.tsx
"use client";

import { useState } from 'react';
import { ConciliacaoWithStats } from '@/components/conciliacao/exemplos-integracao';

export default function ConciliacaoPage() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Conciliação Bancária</h1>
      
      {/* Seletores de conta e período */}
      <div className="mb-6 flex gap-4">
        <select 
          value={selectedAccount} 
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Selecione uma conta</option>
          {/* Suas opções de conta */}
        </select>
        
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="border rounded px-3 py-2"
        />
        
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="border rounded px-3 py-2"
        />
      </div>
      
      {/* Interface de conciliação com controle de duplicidade */}
      {selectedAccount && (
        <ConciliacaoWithStats
          bankAccountId={selectedAccount}
          dateStart={dateRange.start}
          dateEnd={dateRange.end}
        />
      )}
    </div>
  );
}
```

### 🎯 Resultado Final

Após a migração, você terá:

- ✅ **Controle Total de Duplicidade**: Sistema previne importações duplicadas
- ✅ **Interface Visual Aprimorada**: Status badges e estatísticas em tempo real  
- ✅ **Performance Otimizada**: Queries eficientes com views e índices
- ✅ **UX Melhorada**: Filtros, ações rápidas e feedback visual
- ✅ **Dados Confiáveis**: Integridade garantida por triggers automáticos

O sistema está pronto para produção! 🚀
