# CORREÇÃO APLICADA - Card perdendo dados após conciliação

## 🔍 PROBLEMA IDENTIFICADO

Após análise do código, identifiquei que o problema estava na API `/api/reconciliation/suggestions` que não reconstituía corretamente os dados quando existiam múltiplos matches salvos no banco de dados.

### Sintomas:
1. **ANTES de conciliar**: Card exibe dados corretamente (data, valor, "3 lançamentos selecionados", ícone olho)
2. **APÓS conciliar**: Card fica verde mas perde todos os dados
3. **APÓS reload**: Perde cor laranja e exibição dos dados

### Causa Raiz:
A API `suggestions` estava usando um `Map` simples para organizar matches existentes:
```typescript
// ❌ ANTES - Só guardava 1 match por transação
const existingMatchesMap = new Map();
existingMatches?.forEach(match => {
  existingMatchesMap.set(match.bank_transaction_id, match); // Sobrescreve matches múltiplos
});
```

## ✅ CORREÇÃO IMPLEMENTADA

### 1. Buscar matches com dados dos lançamentos
```typescript
// ✅ DEPOIS - Busca includes dados dos lançamentos
const { data: existingMatches, error: matchesError } = await supabase
  .from('transaction_matches')
  .select(`
    *,
    lancamentos:system_transaction_id (
      id, data_lancamento, descricao, valor, tipo, numero_documento, status, plano_conta, conta_bancaria_id
    )
  `)
  .in('bank_transaction_id', bankTransactions?.map(bt => bt.id) || []);
```

### 2. Organizar matches em arrays (suporte a múltiplos)
```typescript
// ✅ DEPOIS - Suporta múltiplos matches por transação
const existingMatchesMap = new Map();
existingMatches?.forEach(match => {
  if (!existingMatchesMap.has(match.bank_transaction_id)) {
    existingMatchesMap.set(match.bank_transaction_id, []);
  }
  existingMatchesMap.get(match.bank_transaction_id).push(match);
});
```

### 3. Reconstituir dados agregados para múltiplos lançamentos
```typescript
// ✅ DEPOIS - Reconstitui dados dos múltiplos lançamentos
if (existingMatchesArray.length > 0) {
  const primaryMatch = existingMatchesArray.find((m: any) => m.is_primary) || existingMatchesArray[0];
  const allMatchedLancamentos = existingMatchesArray
    .filter((m: any) => m.lancamentos)
    .map((m: any) => m.lancamentos)
    .sort((a: any, b: any) => new Date(b.data_lancamento).getTime() - new Date(a.data_lancamento).getTime());
  
  // Valor total agregado
  const totalValue = allMatchedLancamentos.reduce((sum: number, lanc: any) => sum + Math.abs(lanc.valor), 0);
  const primaryLancamento = allMatchedLancamentos.find((l: any) => l.id === primaryMatch.system_transaction_id) || allMatchedLancamentos[0];
  
  // ✅ systemTransaction agregado (para exibição no card)
  result.systemTransaction = {
    ...primaryLancamento,
    valor: totalValue,
    descricao: allMatchedLancamentos.length > 1 
      ? `${allMatchedLancamentos.length} lançamentos selecionados`
      : primaryLancamento.descricao
  };
  
  // ✅ systemTransactions array (para tooltip com detalhes)
  result.systemTransactions = allMatchedLancamentos;
}
```

## 🎯 RESULTADO ESPERADO

Após esta correção:

1. **Após conciliar**: Card mantém dados (data, valor, "3 lançamentos selecionados") e fica verde
2. **Após reload**: Card mantém cor correta e dados dos múltiplos lançamentos
3. **Tooltip funcional**: Ícone do olho continua exibindo detalhes dos lançamentos individuais

## 📁 ARQUIVO MODIFICADO

- `app/api/reconciliation/suggestions/route.ts` - Linhas ~121-285

## 🧪 COMO TESTAR

1. Acesse a página de conciliação
2. Selecione múltiplos lançamentos para uma transação bancária
3. Clique "Conciliar"
4. Verifique se o card mantém os dados (deve ficar verde mas manter informações)
5. Recarregue a página
6. Verifique se o card ainda exibe os dados corretamente

## ⚠️ OBSERVAÇÃO

Se o problema persistir, pode haver cache do browser. Faça um hard refresh (Ctrl+F5) ou abra em aba anônima para garantir que a nova API está sendo usada.
