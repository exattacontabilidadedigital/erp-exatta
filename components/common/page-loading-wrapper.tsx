"use client"

import { ReactNode, useEffect } from "react"
import { PageLoading, SectionLoading, TableLoading, FormLoading, MetricsLoading, ChartLoading } from "@/components/ui/loading-states"
import { usePageLoading, UseLoadingOptions } from "@/hooks/use-loading"

interface PageLoadingWrapperProps {
  /** Identificador único da página para controle de cache */
  pageKey: string
  /** Função que carrega os dados da página */
  loadData: () => Promise<any>
  /** Componente filho que será renderizado após o carregamento */
  children: ReactNode
  /** Título da página para exibir no loading */
  pageTitle?: string
  /** Tipo de layout de loading */
  loadingLayout?: 'default' | 'dashboard' | 'table' | 'form'
  /** Opções do hook de loading */
  loadingOptions?: UseLoadingOptions
  /** Se deve mostrar loading apenas na primeira visita */
  onlyFirstLoad?: boolean
  /** Callback quando o carregamento termina */
  onLoadComplete?: (data: any) => void
  /** Callback quando há erro */
  onError?: (error: any) => void
  /** Se deve mostrar notificações automáticas de sucesso (padrão: false) */
  showSuccessToast?: boolean
  /** Props para customizar os componentes de loading */
  loadingProps?: {
    metrics?: { cards?: number }
    table?: { columns?: number; rows?: number }
    form?: { fields?: number }
    sections?: { count?: number; rows?: number }
  }
}

export function PageLoadingWrapper({
  pageKey,
  loadData,
  children,
  pageTitle,
  loadingLayout = 'default',
  loadingOptions = {},
  onlyFirstLoad = true,
  onLoadComplete,
  onError,
  showSuccessToast = false,
  loadingProps = {}
}: PageLoadingWrapperProps) {
  const loading = usePageLoading(pageKey, {
    slowThreshold: 2000,
    timeoutThreshold: 10000,
    messages: {
      loading: pageTitle ? `Carregando ${pageTitle}...` : 'Carregando página...',
      slow: 'Carregamento demorado... Verificando conexão.',
      timeout: 'Timeout ao carregar página. Verifique sua conexão.',
      error: 'Erro ao carregar página.'
    },
    ...loadingOptions
  })

  useEffect(() => {
    // Verifica se há dados em cache primeiro
    if (onlyFirstLoad) {
      const cacheKey = `page_data_${pageKey}`
      const cachedData = sessionStorage.getItem(cacheKey)
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          const isRecent = Date.now() - timestamp < 10 * 60 * 1000 // 10 minutos
          
          if (isRecent && data) {
            console.log(`📋 Usando dados em cache para ${pageKey}`)
            onLoadComplete?.(data)
            return
          }
        } catch (error) {
          console.warn('Erro ao ler cache:', error)
        }
      }
    }
    
    // Não carrega se já carregou com sucesso antes e não há cache para enviar
    if (onlyFirstLoad && loading.hasLoadedSuccessfully && !loading.isFirstLoad) {
      console.log(`⚠️ Página ${pageKey} já carregada mas sem cache disponível`)
      return
    }
    
    const shouldLoad = !onlyFirstLoad || loading.isFirstLoad || loading.state === 'idle'
    
    if (shouldLoad && loading.state !== 'loading' && loading.state !== 'success') {
      console.log(`🔄 Carregando dados da página ${pageKey}...`)
      loading.loadPageData(loadData)
        .then(data => {
          // Salvar no cache
          if (onlyFirstLoad && data) {
            const cacheData = { data, timestamp: Date.now() }
            sessionStorage.setItem(`page_data_${pageKey}`, JSON.stringify(cacheData))
          }
          onLoadComplete?.(data)
        })
        .catch(error => {
          console.error(`Erro ao carregar página ${pageKey}:`, error)
          onError?.(error)
        })
    }
  }, [pageKey, onlyFirstLoad, loading.hasLoadedSuccessfully, loadData, onLoadComplete, onError]) // eslint-disable-line react-hooks/exhaustive-deps

  // Se ainda está carregando pela primeira vez, mostra o loading
  if ((loading.isLoading || loading.state === 'loading') && loading.isFirstLoad) {
    return renderLoadingLayout()
  }
  
  // Se já carregou antes e está só revalidando, mostra o conteúdo
  if (loading.hasLoadedSuccessfully && !loading.isFirstLoad) {
    return <>{children}</>
  }

  // Se teve erro, mostra página de erro
  if (loading.hasError || loading.hasTimeout) {
    return (
      <PageLoading
        message={loading.message}
        connectionStatus={loading.hasTimeout ? 'disconnected' : 'connected'}
        onRetry={() => {
          loading.reset()
          loading.loadPageData(loadData)
            .then(onLoadComplete)
            .catch(onError)
        }}
      />
    )
  }

  // Se carregou com sucesso, mostra o conteúdo
  return <>{children}</>

  function renderLoadingLayout() {
    const { metrics, table, form, sections } = loadingProps

    switch (loadingLayout) {
      case 'dashboard':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Header da página */}
              <SectionLoading title="Header" rows={2} />
              
              {/* Métricas */}
              <MetricsLoading cards={metrics?.cards || 4} />
              
              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ChartLoading title="Gráfico Principal" height="h-64" />
                </div>
                <div>
                  <SectionLoading title="Alertas" rows={sections?.rows || 3} />
                </div>
              </div>
              
              {/* Tabela de dados recentes */}
              <TableLoading 
                title="Dados Recentes" 
                columns={table?.columns || 5} 
                rows={table?.rows || 6} 
              />
            </div>
          </div>
        )

      case 'table':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Header com botões */}
              <SectionLoading title="Controles" rows={1} />
              
              {/* Filtros */}
              <FormLoading fields={4} />
              
              {/* Tabela principal */}
              <TableLoading 
                columns={table?.columns || 6} 
                rows={table?.rows || 10} 
              />
            </div>
          </div>
        )

      case 'form':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
              <div className="max-w-2xl mx-auto">
                <FormLoading 
                  title={pageTitle}
                  fields={form?.fields || 6} 
                />
              </div>
            </div>
          </div>
        )

      default:
        return (
          <PageLoading
            message={loading.message}
            submessage={loading.isSlow ? "A página está demorando mais que o normal para carregar." : undefined}
            connectionStatus={loading.isSlow ? 'slow' : 'checking'}
          />
        )
    }
  }
}

// Wrapper específico para páginas de dashboard
export function DashboardLoadingWrapper(props: Omit<PageLoadingWrapperProps, 'loadingLayout'>) {
  return <PageLoadingWrapper {...props} loadingLayout="dashboard" />
}

// Wrapper específico para páginas de tabela/listagem
export function TablePageLoadingWrapper(props: Omit<PageLoadingWrapperProps, 'loadingLayout'>) {
  return <PageLoadingWrapper {...props} loadingLayout="table" />
}

// Wrapper específico para páginas de formulário
export function FormPageLoadingWrapper(props: Omit<PageLoadingWrapperProps, 'loadingLayout'>) {
  return <PageLoadingWrapper {...props} loadingLayout="form" />
}

// HOC para adicionar loading automático a qualquer página
export function withPageLoading<P extends object>(
  Component: React.ComponentType<P>,
  config: {
    pageKey: string
    loadData: () => Promise<any>
    pageTitle?: string
    loadingLayout?: PageLoadingWrapperProps['loadingLayout']
    loadingOptions?: UseLoadingOptions
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <PageLoadingWrapper
        pageKey={config.pageKey}
        loadData={config.loadData}
        pageTitle={config.pageTitle}
        loadingLayout={config.loadingLayout}
        loadingOptions={config.loadingOptions}
      >
        <Component {...props} />
      </PageLoadingWrapper>
    )
  }
}