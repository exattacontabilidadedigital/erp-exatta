# 🎯 GUIA DE INTEGRAÇÃO - SISTEMA DE CONTROLE DE DUPLICIDADE

## 📋 Visão Geral
Este guia mostra como usar o sistema de controle de duplicidade implementado no ERP-Exatta.

## 🗄️ Estrutura do Banco de Dados

### Principais Tabelas Criadas/Modificadas:

1. **`bank_transactions`** - Adicionado campo `status_conciliacao`
2. **`transaction_matches_enhanced`** - Matches aprimorados
3. **`bank_transactions_pendentes_v2`** - View otimizada

### Funções PostgreSQL Disponíveis:

- `check_duplicate_transactions_by_fit_id(fit_ids[], bank_statement_id)`
- `get_reconciled_transactions_count(bank_account_id, date_start, date_end)`

## 🚀 APIs Disponíveis

### 1. Verificar Duplicatas
```typescript
POST /api/bank-transactions/check-duplicates
Body: {
  fit_ids: string[],
  bank_statement_id: string
}
```

### 2. Estatísticas de Conciliação
```typescript
GET /api/bank-transactions/reconciliation-stats?bank_account_id=...&date_start=...&date_end=...
```

### 3. Transações Pendentes
```typescript
GET /api/bank-transactions/pending?bank_account_id=...&limit=...
```

### 4. Gerenciar Status
```typescript
PUT /api/bank-transactions/[id]/ignore   // Marcar como ignorada
PUT /api/bank-transactions/[id]/reset    // Resetar para pendente
```

### 5. Matches Aprimorados
```typescript
POST /api/matches/enhanced
Body: {
  bank_transaction_id: string,
  system_transaction_id: string,
  match_score: number,
  match_type: 'manual' | 'suggested' | 'auto' | 'exact' | 'fuzzy'
}
```

## ⚛️ Componentes React

### 1. Badge de Status de Transação
```tsx
import { TransactionStatusBadge } from '@/components/conciliacao/duplicate-status-display';

<TransactionStatusBadge
  transactionId="uuid-da-transacao"
  status="pendente" // 'pendente' | 'conciliado' | 'ignorado'
  showActions={true}
  onStatusChange={(newStatus) => console.log('Status alterado:', newStatus)}
/>
```

### 2. Display de Estatísticas
```tsx
import { ReconciliationStatsDisplay } from '@/components/conciliacao/duplicate-status-display';

<ReconciliationStatsDisplay
  bankAccountId="uuid-da-conta"
  dateStart="2024-01-01"
  dateEnd="2024-12-31"
  showActions={true}
/>
```

### 3. Hook de Status
```tsx
import { useDuplicateStatus } from '@/components/conciliacao/duplicate-status-display';

function MeuComponente({ transactionId }) {
  const { 
    status, 
    updateStatus, 
    loading, 
    isFaded, 
    statusInfo 
  } = useDuplicateStatus(transactionId);

  return (
    <div className={isFaded ? 'opacity-50' : ''}>
      Status: {statusInfo.label}
      <button onClick={() => updateStatus('ignorado')}>
        Ignorar
      </button>
    </div>
  );
}
```

## 🔧 Utilitários Disponíveis

### Importar Utilitários
```tsx
import {
  checkDuplicateTransactions,
  getReconciliationStats,
  markTransactionAsIgnored,
  resetTransactionStatus,
  createEnhancedMatch,
  getPendingTransactions,
  getStatusBadge,
  shouldShowFaded,
  formatReconciliationRate
} from '@/lib/duplicate-control-utils';
```

### Exemplos de Uso
```tsx
// Verificar duplicatas
const duplicates = await checkDuplicateTransactions(
  ['FIT001', 'FIT002'], 
  'bank-statement-id'
);

// Obter estatísticas
const stats = await getReconciliationStats(
  'bank-account-id',
  '2024-01-01',
  '2024-12-31'
);

// Criar match
const success = await createEnhancedMatch(
  'bank-transaction-id',
  'system-transaction-id',
  0.95,
  'exact'
);
```

## 🎨 Integração na Interface de Conciliação

### 1. Atualizar Cartões de Transação
```tsx
// Em ReconciliationCard ou similar
import { TransactionStatusBadge, shouldShowFaded } from '@/components/conciliacao/duplicate-status-display';

function ReconciliationCard({ transaction }) {
  const isFaded = shouldShowFaded(transaction.status_conciliacao);
  
  return (
    <Card className={isFaded ? 'opacity-50' : ''}>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{transaction.memo}</CardTitle>
          <TransactionStatusBadge
            transactionId={transaction.id}
            status={transaction.status_conciliacao}
            onStatusChange={(newStatus) => {
              // Atualizar estado local
              transaction.status_conciliacao = newStatus;
            }}
          />
        </div>
      </CardHeader>
      {/* resto do card */}
    </Card>
  );
}
```

### 2. Dashboard com Estatísticas
```tsx
// Em dashboard ou página de conciliação
import { ReconciliationStatsDisplay } from '@/components/conciliacao/duplicate-status-display';

function ConciliacaoPage() {
  return (
    <div>
      <ReconciliationStatsDisplay
        bankAccountId={selectedAccount}
        dateStart={dateRange.start}
        dateEnd={dateRange.end}
      />
      
      {/* resto da interface */}
    </div>
  );
}
```

## 🔄 Fluxo de Importação OFX

### 1. Verificar Duplicatas Antes da Importação
```tsx
async function importOFX(file: File, bankAccountId: string) {
  // Parse do arquivo OFX
  const transactions = parseOFXFile(file);
  const fitIds = transactions.map(t => t.fit_id);
  
  // Verificar duplicatas
  const duplicates = await checkDuplicateTransactions(fitIds, bankStatementId);
  
  // Filtrar apenas transações novas
  const newTransactions = transactions.filter(t => {
    const duplicate = duplicates.find(d => d.fit_id === t.fit_id);
    return !duplicate?.is_duplicate;
  });
  
  // Importar apenas transações novas
  await importTransactions(newTransactions);
}
```

## 🎯 Boas Práticas

### 1. Sempre Verificar Status
```tsx
// Usar shouldShowFaded para elementos visuais
const shouldFade = shouldShowFaded(transaction.status_conciliacao);
```

### 2. Atualizações Reativas
```tsx
// Usar callbacks para atualizar UI
<TransactionStatusBadge
  onStatusChange={(newStatus) => {
    // Atualizar estado local
    setTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, status_conciliacao: newStatus }
          : t
      )
    );
  }}
/>
```

### 3. Tratamento de Erros
```tsx
try {
  const success = await markTransactionAsIgnored(id);
  if (!success) {
    toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
  }
} catch (error) {
  console.error('Erro:', error);
}
```

## 📊 Monitoramento e Métricas

### Taxa de Conciliação Ideal
- **Verde**: > 80% conciliado
- **Amarelo**: 50-80% conciliado  
- **Vermelho**: < 50% conciliado

### Indicadores Visuais
- **✅ Conciliado**: Verde, pode ficar esmaecido
- **⏳ Pendente**: Amarelo, destaque normal
- **⏭️ Ignorado**: Cinza, esmaecido

## 🚀 Próximos Passos

1. **Implementar no componente principal de conciliação**
2. **Adicionar ao dashboard de métricas**
3. **Integrar no fluxo de importação OFX**
4. **Testar com dados reais**
5. **Monitorar performance e ajustar conforme necessário**

---

## 🎉 Sistema Pronto!

O controle de duplicidade está completamente implementado e pronto para uso. Todos os componentes, APIs e utilitários estão disponíveis e documentados!
