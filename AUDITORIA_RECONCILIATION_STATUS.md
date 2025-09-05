# AUDITORIA E CORREÇÃO DA COLUNA RECONCILIATION_STATUS

## Status Documentados vs Implementação Atual

### Status Documentados (baseado na análise do usuário):
1. `pending` - Transações pendentes de conciliação
2. `sugerido` - Sugestões automáticas de conciliação
3. `transferencia` - Transferências identificadas automaticamente
4. `conciliado` - Transações conciliadas manualmente ou automaticamente
5. `sem_match` - Transações sem correspondência encontrada
6. `ignorado` - Transações ignoradas pelo usuário
7. `desvinculado` - Transações desconciliadas pelo usuário

### Status Atualmente Implementados no Código:
1. ✅ `pending` - CORRETO - Usado em vários arquivos
2. ❌ `matched` - INCORRETO - Deveria ser `conciliado`
3. ✅ `ignored` - CORRETO - Usado corretamente
4. ❌ Status `sugerido`, `transferencia`, `sem_match`, `desvinculado` - AUSENTES nos updates do banco

## Inconsistências Encontradas

### 1. Arquivo: `/app/api/reconciliation/conciliate/route.ts`
**Problema**: Linha 361 usa `reconciliation_status: 'matched'`
**Correção**: Deveria ser `reconciliation_status: 'conciliado'`

### 2. Arquivo: `/app/api/reconciliation/suggestions/route.ts`
**Problema**: O sistema define status como `sugerido` e `transferencia` internamente, mas NÃO salva esses status na coluna `reconciliation_status` do banco de dados.
**Correção**: Precisa implementar update na tabela `bank_transactions` para salvar esses status.

### 3. Arquivo: `/app/api/reconciliation/unlink/route.ts`
**Problema**: Usa `reconciliation_status: 'pending'` para transações desvinculadas
**Correção**: Deveria usar `reconciliation_status: 'desvinculado'` para distinguir de transações verdadeiramente pendentes.

## Correções Necessárias

### 1. Corrigir Status de Conciliação
```typescript
// ANTES (incorreto):
reconciliation_status: 'matched'

// DEPOIS (correto):
reconciliation_status: 'conciliado'
```

### 2. Implementar Update de Status para Sugestões
O arquivo `suggestions/route.ts` precisa implementar updates na tabela `bank_transactions` para salvar os status:
- `sugerido` para sugestões automáticas
- `transferencia` para transferências detectadas
- `sem_match` para transações sem correspondência

### 3. Corrigir Status de Desvincular
```typescript
// ANTES (incorreto):
reconciliation_status: 'pending'

// DEPOIS (correto):
reconciliation_status: 'desvinculado'
```

## Arquivos que Precisam de Correção

1. `app/api/reconciliation/conciliate/route.ts` - Linha 361
2. `app/api/reconciliation/suggestions/route.ts` - Implementar updates de status
3. `app/api/reconciliation/unlink/route.ts` - Linha 62

## Impacto das Correções

- ✅ Consistência entre documentação e implementação
- ✅ Melhor rastreabilidade do estado das transações
- ✅ Interface de usuário mais precisa
- ✅ Relatórios e analytics mais confiáveis
