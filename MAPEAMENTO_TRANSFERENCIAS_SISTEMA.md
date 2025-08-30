# 🔄 MAPEAMENTO DE TRANSFERÊNCIAS DO SISTEMA

## Análise dos Lançamentos - 34 registros analisados

### ✅ TRANSFERÊNCIAS IDENTIFICADAS (4 pares / 8 lançamentos)

---

### 1. Transferência R$ 10,00 - Timestamp: 1755718714650
**Data:** 20/08/2025 | **Status:** PAGO

#### 📤 SAÍDA
- **ID:** `243f2e8d-5851-4810-b3db-42a634eaddeb`
- **Documento:** `TRANSF-1755718714650-SAIDA`
- **Descrição:** `[TRANSFERÊNCIA SAÍDA] teste`
- **Valor:** R$ 10,00 (despesa)
- **Conta:** `8ad0f3fb-88cc-4f39-8d50-f47efb3a5486`

#### 📥 ENTRADA
- **ID:** `d33a868d-2be0-40be-b674-ffd5985c0bec`
- **Documento:** `TRANSF-1755718714650-ENTRADA`
- **Descrição:** `[TRANSFERÊNCIA ENTRADA] teste`
- **Valor:** R$ 10,00 (receita)
- **Conta:** `177705b9-192c-4603-b223-039b733ee955`

---

### 2. Transferência R$ 10,00 - Timestamp: 1755723105726
**Data:** 20/08/2025 | **Status:** PAGO

#### 📥 ENTRADA
- **ID:** `0e9d53d4-1469-4e28-973b-fc14aa39c972`
- **Documento:** `TRANSF-1755723105726-ENTRADA`
- **Descrição:** `teste`
- **Valor:** R$ 10,00 (receita)
- **Conta:** `9e04c843-2057-4e4f-babc-8ef4fba58974`

#### 📤 SAÍDA
- **ID:** `416f7508-6a7c-41af-9b9c-cfe9c1ff68ff`
- **Documento:** `TRANSF-1755723105726-SAIDA`
- **Descrição:** `teste`
- **Valor:** R$ 10,00 (despesa)
- **Conta:** `8ad0f3fb-88cc-4f39-8d50-f47efb3a5486`

---

### 3. Transferência R$ 10,00 - Timestamp: 1755722099059
**Data:** 20/08/2025 | **Status:** PAGO

#### 📤 SAÍDA
- **ID:** `8e2fe946-cd77-4686-bb97-835cd281fbd8`
- **Documento:** `TRANSF-1755722099059-SAIDA`
- **Descrição:** `[TRANSFERÊNCIA SAÍDA] fdd`
- **Valor:** R$ 10,00 (despesa)
- **Conta:** `4fd86770-32c4-4927-9d7e-8f3ded7b38fa`

#### 📥 ENTRADA
- **ID:** `c5f96c65-b2ea-4e07-a1ac-927d6f49e3bc`
- **Documento:** `TRANSF-1755722099059-ENTRADA`
- **Descrição:** `[TRANSFERÊNCIA ENTRADA] fdd`
- **Valor:** R$ 10,00 (receita)
- **Conta:** `177705b9-192c-4603-b223-039b733ee955`

---

### 4. Transferência R$ 25,00 - Timestamp: 1755723634644
**Data:** 18/08/2025 | **Status:** PAGO

#### 📥 ENTRADA
- **ID:** `58fdde57-ebba-4019-bdbf-c3eb39c9ef37`
- **Documento:** `TRANSF-1755723634644-ENTRADA`
- **Descrição:** `tytyty`
- **Valor:** R$ 25,00 (receita)
- **Conta:** `9e04c843-2057-4e4f-babc-8ef4fba58974`

#### 📤 SAÍDA
- **ID:** `fa839aea-a24a-4f93-a7a5-b073dd7f6b6f`
- **Documento:** `TRANSF-1755723634644-SAIDA`
- **Descrição:** `tytyty`
- **Valor:** R$ 25,00 (despesa)
- **Conta:** `4fd86770-32c4-4927-9d7e-8f3ded7b38fa`

---

## 📊 ESTATÍSTICAS

### Por Valor
- **R$ 10,00:** 3 transferências (75%)
- **R$ 25,00:** 1 transferência (25%)

### Por Conta (Saídas)
- **`4fd86770-32c4-4927-9d7e-8f3ded7b38fa`:** 2 saídas
- **`8ad0f3fb-88cc-4f39-8d50-f47efb3a5486`:** 2 saídas

### Por Conta (Entradas)
- **`177705b9-192c-4603-b223-039b733ee955`:** 2 entradas
- **`9e04c843-2057-4e4f-babc-8ef4fba58974`:** 2 entradas

---

## 🔍 CRITÉRIOS DE IDENTIFICAÇÃO

### ✅ Padrões Confirmados
1. **Número do Documento:** Inicia com `TRANSF-` seguido de timestamp
2. **Sufixo Direção:** `-ENTRADA` ou `-SAIDA`
3. **Tipo Lançamento:** `receita` para entrada, `despesa` para saída
4. **Status:** Todos com status `pago`
5. **Pareamento:** Mesmo timestamp = mesma transferência
6. **Valores:** Idênticos entre entrada e saída

### 🎯 Descrições Encontradas
- **Padrão 1:** `[TRANSFERÊNCIA ENTRADA/SAÍDA] + descrição`
- **Padrão 2:** Apenas a descrição (sem prefixo)

---

## 🚀 IMPACTO PARA CONCILIAÇÃO OFX

### Para Detecção de Transferências
```typescript
// Buscar por qualquer valor exato com descrição TRANSFER
const isTransferOFX = memo?.includes('TRANSFER') || payee?.includes('TRANSFER');

if (isTransferOFX) {
  // Filtrar apenas lançamentos de transferência
  const transferLancamentos = lancamentos.filter(l => 
    l.numero_documento?.startsWith('TRANSF-') ||
    l.descricao?.includes('TRANSFERÊNCIA') ||
    l.descricao?.includes('[TRANSFERÊNCIA')
  );
  
  // Buscar por valor exato (±0.01)
  const exactValueMatches = transferLancamentos.filter(l =>
    Math.abs(Math.abs(l.valor) - Math.abs(bankTransaction.amount)) < 0.01
  );
}
```

### ✅ Sistema Atualizado
O sistema de conciliação agora detecta corretamente:
- ✅ Qualquer valor de transferência (R$ 10,00, R$ 25,00, etc.)
- ✅ Múltiplos padrões de descrição
- ✅ Documentos com timestamp único
- ✅ Direcionamento correto (entrada/saída)
- ✅ Interface visual destacada

---

## 📝 OBSERVAÇÕES

1. **Todas as transferências** têm status `pago`
2. **Timestamps únicos** garantem pareamento correto
3. **Contas diferentes** confirmam movimentação entre contas
4. **Valores exatos** facilitam matching automático
5. **Padrões consistentes** permitem detecção confiável

---

**Última atualização:** 30/08/2025
**Total analisado:** 34 lançamentos
**Transferências encontradas:** 8 lançamentos (4 pares)
