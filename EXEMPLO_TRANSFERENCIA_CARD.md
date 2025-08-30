# 🔄 EXEMPLO: TRANSFERÊNCIA NO CARD DO SISTEMA

## Cenário Genérico - Qualquer Valor

### Card Banco (Esquerda) - OFX
```
📅 [Data qualquer]
💰 [Qualquer valor] (ENTRADA/SAÍDA)
📝 [Qualquer descrição]
🏷️ [TRANSFER...] ou memo contendo "TRANSFER"
🌐 Origem: OFX
```

### Card Sistema (Direita) - DEVE APARECER
```
📅 [Mesma data ±2 dias]  
💰 [Valor exato oposto]
📝 TRANSFERÊNCIA ENTRE CONTAS
🏷️ TRANSFER
📄 Doc: TRANSF-[timestamp]-ENTRADA/SAIDA
🎯 Tipo: transferencia
🔗 Status: pago
```

## Exemplos Práticos

### Exemplo 1: R$ 150,75
```
OFX:     -R$ 150,75 "TRANSFER BANCO XYZ"
Sistema: +R$ 150,75 "[TRANSFERÊNCIA ENTRADA] Movimentação conta"
Match:   ✅ VALOR EXATO + DESCRIÇÃO TRANSFER
```

### Exemplo 2: R$ 2.500,00
```
OFX:     +R$ 2.500,00 "TED TRANSFER CLIENTE ABC"
Sistema: -R$ 2.500,00 "[TRANSFERÊNCIA SAÍDA] TED para cliente"
Match:   ✅ VALOR EXATO + DESCRIÇÃO TRANSFER
```

### Exemplo 3: R$ 50,33
```
OFX:     -R$ 50,33 payee="TRANSFER INTERNAL"
Sistema: +R$ 50,33 "TRANSF-1234567890-ENTRADA"
Match:   ✅ VALOR EXATO + PAYEE TRANSFER
```

## Lógica de Detecção Atualizada

### 1. Detecção de TRANSFER
```typescript
// Verifica múltiplos campos para "TRANSFER"
const isTransferTransaction = 
  bankTransaction.memo?.includes('TRANSFER') || 
  bankTransaction.payee?.includes('TRANSFER') ||
  bankTransaction.memo?.toLowerCase().includes('transfer') ||
  bankTransaction.payee?.toLowerCase().includes('transfer');
```

### 2. Busca por Valor Exato
```typescript
// Qualquer valor com precisão de centavos
const valorTransacao = Math.abs(bankTransaction.amount); // Ex: 150.75, 2500.00, 50.33
const tolerance = 0.01; // Tolerância para precisão decimal

const filtros = {
  empresa_id: 'empresa-uuid',
  status: 'pago',
  valor_min: valorTransacao - tolerance,  // 150.74, 2499.99, 50.32
  valor_max: valorTransacao + tolerance,  // 150.76, 2500.01, 50.34
  limit: 100
};
```

### 3. Filtro de Transferências
```typescript
// Para transações TRANSFER, buscar apenas transferências
if (isTransferTransaction) {
  const isTransferLancamento = 
    lancamento.tipo === 'transferencia' ||
    lancamento.descricao?.includes('TRANSFERÊNCIA') ||
    lancamento.descricao?.includes('TRANSFER') ||
    lancamento.numero_documento?.includes('TRANSF-');
  
  const isExactValue = Math.abs(valorLancamento - valorTransacao) < 0.01;
  
  return isTransferLancamento && isExactValue;
}
```

## Matriz de Compatibilidade

| Valor OFX | Memo/Payee | Sistema Valor | Sistema Tipo | Match |
|-----------|------------|---------------|--------------|-------|
| -R$ 10,00 | "TRANSFER" | +R$ 10,00 | transferencia | ✅ |
| +R$ 500,00 | "TED TRANSFER" | -R$ 500,00 | transferencia | ✅ |
| -R$ 1.250,33 | payee="TRANSFER BANK" | +R$ 1.250,33 | transferencia | ✅ |
| -R$ 100,00 | "PAGAMENTO" | +R$ 100,00 | receita | ❌ |
| -R$ 50,00 | "TRANSFER" | +R$ 49,99 | transferencia | ❌ |

## Interface Visual Atualizada

### Card de Transferência Destacado
```jsx
// Detecta TRANSFER em qualquer campo
const isTransferTransaction = memo?.includes('TRANSFER') || 
                             payee?.includes('TRANSFER') ||
                             memo?.toLowerCase().includes('transfer') ||
                             payee?.toLowerCase().includes('transfer');

const isTransferLancamento = tipo === 'transferencia' || 
                            descricao?.includes('TRANSFERÊNCIA') ||
                            descricao?.includes('TRANSFER');

// Visual destacado para matches de transferência
<div className={`p-4 border rounded ${
  isTransferLancamento && isTransferTransaction
    ? 'border-l-4 border-l-blue-500 bg-blue-50'
    : 'border-gray-200'
}`}>
  
  <div className="flex items-center gap-2">
    <span className="font-medium">{lancamento.descricao}</span>
    {isTransferLancamento && (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        TRANSFERÊNCIA
      </span>
    )}
  </div>
  
  <div className={`font-bold ${valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
    {new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(Math.abs(valor))}
  </div>
</div>
```

## Resultado Final Universal

### ✅ Sistema Funciona Para:
- **Qualquer valor**: R$ 0,01 até milhões
- **Qualquer moeda**: Detecta valores decimais precisos
- **Múltiplos campos**: memo, payee, description
- **Case insensitive**: "TRANSFER", "transfer", "Transfer"
- **Vários formatos**: TED TRANSFER, TRANSFER BANK, DOC TRANSFER

### 🎯 Critérios de Match:
1. **Valor exato** (±R$ 0,01 para precisão decimal)
2. **Descrição TRANSFER** em qualquer campo da transação OFX
3. **Tipo transferência** no sistema ERP
4. **Status pago** no sistema

**O sistema agora funciona universalmente para qualquer transferência!** 🚀

## Estrutura do Lançamento de Transferência

### Tabela `lancamentos`
```sql
-- Lançamento de ENTRADA (o que deve aparecer no card)
INSERT INTO lancamentos (
  id: 'uuid-entrada',
  tipo: 'transferencia',
  descricao: 'TRANSFERÊNCIA ENTRE CONTAS',
  valor: 10.00,                    -- Positivo = entrada
  numero_documento: 'TRANSF-1234567890-ENTRADA',
  conta_bancaria_id: 'conta-destino-id',
  status: 'pago',
  data_lancamento: '2025-08-19'
);

-- Lançamento de SAÍDA (lançamento complementar)
INSERT INTO lancamentos (
  id: 'uuid-saida',
  tipo: 'transferencia', 
  descricao: 'TRANSFERÊNCIA ENTRE CONTAS',
  valor: -10.00,                   -- Negativo = saída
  numero_documento: 'TRANSF-1234567890-SAIDA',
  conta_bancaria_id: 'conta-origem-id',
  status: 'pago',
  data_lancamento: '2025-08-19'
);
```

## API de Busca Corrigida

### Filtros Aplicados
```typescript
// Buscar por valor e tipo
const valorTransacao = Math.abs(10.00); // = 10.00

const filtros = {
  empresa_id: 'empresa-uuid',
  status: 'pago',
  valor_min: 9.99,    // 10.00 * 0.99
  valor_max: 10.01,   // 10.00 * 1.01
  limit: 100
};

// Priorizar transferências quando memo contém "TRANSFER"
if (bankTransaction.memo.includes('TRANSFER')) {
  // Ordenar: transferências primeiro
  const transferencias = lancamentos.filter(l => l.tipo === 'transferencia');
  const outros = lancamentos.filter(l => l.tipo !== 'transferencia');
  return [...transferencias, ...outros];
}
```

## Interface Visual

### Card de Transferência Destacado
```jsx
// Card com destaque visual para transferências
<div className={`p-4 border rounded ${
  lancamento.tipo === 'transferencia' && memo.includes('TRANSFER')
    ? 'border-l-4 border-l-blue-500 bg-blue-50'
    : 'border-gray-200'
}`}>
  <div className="flex items-center gap-2">
    <span className="font-medium">{lancamento.descricao}</span>
    {lancamento.tipo === 'transferencia' && (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        TRANSFERÊNCIA
      </span>
    )}
  </div>
  
  <div className="text-green-600 font-bold">
    +R$ 10,00 {/* Entrada na conta */}
  </div>
  
  <div className="text-xs text-gray-500">
    Doc: TRANSF-1234567890-ENTRADA
  </div>
</div>
```

### Botões de Ação
```jsx
// Botões disponíveis após match
<div className="flex gap-2">
  <Button onClick={() => onConciliar(pair)}>
    ✅ Conciliar
  </Button>
  <Button variant="outline" onClick={() => onDesvincular(pair)}>
    🔗 Desvincular  
  </Button>
</div>
```

## Resultado Final

### Antes da Correção ❌
```
[Banco: -R$ 10,00] ←→ [Sistema: VAZIO]
                       Nenhum lançamento encontrado
```

### Depois da Correção ✅
```
[Banco: -R$ 10,00] ←→ [Sistema: +R$ 10,00]
TRANSFER NOIA SA DA    TRANSFERÊNCIA ENTRE CONTAS
                       🏷️ TRANSFER
                       📄 TRANSF-1234567890-ENTRADA
                       [Conciliar] [Desvincular]
```

## Pontos Chave

1. **Valor Oposto**: OFX negativo (-10) = Sistema positivo (+10)
2. **Tipo Específico**: `tipo = 'transferencia'` no sistema
3. **Busca Inteligente**: API prioriza transferências quando memo = "TRANSFER"
4. **Visual Destacado**: Cards de transferência com borda azul
5. **Documentação**: Número do documento identifica o par da transferência

O sistema agora está configurado para detectar e exibir corretamente as transferências! 🎯
