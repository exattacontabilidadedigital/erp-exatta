# Filtro de Plano de Contas por Tipo de Lançamento

## 📋 Resumo da Implementação

Foi implementado um sistema de filtro inteligente no componente `PlanoContaSelect` que apresenta apenas os planos de conta apropriados baseado no tipo de lançamento selecionado.

## 🎯 Objetivo

Evitar que os usuários cometam erros ao escolher planos de conta inadequados para o tipo de lançamento que estão criando.

## ⚙️ Funcionalidades Implementadas

### 1. **Filtro por Tipo de Lançamento**
- **Receita**: Mostra apenas planos de conta configurados como "receita"
- **Despesa**: Mostra apenas planos de conta configurados como "despesa"  
- **Transferência**: Mostra todos os planos de conta (sem filtro por tipo)

### 2. **Filtro por Nível Analítico**
- Exibe apenas contas analíticas (nível 3 ou superior) que podem receber lançamentos
- Contas sintéticas (1.0, 2.0, etc.) não aparecem na lista
- Baseado na quantidade de segmentos no código da conta (ex: 4.1.01.001)

### 3. **Limpeza Automática de Campos**
- Quando o tipo de lançamento é alterado, o campo "Plano de Contas" é automaticamente limpo
- Force o usuário a fazer uma nova seleção apropriada ao tipo escolhido

## 🛠️ Implementação Técnica

### Mudanças no `PlanoContaSelect` Component

```typescript
interface PlanoContaSelectProps {
  // ... outras props
  tipoFiltro?: string // 'receita', 'despesa', ou undefined para todos
}
```

### Query com Filtro Dinâmico

```typescript
let query = supabase
  .from('plano_contas')
  .select('id, codigo, nome, tipo, ativo')
  .eq('empresa_id', userData.empresa_id)
  .eq('ativo', true)

// Filtrar por tipo se especificado
if (tipoFiltro) {
  query = query.eq('tipo', tipoFiltro)
}
```

### Filtro de Contas Analíticas

```typescript
// Filtrar apenas contas analíticas (que recebem lançamentos)
const contasAnaliticas = contasFormatadas.filter(conta => {
  const segmentos = conta.codigo.split('.')
  return segmentos.length >= 3 // Contas de 3 níveis ou mais
})
```

### Integração no Formulário

```typescript
<PlanoContaSelect
  value={formData.plano_conta_id ? [formData.plano_conta_id] : []}
  onValueChange={(values) => handleInputChange("plano_conta_id", values[0] || "")}
  placeholder="Selecione a conta"
  tipoFiltro={formData.tipo === 'transferencia' ? undefined : formData.tipo}
/>
```

## 🔄 Lógica de Limpeza Automática

```typescript
const handleInputChange = (field: string, value: string) => {
  setFormData((prev) => {
    const newData = { ...prev, [field]: value }
    
    if (field === "tipo") {
      if (value === "transferencia") {
        // Lógica para transferência...
      } else {
        // Limpar plano_conta_id para forçar nova seleção
        return {
          ...newData,
          plano_conta_id: "", 
          // ... outros campos
        }
      }
    }
    
    return newData
  })
}
```

## 🌟 Benefícios

1. **Prevenção de Erros**: Impossibilita a seleção de planos de conta inadequados
2. **Interface Mais Limpa**: Menos opções desnecessárias para escolha
3. **Melhor UX**: Usuário é guiado automaticamente para as opções corretas
4. **Conformidade Contábil**: Garante que apenas contas analíticas recebam lançamentos
5. **Redução de Treinamento**: Menos necessidade de explicar quais contas usar

## 📊 Exemplo Prático

### Antes da Implementação
```
Tipo: Receita
Plano de Contas: [Lista com TODAS as contas - incluindo despesas]
- 4.1 Receitas Operacionais ❌ (conta sintética)
- 5.1 Despesas Operacionais ❌ (tipo errado)
- 1.1.01.001 Caixa ❌ (tipo errado)
```

### Depois da Implementação  
```
Tipo: Receita
Plano de Contas: [Lista FILTRADA apenas receitas analíticas]
- 4.1.01.001 Vendas no Mercado Interno ✅
- 4.1.01.002 Vendas no Mercado Externo ✅
- 4.2.01.001 Juros Recebidos ✅
```

## 🔧 Arquivos Modificados

1. **`components/ui/plano-conta-select.tsx`**
   - Adicionada prop `tipoFiltro`
   - Implementado filtro dinâmico por tipo
   - Adicionado filtro de contas analíticas

2. **`components/lancamentos/lancamentos-form.tsx`**
   - Integração da prop `tipoFiltro` no PlanoContaSelect
   - Lógica de limpeza automática do plano_conta_id

## ✅ Testes Realizados

- ✅ Compilação sem erros
- ✅ Filtro funciona para receitas
- ✅ Filtro funciona para despesas  
- ✅ Transferências mostram todas as contas
- ✅ Limpeza automática ao trocar tipo
- ✅ Apenas contas analíticas são exibidas

## 🚀 Próximos Passos (Opcionais)

1. **Cache de Consultas**: Implementar cache para evitar consultas repetidas
2. **Validação Server-side**: Adicionar validação no backend
3. **Auditoria**: Log das seleções de planos de conta para análise
4. **Configuração**: Permitir configurar níveis mínimos por empresa
