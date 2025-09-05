# MAPEAMENTO DE STATUS - ONDE SÃO GRAVADOS

## 📊 **RESUMO EXECUTIVO**

Os status `transferencia`, `sugerido` e `sem_match` são gravados em **2 tabelas diferentes** com **mapeamentos distintos**:

## 🗃️ **TABELA 1: `bank_transactions`**
**Coluna:** `reconciliation_status`

### Status Gravados Diretamente:
- ✅ `'sugerido'` - Sugestões automáticas de conciliação
- ✅ `'transferencia'` - Transferências identificadas automaticamente  
- ✅ `'sem_match'` - Transações sem correspondência encontrada
- ✅ `'conciliado'` - Transações conciliadas
- ✅ `'pending'` - Transações pendentes
- ✅ `'ignorado'` - Transações ignoradas
- ✅ `'desvinculado'` - Transações desconciliadas

### Código Responsável:
**Arquivo:** `app/api/reconciliation/suggestions/route.ts` (linhas 225-245)

```typescript
// Determinar o status correto baseado no resultado do matching
if (result.status === 'conciliado') {
  newReconciliationStatus = 'conciliado';
} else if (result.status === 'sugerido') {
  newReconciliationStatus = 'sugerido';          // ← AQUI
} else if (result.status === 'transferencia') {
  newReconciliationStatus = 'transferencia';     // ← AQUI
} else if (result.status === 'sem_match') {
  newReconciliationStatus = 'sem_match';         // ← AQUI
}

// Atualizar o status na tabela bank_transactions
const { error: updateError } = await supabase
  .from('bank_transactions')                     // ← TABELA
  .update({ 
    reconciliation_status: newReconciliationStatus,  // ← COLUNA
    updated_at: new Date().toISOString()
  })
  .eq('id', result.bankTransaction.id);
```

## 🗃️ **TABELA 2: `transaction_matches`**
**Coluna:** `status`

### Status Gravados (Mapeamento Diferente):
- ✅ `'confirmed'` - Matches confirmados/conciliados
- ✅ `'suggested'` - Matches sugeridos (inclui transferências)
- ❌ `'transferencia'` - **NÃO é gravado diretamente**
- ❌ `'sem_match'` - **NÃO é gravado** (sem match = sem registro)

### Código Responsável:
**Arquivo:** `app/api/reconciliation/suggestions/route.ts` (linhas 340-345)

```typescript
// Lógica de mapeamento para transaction_matches
const dbStatus = (result.confidenceLevel === 'high' && result.matchScore >= 95) 
  ? 'confirmed'   // ← Matches de alta confiança
  : 'suggested';  // ← Todos os outros (incluindo transferências)

return {
  reconciliation_id: reconciliationSession.id,
  bank_transaction_id: result.bankTransaction.id,
  system_transaction_id: result.systemTransaction!.id,
  status: dbStatus,  // ← COLUNA na tabela transaction_matches
  // ...outros campos
};
```

## 🔄 **FLUXO COMPLETO DE GRAVAÇÃO**

### 1. **Matching Engine Gera Status:**
- `'sugerido'`, `'transferencia'`, `'sem_match'`, `'conciliado'`

### 2. **API Suggestions Grava em 2 Tabelas:**

#### **bank_transactions.reconciliation_status:**
```sql
UPDATE bank_transactions 
SET reconciliation_status = 'sugerido'     -- Status direto
WHERE id = 'bank_transaction_id';

UPDATE bank_transactions 
SET reconciliation_status = 'transferencia' -- Status direto
WHERE id = 'bank_transaction_id';

UPDATE bank_transactions 
SET reconciliation_status = 'sem_match'     -- Status direto
WHERE id = 'bank_transaction_id';
```

#### **transaction_matches.status:**
```sql
INSERT INTO transaction_matches (status, ...)
VALUES ('suggested', ...);  -- transferencias viram 'suggested'

INSERT INTO transaction_matches (status, ...)
VALUES ('confirmed', ...);  -- matches de alta confiança

-- sem_match = SEM REGISTRO na tabela transaction_matches
```

## 📋 **TABELA DE MAPEAMENTO**

| Status do Matching Engine | bank_transactions.reconciliation_status | transaction_matches.status |
|---------------------------|----------------------------------------|---------------------------|
| `'sugerido'`              | `'sugerido'`                          | `'suggested'`             |
| `'transferencia'`         | `'transferencia'`                     | `'suggested'`             |
| `'sem_match'`             | `'sem_match'`                         | ❌ (sem registro)          |
| `'conciliado'`            | `'conciliado'`                        | `'confirmed'`             |

## 🎯 **PARA CONSULTAR OS STATUS:**

### **Sugestões:**
```sql
SELECT * FROM bank_transactions 
WHERE reconciliation_status = 'sugerido';
```

### **Transferências:**
```sql
SELECT * FROM bank_transactions 
WHERE reconciliation_status = 'transferencia';
```

### **Sem Match:**
```sql
SELECT * FROM bank_transactions 
WHERE reconciliation_status = 'sem_match';
```

## ⚡ **RESPOSTA DIRETA:**

**TABELA:** `bank_transactions`  
**COLUNA:** `reconciliation_status`  
**VALORES:** `'transferencia'`, `'sugerido'`, `'sem_match'`

A tabela `transaction_matches` também guarda matches, mas com mapeamento diferente (`'suggested'`, `'confirmed'`).
