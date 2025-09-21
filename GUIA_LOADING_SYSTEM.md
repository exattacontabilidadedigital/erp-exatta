# Sistema de Loading Avançado - Guia de Implementação

## 📋 Visão Geral

O sistema de loading foi desenvolvido para proporcionar uma experiência de usuário superior, com feedback visual adequado durante o carregamento de dados. O sistema inclui:

- **Loading states inteligentes** com detecção de conexão lenta e timeout
- **Componentes de skeleton** personalizáveis para diferentes layouts
- **Wrappers de página** que automatizam o controle de loading
- **Hooks especializados** para gerenciar estados de loading

## 🎯 Componentes Principais

### 1. Componentes de Loading States (`components/ui/loading-states.tsx`)

#### Spinner
```tsx
<Spinner size="lg" color="blue" />
```

#### LoadingMessage
```tsx
<LoadingMessage 
  message="Carregando dados..."
  submessage="Isso pode demorar alguns segundos"
  size="md"
  color="blue"
/>
```

#### PageLoading (Loading de página completa)
```tsx
<PageLoading
  message="Carregando dados da empresa..."
  connectionStatus="slow"
  onRetry={() => window.location.reload()}
/>
```

#### Skeletons especializados:
- **SectionLoading**: Para seções/cards
- **TableLoading**: Para tabelas
- **FormLoading**: Para formulários
- **MetricsLoading**: Para dashboards
- **ChartLoading**: Para gráficos
- **ListLoading**: Para listas

### 2. Hooks de Loading (`hooks/use-loading.ts`)

#### useLoading - Hook básico
```tsx
const loading = useLoading({
  slowThreshold: 3000,     // 3s para marcar como lento
  timeoutThreshold: 15000, // 15s para timeout
  messages: {
    loading: 'Carregando dados...',
    slow: 'Conexão lenta detectada...'
  }
})

// Estados disponíveis
loading.state        // 'idle' | 'loading' | 'success' | 'error' | 'slow' | 'timeout'
loading.isLoading    // boolean
loading.hasError     // boolean
loading.isSlow       // boolean
loading.message      // string com mensagem atual

// Métodos
loading.startLoading()
loading.setSuccess()
loading.setError('Erro personalizado')
loading.executeWithLoading(async () => {
  // operação async
})
```

#### useApiLoading - Hook para APIs com retry
```tsx
const apiLoading = useApiLoading({
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000
})

apiLoading.executeWithRetry(async () => {
  const response = await fetch('/api/data')
  return response.json()
})
```

#### usePageLoading - Hook para páginas
```tsx
const pageLoading = usePageLoading('minha-pagina', {
  slowThreshold: 2000
})

pageLoading.loadPageData(async () => {
  // Carrega dados da página
  return await fetchPageData()
})
```

### 3. Page Loading Wrappers (`components/common/page-loading-wrapper.tsx`)

#### TablePageLoadingWrapper
```tsx
<TablePageLoadingWrapper
  pageKey="contas-bancarias"
  loadData={loadContas}
  pageTitle="Contas Bancárias"
  onLoadComplete={(data) => console.log('Carregado:', data)}
  onError={(error) => console.error('Erro:', error)}
  loadingProps={{
    table: { columns: 6, rows: 8 }
  }}
>
  {/* Conteúdo da página */}
</TablePageLoadingWrapper>
```

#### DashboardLoadingWrapper
```tsx
<DashboardLoadingWrapper
  pageKey="dashboard"
  loadData={loadDashboardData}
  pageTitle="Dashboard"
  loadingProps={{
    metrics: { cards: 4 },
    table: { columns: 5, rows: 6 }
  }}
>
  {/* Conteúdo do dashboard */}
</DashboardLoadingWrapper>
```

## 🚀 Como Implementar

### 1. Para uma nova página

```tsx
"use client"

import { useState } from "react"
import { TablePageLoadingWrapper } from "@/components/common/page-loading-wrapper"
import { useToast } from "@/contexts/toast-context"

export default function MinhaPage() {
  const { toast } = useToast()
  const [dados, setDados] = useState([])

  const loadDados = async () => {
    const response = await fetch('/api/meus-dados')
    if (!response.ok) {
      throw new Error('Erro ao carregar dados')
    }
    const data = await response.json()
    setDados(data)
    return data
  }

  const handleLoadComplete = (data) => {
    toast({
      title: "Dados carregados",
      description: `${data.length} item(s) encontrado(s)`,
      variant: "default"
    })
  }

  const handleLoadError = (error) => {
    toast({
      title: "Erro ao carregar",
      description: error.message,
      variant: "destructive"
    })
  }

  return (
    <TablePageLoadingWrapper
      pageKey="minha-page"
      loadData={loadDados}
      pageTitle="Minha Página"
      onLoadComplete={handleLoadComplete}
      onError={handleLoadError}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Conteúdo da página */}
        <MeuComponente dados={dados} />
      </div>
    </TablePageLoadingWrapper>
  )
}
```

### 2. Para uma operação específica com loading

```tsx
const { toast } = useToast()
const loading = useApiLoading({
  autoRetry: true,
  maxRetries: 3,
  messages: {
    loading: 'Salvando dados...',
    error: 'Erro ao salvar. Tentando novamente...'
  }
})

const handleSave = async () => {
  try {
    await loading.executeWithRetry(async () => {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(dados)
      })
    })
    
    toast({
      title: "Sucesso",
      description: "Dados salvos com sucesso",
      variant: "default"
    })
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível salvar os dados",
      variant: "destructive"
    })
  }
}

return (
  <div className="relative">
    {loading.isLoading && (
      <ModalLoading message={loading.message} />
    )}
    
    <button 
      onClick={handleSave}
      disabled={loading.isLoading}
    >
      {loading.isLoading ? 'Salvando...' : 'Salvar'}
    </button>
  </div>
)
```

### 3. Loading customizado para componentes

```tsx
import { SectionLoading, LoadingMessage } from "@/components/ui/loading-states"
import { useLoading } from "@/hooks/use-loading"

function MeuComponente() {
  const loading = useLoading()
  const [dados, setDados] = useState(null)

  useEffect(() => {
    loading.executeWithLoading(async () => {
      const response = await fetch('/api/dados')
      const data = await response.json()
      setDados(data)
    })
  }, [])

  if (loading.isLoading) {
    return <SectionLoading title="Carregando seção" rows={3} />
  }

  if (loading.hasError) {
    return (
      <div className="text-center py-8">
        <LoadingMessage 
          message="Erro ao carregar dados"
          submessage="Tente novamente mais tarde"
          color="red"
          icon={<span className="text-4xl">❌</span>}
        />
        <button 
          onClick={() => loading.reset()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Conteúdo normal */}
    </div>
  )
}
```

## 🎨 Tipos de Layout de Loading

### 1. Default (PageLoading)
- Página completa com spinner central
- Ideal para: Login, páginas simples

### 2. Dashboard
- Header + Cards de métricas + Gráficos + Tabela
- Ideal para: Dashboard principal

### 3. Table
- Header com controles + Filtros + Tabela
- Ideal para: Listagens (lançamentos, contas, etc.)

### 4. Form
- Formulário com campos skeleton
- Ideal para: Páginas de cadastro/edição

## 📊 Benefícios

### Para o Usuário:
- **Feedback visual imediato** sobre o estado da aplicação
- **Indicação de problemas** de conectividade
- **Tempo estimado** de carregamento
- **Interface responsiva** mesmo durante loading

### Para o Desenvolvedor:
- **Código consistente** em toda aplicação
- **Fácil implementação** com wrappers prontos
- **Controle granular** quando necessário
- **Tratamento automático** de erros e timeouts

## 🔧 Configurações Recomendadas

```tsx
// Para páginas rápidas (dados locais)
const fastLoading = useLoading({
  slowThreshold: 1000,   // 1s
  timeoutThreshold: 5000 // 5s
})

// Para páginas normais (APIs internas)
const normalLoading = useLoading({
  slowThreshold: 3000,    // 3s
  timeoutThreshold: 15000 // 15s
})

// Para operações pesadas (relatórios, imports)
const heavyLoading = useLoading({
  slowThreshold: 5000,    // 5s
  timeoutThreshold: 30000 // 30s
})
```

## 📝 Exemplo Completo (Página de Contas)

A página `app/contas/page.tsx` foi refatorada como exemplo de implementação completa do sistema de loading. Ela demonstra:

- ✅ Loading automático na primeira carga
- ✅ Skeleton específico para tabelas
- ✅ Toast notifications para feedback
- ✅ Tratamento de erros com retry
- ✅ Refresh de dados com loading suave
- ✅ Estados de conectividade

## 💡 Próximos Passos

1. **Implementar em páginas principais**: Dashboard, Lançamentos, Relatórios
2. **Adicionar loading em modais**: Forms de cadastro, uploads
3. **Implementar progress bars**: Para operações longas (imports, exports)
4. **Adicionar cache inteligente**: Para reduzir loadings desnecessários

Este sistema proporciona uma experiência de usuário profissional e moderna, mantendo o usuário sempre informado sobre o estado da aplicação.