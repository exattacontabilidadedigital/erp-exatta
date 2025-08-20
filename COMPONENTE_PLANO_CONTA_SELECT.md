# 📊 PlanoContaSelect - Componente de Seleção de Plano de Contas

## 🎯 Visão Geral

O `PlanoContaSelect` é um componente avançado para seleção múltipla de planos de conta com busca em tempo real, desenvolvido para oferecer a mesma experiência do `ContaBancariaSelect`.

## 🚀 Funcionalidades

### 🔍 **Busca Inteligente**
- Campo de pesquisa integrado
- Busca por código, nome ou tipo
- Filtragem em tempo real
- Highlight de resultados

### ☑️ **Seleção Múltipla**
- Checkboxes para cada plano
- Opção "Selecionar Todas"
- Contador de itens selecionados
- Estado indeterminado

### 🎨 **Interface Moderna**
```
┌─────────────────────────────────────┐
│ 🔍 Pesquisar...                    │
├─────────────────────────────────────│
│ ☑️ Selecionar Todas (25)           │
├─────────────────────────────────────│
│ ☑️ 1.01.01 - Caixa Geral          │
│     Tipo: Ativo                     │
│ ☐ 1.01.02 - Bancos                 │
│     Tipo: Ativo                     │
│ ☑️ 3.01.01 - Receitas Vendas       │
│     Tipo: Receita                   │
└─────────────────────────────────────┘
│ 2 selecionadas              Limpar │
└─────────────────────────────────────┘
```

## 💻 Uso Básico

```tsx
import { PlanoContaSelect } from "@/components/ui/plano-conta-select"

// Estado
const [planosSelecionados, setPlanosSelecionados] = useState<string[]>([])

// Componente
<PlanoContaSelect
  value={planosSelecionados}
  onValueChange={setPlanosSelecionados}
  placeholder="Selecione planos de conta"
/>
```

## 🔧 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string[]` | `[]` | IDs dos planos selecionados |
| `onValueChange` | `(value: string[]) => void` | - | Callback quando seleção muda |
| `placeholder` | `string` | `"Selecione"` | Texto placeholder |
| `label` | `string` | `""` | Label do componente |
| `className` | `string` | `""` | Classes CSS adicionais |

## 🎨 Exemplos de Uso

### 1. **Básico**
```tsx
<PlanoContaSelect
  value={planos}
  onValueChange={setPlanos}
  placeholder="Todos os planos"
/>
```

### 2. **Com Label**
```tsx
<PlanoContaSelect
  value={planos}
  onValueChange={setPlanos}
  placeholder="Escolha os planos"
  label="Plano de Contas"
/>
```

### 3. **Largura Personalizada**
```tsx
<PlanoContaSelect
  value={planos}
  onValueChange={setPlanos}
  className="w-64"
/>
```

## 🔄 Integração com Filtros

### Na Lista de Lançamentos:
```tsx
const [planoContasSelecionadas, setPlanoContasSelecionadas] = useState<string[]>([])

// Filtro aplicado automaticamente
<PlanoContaSelect
  value={planoContasSelecionadas}
  onValueChange={setPlanoContasSelecionadas}
  placeholder="Todos os planos"
  label=""
/>
```

## 🗄️ Fonte de Dados

### Tabela: `plano_contas`
```sql
SELECT id, codigo, nome, tipo, ativo
FROM plano_contas 
WHERE empresa_id = ? AND ativo = true
ORDER BY codigo
```

### Formato dos Dados:
```typescript
interface PlanoConta {
  id: string
  codigo: string          // "1.01.01"
  nome: string            // "Caixa Geral"
  tipo: string            // "Ativo", "Passivo", "Receita", etc.
  ativo: boolean          // true/false
}
```

## 🎯 Estados do Componente

### **Carregando**
```tsx
// Mostra: "Carregando..."
```

### **Vazio**
```tsx
// Mostra: "Nenhuma conta disponível"
```

### **Com Busca**
```tsx
// Mostra: "Nenhuma conta encontrada" (se busca não retornar resultados)
```

### **Seleções**
```tsx
// Nenhuma: "Todos os planos"
// Uma: "1.01.01 - Caixa Geral"
// Múltiplas: "3 contas selecionadas"
```

## 🚀 Funcionalidades Avançadas

### 🔍 **Busca Multi-Campo**
- **Código**: `1.01.01`
- **Nome**: `Caixa Geral`
- **Tipo**: `Ativo`
- **Formatado**: `1.01.01 - Caixa Geral`

### ☑️ **Seleção Inteligente**
- **Selecionar Todas**: Marca/desmarca todos os planos filtrados
- **Estado Indeterminado**: Quando alguns (mas não todos) estão selecionados
- **Limpeza Rápida**: Botão para limpar todas as seleções

### 🎨 **Responsividade**
- **Mobile**: Interface otimizada para touch
- **Desktop**: Hover states e tooltips
- **Acessibilidade**: ARIA labels e navegação por teclado

## ⚡ Performance

### **Otimizações**
- `useMemo` para filtragem
- `ScrollArea` para listas grandes
- Debounce na busca (implícito)
- Renderização condicional

### **Limites Recomendados**
- ✅ Até 1000 planos: Performance excelente
- ⚠️ 1000-5000 planos: Performance boa
- ❌ Mais de 5000 planos: Considerar paginação

## 🎯 Aplicação nos Lançamentos

### **Antes**
- Filtro básico por dropdown simples
- Seleção única
- Sem busca

### **Depois** ✨
- Componente avançado com busca
- Seleção múltipla
- Interface moderna e intuitiva

### **Localização**
```
Lançamentos Contábeis > Filtros > Plano de Contas
```

## 🔗 Componentes Relacionados

- 🏦 **ContaBancariaSelect**: Para contas bancárias
- 🏢 **CentroCustoSelect**: Para centros de custo (futuro)
- 👥 **ClienteFornecedorSelect**: Para clientes/fornecedores (futuro)

## 📱 Teste Online

Acesse: `/exemplo-plano-conta-select` para ver todos os exemplos funcionando.

---

*Componente desenvolvido com foco na usabilidade e performance para facilitar a gestão do plano de contas.*
