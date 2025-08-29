# Transformação Automática: Analítica → Sintética

## 📚 Conceito Contábil

Quando uma **conta analítica** recebe subcontas, ela automaticamente se transforma em **conta sintética**.

### 🔄 Regra de Transformação

```
ANTES (Analítica):
1.1.1.01 - Caixa
├── Recebe lançamentos diretamente
└── Não tem subcontas

DEPOIS (Sintética):
1.1.1.01 - Caixa (Sintética)
├── NÃO recebe mais lançamentos diretamente
├── 1.1.1.01.01 - Caixa Principal
└── 1.1.1.01.02 - Caixa Secundário
```

## 🎯 Critérios de Identificação

### Conta Analítica (4+ segmentos):
- **Código**: 1.1.1.01, 1.1.1.01.001, etc.
- **Função**: Recebe lançamentos diretamente
- **Característica**: Não possui subcontas
- **Tag Visual**: 🔵 **A** (azul)
- **Estilo**: Nome normal, sem negrito, primeira letra maiúscula

### Conta Sintética (até 3 segmentos):
- **Código**: 1, 1.1, 1.1.1
- **Função**: Consolida valores das subcontas
- **Característica**: Possui subcontas
- **Tag Visual**: 🟢 **S** (verde)
- **Estilo**: Nome em negrito e MAIÚSCULA

## ⚙️ Implementação no Sistema

### 1. Detecção Automática
```typescript
const segmentos = codigo.split('.').length
const isAnalitica = segmentos >= 4
```

### 2. Transformação Automática
- **Trigger**: Criação de subconta
- **Ação**: Atualiza nome da conta pai
- **Sufixo**: Adiciona "(Sintética)" ao nome
- **Registro**: Data da transformação na descrição

### 3. Aviso Visual
- **Banner azul**: Mostra conta pai selecionada
- **Banner amarelo**: Avisa sobre transformação automática
- **Explicação**: Informa que não receberá mais lançamentos

### 4. Tags Visuais
- **Tag A (azul)**: Conta Analítica - recebe lançamentos diretamente
- **Tag S (verde)**: Conta Sintética - consolida valores das subcontas
- **Tooltip**: Explicação ao passar o mouse sobre as tags

### 5. Estilos Tipográficos
- **Sintéticas**: Nome em **NEGRITO** e **MAIÚSCULA**
- **Analíticas**: Nome normal e primeira letra maiúscula
- **Códigos**: Sintéticas em negrito, analíticas em médio

## 📋 Exemplo Prático

### Cenário:
1. **Conta existente**: `1.1.1.01 - Caixa` (Analítica)
2. **Usuário cria**: Subconta `1.1.1.01.01 - Caixa Principal`
3. **Sistema transforma**: `1.1.1.01 - CAIXA (SINTÉTICA)` (negrito e maiúscula)

### Resultado Visual:
```
1.1.1.01 - CAIXA (SINTÉTICA) [S] [Ativo] (negrito, maiúscula)
├── 1.1.1.01.01 - Caixa Principal [A] [Ativo] (normal)
└── 1.1.1.01.02 - Caixa Secundário [A] [Ativo] (normal)
```

### Benefícios:
- ✅ Conta pai vira sintética com estilo visual distinto
- ✅ Subconta é criada normalmente
- ✅ Usuário é avisado sobre a transformação
- ✅ Histórico é mantido na descrição
- ✅ Diferenciação visual clara entre tipos

## 🚨 Importante

- **Irreversível**: Uma vez sintética, não volta a ser analítica
- **Lançamentos**: Conta pai não recebe mais lançamentos diretos
- **Consolidação**: Valores são somados das subcontas
- **Auditoria**: Transformação fica registrada na descrição

## 💡 Benefícios

1. **Conformidade Contábil**: Segue padrões contábeis
2. **Automatização**: Sem intervenção manual
3. **Transparência**: Usuário é avisado
4. **Rastreabilidade**: Histórico preservado
