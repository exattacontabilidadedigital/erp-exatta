"use client"

import { useState, useEffect, useCallback } from "react"

export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'slow' | 'timeout'

export interface UseLoadingOptions {
  /** Timeout em ms para considerar carregamento lento (padrão: 3000) */
  slowThreshold?: number
  /** Timeout em ms para considerar erro de timeout (padrão: 15000) */
  timeoutThreshold?: number
  /** Mensagem personalizada para cada estado */
  messages?: {
    loading?: string
    slow?: string
    timeout?: string
    error?: string
  }
  /** Callback quando o estado muda */
  onStateChange?: (state: LoadingState) => void
}

export interface LoadingResult {
  /** Estado atual do loading */
  state: LoadingState
  /** Se está carregando */
  isLoading: boolean
  /** Se teve erro */
  hasError: boolean
  /** Se está lento */
  isSlow: boolean
  /** Se teve timeout */
  hasTimeout: boolean
  /** Mensagem atual baseada no estado */
  message: string
  /** Inicia o loading */
  startLoading: () => void
  /** Finaliza com sucesso */
  setSuccess: () => void
  /** Finaliza com erro */
  setError: (error?: string) => void
  /** Reset para idle */
  reset: () => void
  /** Executa uma operação async com loading automático */
  executeWithLoading: <T>(operation: () => Promise<T>) => Promise<T>
}

const defaultMessages = {
  loading: 'Carregando...',
  slow: 'Carregamento demorado... Aguarde mais um pouco.',
  timeout: 'Timeout na operação. Verifique sua conexão.',
  error: 'Erro ao carregar dados.'
}

export function useLoading(options: UseLoadingOptions = {}): LoadingResult {
  const {
    slowThreshold = 3000,
    timeoutThreshold = 15000,
    messages = {},
    onStateChange
  } = options

  const [state, setState] = useState<LoadingState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const finalMessages = { ...defaultMessages, ...messages }

  // Timers para controle de tempo
  useEffect(() => {
    let slowTimer: NodeJS.Timeout
    let timeoutTimer: NodeJS.Timeout

    if (state === 'loading') {
      // Timer para marcar como lento
      slowTimer = setTimeout(() => {
        if (state === 'loading') {
          setState('slow')
        }
      }, slowThreshold)

      // Timer para timeout
      timeoutTimer = setTimeout(() => {
        if (state === 'loading' || state === 'slow') {
          setState('timeout')
        }
      }, timeoutThreshold)
    }

    return () => {
      clearTimeout(slowTimer)
      clearTimeout(timeoutTimer)
    }
  }, [state, slowThreshold, timeoutThreshold])

  // Callback quando estado muda
  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  const startLoading = useCallback(() => {
    setState('loading')
    setErrorMessage('')
  }, [])

  const setSuccess = useCallback(() => {
    setState('success')
    setErrorMessage('')
  }, [])

  const setError = useCallback((error?: string) => {
    setState('error')
    setErrorMessage(error || finalMessages.error)
  }, [finalMessages.error])

  const reset = useCallback(() => {
    setState('idle')
    setErrorMessage('')
  }, [])

  const executeWithLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    startLoading()
    try {
      const result = await operation()
      setSuccess()
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMsg)
      throw error
    }
  }, [startLoading, setSuccess, setError])

  const getCurrentMessage = (): string => {
    switch (state) {
      case 'loading':
        return finalMessages.loading
      case 'slow':
        return finalMessages.slow
      case 'timeout':
        return finalMessages.timeout
      case 'error':
        return errorMessage || finalMessages.error
      default:
        return ''
    }
  }

  return {
    state,
    isLoading: state === 'loading' || state === 'slow',
    hasError: state === 'error',
    isSlow: state === 'slow',
    hasTimeout: state === 'timeout',
    message: getCurrentMessage(),
    startLoading,
    setSuccess,
    setError,
    reset,
    executeWithLoading
  }
}

// Hook específico para operações com API
export interface UseApiLoadingOptions extends UseLoadingOptions {
  /** Retry automático em caso de erro */
  autoRetry?: boolean
  /** Número máximo de tentativas (padrão: 3) */
  maxRetries?: number
  /** Delay entre tentativas em ms (padrão: 1000) */
  retryDelay?: number
}

export function useApiLoading(options: UseApiLoadingOptions = {}) {
  const {
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    ...loadingOptions
  } = options

  const loading = useLoading(loadingOptions)
  const [retryCount, setRetryCount] = useState(0)

  const executeWithRetry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    const attemptOperation = async (attempt: number): Promise<T> => {
      try {
        if (attempt === 0) {
          loading.startLoading()
        }
        
        const result = await operation()
        loading.setSuccess()
        setRetryCount(0)
        return result
      } catch (error) {
        if (autoRetry && attempt < maxRetries - 1) {
          setRetryCount(attempt + 1)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return attemptOperation(attempt + 1)
        } else {
          const errorMsg = error instanceof Error ? error.message : 'Erro na API'
          loading.setError(`${errorMsg}${attempt > 0 ? ` (${attempt + 1} tentativas)` : ''}`)
          setRetryCount(0)
          throw error
        }
      }
    }

    return attemptOperation(0)
  }, [loading, autoRetry, maxRetries, retryDelay])

  const manualRetry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setRetryCount(0)
    return executeWithRetry(operation)
  }, [executeWithRetry])

  return {
    ...loading,
    retryCount,
    executeWithRetry,
    manualRetry,
    hasAutoRetry: autoRetry
  }
}

// Hook para múltiplos loadings paralelos
export function useMultipleLoading<T extends Record<string, any>>(
  keys: (keyof T)[],
  options: UseLoadingOptions = {}
) {
  const loadings = keys.reduce((acc, key) => {
    acc[key] = useLoading(options)
    return acc
  }, {} as Record<keyof T, LoadingResult>)

  const isAnyLoading = Object.values(loadings).some(loading => loading.isLoading)
  const hasAnyError = Object.values(loadings).some(loading => loading.hasError)
  const areAllSuccess = Object.values(loadings).every(loading => loading.state === 'success')

  const startAll = useCallback(() => {
    Object.values(loadings).forEach(loading => loading.startLoading())
  }, [loadings])

  const resetAll = useCallback(() => {
    Object.values(loadings).forEach(loading => loading.reset())
  }, [loadings])

  return {
    loadings,
    isAnyLoading,
    hasAnyError,
    areAllSuccess,
    startAll,
    resetAll
  }
}

// Hook para loading de página completa com persistência
export function usePageLoading(pageKey: string, options: UseLoadingOptions = {}) {
  const loading = useLoading(options)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [hasLoadedSuccessfully, setHasLoadedSuccessfully] = useState(false)

  useEffect(() => {
    // Verifica se é o primeiro carregamento desta página
    const hasLoadedBefore = sessionStorage.getItem(`page-loaded-${pageKey}`)
    const hasSuccessData = sessionStorage.getItem(`page-data-${pageKey}`)
    
    if (!hasLoadedBefore) {
      setIsFirstLoad(true)
      setHasLoadedSuccessfully(false)
      sessionStorage.setItem(`page-loaded-${pageKey}`, 'true')
    } else {
      setIsFirstLoad(false)
      setHasLoadedSuccessfully(!!hasSuccessData)
    }
  }, [pageKey])

  const loadPageData = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    // Se já carregou com sucesso antes e não é primeira vez, tenta usar cache
    if (!isFirstLoad && hasLoadedSuccessfully) {
      const cachedData = sessionStorage.getItem(`page-data-${pageKey}`)
      if (cachedData && cachedData !== 'loaded') {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          // Cache válido por 10 minutos
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            console.log(`📦 Usando dados em cache para página ${pageKey}`)
            return data
          }
        } catch (error) {
          console.warn('Erro ao ler cache da página:', error)
        }
      }
      
      // Se não tem cache válido mas já carregou antes, carrega silenciosamente
      console.log(`🔄 Recarregando dados da página ${pageKey} (cache expirado)`)
    } else {
      console.log(`🔄 Primeiro carregamento da página ${pageKey}`)
    }
    
    // Executa o carregamento
    const result = await loading.executeWithLoading(operation)
    
    // Salva no cache com timestamp
    const cacheData = {
      data: result,
      timestamp: Date.now()
    }
    sessionStorage.setItem(`page-data-${pageKey}`, JSON.stringify(cacheData))
    setHasLoadedSuccessfully(true)
    
    return result
  }, [loading, isFirstLoad, hasLoadedSuccessfully, pageKey])

  return {
    ...loading,
    isFirstLoad,
    hasLoadedSuccessfully,
    loadPageData
  }
}