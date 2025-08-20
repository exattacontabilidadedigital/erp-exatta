# 🎯 Componente ContaBancariaSelect

## Visão Geral

Componente idêntico ao da imagem anexa para facilitar a pesquisa e seleção de contas bancárias. Oferece interface intuitiva com busca, checkboxes e seleção múltipla.

## 📍 Localização

- **Arquivo**: `components/ui/conta-bancaria-select.tsx`
- **Exemplo**: `app/exemplo-conta-select/page.tsx`
- **URL de Teste**: `http://localhost:3001/exemplo-conta-select`

## 🎨 Layout Idêntico à Imagem

```
┌─────────────────────────────────┐
│ Caixa/Banco                  [x]│
├─────────────────────────────────┤
│ 🔍 Pesquisar...                 │
├─────────────────────────────────┤
│ ☑ Todos                         │
│ ☐ CAIXA CAFOD 2025 67.024-3     │
│ ☐ 0.4 Projeto Manos Unidas...   │
│ ☐ 15. Projeto ICS 67542         │
│ ☐ 0.3 Projeto Fastenaktion...   │
│ ☐ 0 - Projeto Misereor 67033-2  │
│ ☐ 0.2 Projeto Fundação Rosa... │
└─────────────────────────────────┘
```

## 🔧 Como Usar

### 1. Importação Básica
```tsx
import { ContaBancariaSelect } from "@/components/ui/conta-bancaria-select"
```

### 2. Uso Simples
```tsx
const [contasSelecionadas, setContasSelecionadas] = useState<string[]>([])

<ContaBancariaSelect
  value={contasSelecionadas}
  onValueChange={setContasSelecionadas}
  placeholder="Selecione as contas"
  label="Caixa/Banco"
/>
```

### 3. Uso Avançado
```tsx
<ContaBancariaSelect
  value={selectedAccounts}
  onValueChange={(accounts) => {
    setSelectedAccounts(accounts)
    console.log('Contas selecionadas:', accounts)
  }}
  placeholder="Selecione"
  label="Contas Bancárias"
  className="w-full max-w-sm"
/>
```

## 📊 Props do Componente

| Prop | Tipo | Padrão | Descrição |
|------|------|---------|-----------|
| `value` | `string[]` | `[]` | IDs das contas selecionadas |
| `onValueChange` | `(value: string[]) => void` | - | Callback quando seleção muda |
| `placeholder` | `string` | `"Selecione"` | Texto placeholder |
| `label` | `string` | `"Caixa/Banco"` | Label do componente |
| `className` | `string` | `""` | Classes CSS adicionais |

## 🎯 Funcionalidades

### ✅ **Pesquisa em Tempo Real**
- Campo de busca no topo
- Filtra por banco, agência, conta, tipo
- Busca case-insensitive
- Resultados instantâneos

### ✅ **Seleção Múltipla**
- Checkbox individual para cada conta
- Checkbox "Todos" para seleção em massa
- Estado indeterminado quando parcialmente selecionado
- Contador de seleções

### ✅ **Interface Responsiva**
- Dropdown com scroll otimizado
- Layout adaptável
- Máximo 320px de largura (similar à imagem)
- Altura fixa com scroll interno

### ✅ **Estados Visuais**
- Loading state durante carregamento
- Empty state quando sem contas
- No results quando busca não encontra nada
- Contador de seleções no rodapé

## 🔍 Exemplos de Busca

| Busca | Resultado |
|-------|-----------|
| `"caixa"` | Filtra contas com "caixa" no nome |
| `"67024"` | Filtra por número de conta |
| `"projeto"` | Filtra contas de projetos |
| `"corrente"` | Filtra por tipo de conta |

## 📱 Estados do Componente

### **Fechado (Trigger)**
```
┌─────────────────────────────┐
│ 3 contas selecionadas    ▼  │
└─────────────────────────────┘
```

### **Aberto (Dropdown)**
```
┌─────────────────────────────┐
│ 🔍 Pesquisar...             │
├─────────────────────────────┤
│ ☑ Todos                     │
│ ☑ Conta A                   │
│ ☐ Conta B                   │
│ ☑ Conta C                   │
├─────────────────────────────┤
│ 2 selecionadas    [Limpar]  │
└─────────────────────────────┘
```

## 🎨 Customização

### **Estilos Personalizados**
```tsx
<ContaBancariaSelect
  className="my-custom-class"
  // Aplica estilos customizados
/>
```

### **Label Personalizada**
```tsx
<ContaBancariaSelect
  label="Selecione as Contas do Projeto"
  placeholder="Escolha uma ou mais contas"
/>
```

## 📊 Integração com Formulários

### **Com React Hook Form**
```tsx
import { useForm, Controller } from "react-hook-form"

const { control } = useForm()

<Controller
  name="contas_bancarias"
  control={control}
  render={({ field }) => (
    <ContaBancariaSelect
      value={field.value || []}
      onValueChange={field.onChange}
      label="Contas Bancárias"
    />
  )}
/>
```

### **Com Validação**
```tsx
const [contasSelecionadas, setContasSelecionadas] = useState<string[]>([])
const [error, setError] = useState("")

const handleSubmit = () => {
  if (contasSelecionadas.length === 0) {
    setError("Selecione pelo menos uma conta")
    return
  }
  
  // Processar formulário...
}
```

## 🔄 Dados Retornados

### **Formato dos IDs**
```tsx
// Retorna array de IDs das contas
const contasSelecionadas = ["123", "456", "789"]
```

### **Para Obter Dados Completos**
```tsx
const getContasCompletas = (ids: string[]) => {
  return contas.filter(conta => ids.includes(conta.id))
}
```

## 🚀 Performance

- **Lazy Loading**: Carrega contas apenas quando necessário
- **Memoização**: Filtragem otimizada com useMemo
- **Debounce**: Pesquisa otimizada (implementar se necessário)
- **Virtual Scroll**: Para muitas contas (implementar se necessário)

## 📍 Onde Usar

### **Filtros de Relatórios**
```tsx
<ContaBancariaSelect
  value={filtros.contas}
  onValueChange={(contas) => setFiltros({...filtros, contas})}
  label="Filtrar por Conta"
/>
```

### **Formulários de Transação**
```tsx
<ContaBancariaSelect
  value={[transacao.conta_bancaria_id]}
  onValueChange={(contas) => setTransacao({...transacao, conta_bancaria_id: contas[0]})}
  label="Conta de Origem"
/>
```

### **Seleção de Múltiplas Contas**
```tsx
<ContaBancariaSelect
  value={contasParaProcessar}
  onValueChange={setContasParaProcessar}
  label="Contas para Processamento"
/>
```

## 🔧 Próximas Melhorias

1. **Agrupamento**: Agrupar por banco
2. **Favoritos**: Marcar contas favoritas
3. **Histórico**: Lembrar seleções recentes
4. **Drag & Drop**: Reordenar seleções
5. **Busca Avançada**: Filtros por saldo, tipo, etc.

---

**Status**: ✅ **Implementado e Funcionando**  
**Demo**: 🌐 **http://localhost:3001/exemplo-conta-select**  
**Compatível**: 📱 **Desktop e Mobile**
