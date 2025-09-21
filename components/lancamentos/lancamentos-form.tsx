"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/toast-context"
import { devLog } from "@/lib/utils/dev-log"
import { adjustToLocalTimezone } from "@/lib/date-utils"
import { ContaBancariaSelect } from "@/components/ui/conta-bancaria-select"
import { PlanoContaSelect } from "@/components/ui/plano-conta-select"
import { CentroCustoSelect } from "@/components/ui/centro-custo-select"
import { ClienteFornecedorSelect } from "@/components/ui/cliente-fornecedor-select"

interface Lancamento {
  id: string
  tipo: string
  data_lancamento: Date
  numero_documento: string
  plano_conta_id: string
  centro_custo_id: string
  valor: number
  cliente_fornecedor_id: string
  conta_bancaria_id: string
  conta_origem_id?: string  // Para transferências
  conta_destino_id?: string // Para transferências
  forma_pagamento_id: string
  descricao: string
  status: string
  status_conciliacao?: string // Status de conciliação: pendente, conciliado, ignorado
  // Novos campos para condição de recebimento
  data_vencimento?: Date
  recebimento_realizado?: boolean
  data_pagamento?: Date
  juros?: number
  multa?: number
  desconto?: number
  valor_pago?: number
  valor_original?: number // Valor original da operação
}

// Funções de persistência de dados
const FORM_STORAGE_KEY = 'lancamentos-form-data'

interface FormStorageData {
  formData: any
  date: string | null
  vencimentoDate: string | null
  dataPagamentoDate: string | null
  timestamp: number
}

const saveFormDataToStorage = (formData: any, date: Date | undefined, vencimentoDate: Date | undefined, dataPagamentoDate: Date | undefined) => {
  try {
    const storageData: FormStorageData = {
      formData,
      date: date?.toISOString() || null,
      vencimentoDate: vencimentoDate?.toISOString() || null,
      dataPagamentoDate: dataPagamentoDate?.toISOString() || null,
      timestamp: Date.now()
    }
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(storageData))
    console.log('Dados do formulário salvos no localStorage:', storageData)
  } catch (error) {
    console.warn('Erro ao salvar dados no localStorage:', error)
  }
}

const loadFormDataFromStorage = (): FormStorageData | null => {
  try {
    const stored = localStorage.getItem(FORM_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as FormStorageData
      // Verificar se os dados não são muito antigos (1 hora = 3600000ms)
      if (Date.now() - data.timestamp < 3600000) {
        console.log('Dados do formulário carregados do localStorage:', data)
        return data
      } else {
        // Remover dados antigos
        localStorage.removeItem(FORM_STORAGE_KEY)
        console.log('Dados do localStorage removidos por serem antigos')
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar dados do localStorage:', error)
  }
  return null
}

const clearFormDataStorage = () => {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY)
    console.log('Dados do formulário removidos do localStorage')
  } catch (error) {
    console.warn('Erro ao limpar dados do localStorage:', error)
  }
}

interface LancamentosFormProps {
  onSuccess?: () => void
  initialData?: Lancamento
  isEditing?: boolean
}

export function LancamentosForm({ onSuccess, initialData, isEditing = false }: LancamentosFormProps) {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(initialData?.data_lancamento)
  const [vencimentoDate, setVencimentoDate] = useState<Date | undefined>(initialData?.data_vencimento)
  const [dataPagamentoDate, setDataPagamentoDate] = useState<Date | undefined>(initialData?.data_pagamento)
  const [formData, setFormData] = useState({
    tipo: initialData?.tipo || "",
    numero_documento: initialData?.numero_documento || "",
    plano_conta_id: initialData?.plano_conta_id || "",
    centro_custo_id: initialData?.centro_custo_id || "",
    valor: initialData?.valor?.toString() || "",
    cliente_fornecedor_id: initialData?.cliente_fornecedor_id || "",
    conta_bancaria_id: initialData?.conta_bancaria_id || "",
    conta_origem_id: initialData?.conta_origem_id || "",
    conta_destino_id: initialData?.conta_destino_id || "",
    forma_pagamento_id: initialData?.forma_pagamento_id || "",
    descricao: initialData?.descricao || "",
    status: initialData?.status || "pendente",
    // Novos campos para condição de recebimento
    data_vencimento: initialData?.data_vencimento || "",
    recebimento_realizado: initialData?.recebimento_realizado || false,
    data_pagamento: initialData?.data_pagamento || "",
    juros: initialData?.juros?.toString() || "",
    multa: initialData?.multa?.toString() || "",
    desconto: initialData?.desconto?.toString() || "",
    valor_pago: initialData?.valor_pago?.toString() || "",
    valor_original: initialData?.valor_original?.toString() || "",
  })

  // Estados para opções dos dropdowns (apenas forma de pagamento ainda usa Select tradicional)
  const [formasPagamento, setFormasPagamento] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Referências para controle de carregamento e estado
  const dataLoadedRef = useRef(false)
  const isInitializedRef = useRef(false)
  const hasUnsavedChangesRef = useRef(false)
  const lastSavedTimestampRef = useRef<number>(0)

  useEffect(() => {
    if (userData?.empresa_id && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      fetchOptions()
    }
  }, [userData?.empresa_id])

  useEffect(() => {
    if (initialData) {
      console.log("Carregando dados iniciais para edição:", initialData)
      
      // Detectar se é uma transferência EXISTENTE baseado no número do documento
      const isTransferenciaExistente = initialData.numero_documento?.includes('TRANSF-') && 
                                      (initialData.numero_documento.includes('-ENTRADA') || 
                                       initialData.numero_documento.includes('-SAIDA'))
      
      // Detectar se é uma transferência NOVA (da conciliação)
      const isTransferenciaNova = initialData.tipo === 'transferencia' && initialData.id === ''
      
      console.log("É transferência existente?", isTransferenciaExistente)
      console.log("É transferência nova?", isTransferenciaNova)
      
      if (isTransferenciaExistente) {
        // Se é transferência existente, buscar o lançamento complementar para obter conta origem/destino
        buscarLancamentoComplementar(initialData)
      } else {
        // Lançamento normal ou transferência nova
        setFormData({
          tipo: initialData.tipo,
          numero_documento: initialData.numero_documento,
          plano_conta_id: initialData.plano_conta_id,
          centro_custo_id: initialData.centro_custo_id,
          valor: initialData.valor.toString(),
          cliente_fornecedor_id: initialData.cliente_fornecedor_id,
          conta_bancaria_id: initialData.conta_bancaria_id,
          conta_origem_id: initialData.conta_origem_id || "",
          conta_destino_id: initialData.conta_destino_id || "",
          forma_pagamento_id: initialData.forma_pagamento_id,
          descricao: initialData.descricao,
          status: initialData.status,
          // Novos campos para condição de recebimento
          data_vencimento: initialData.data_vencimento || "",
          recebimento_realizado: initialData.recebimento_realizado || false,
          data_pagamento: initialData.data_pagamento || "",
          juros: initialData.juros?.toString() || "",
          multa: initialData.multa?.toString() || "",
          desconto: initialData.desconto?.toString() || "",
          valor_pago: initialData.valor_pago?.toString() || "",
          valor_original: initialData.valor_original?.toString() || "",
        })
        
        // Atualizar as datas
        setVencimentoDate(initialData.data_vencimento)
        setDataPagamentoDate(initialData.data_pagamento)
      }
      setDate(initialData.data_lancamento)
    }
  }, [initialData])

  // Carregar dados do localStorage quando componente monta (apenas se não é edição)
  useEffect(() => {
    if (!isEditing && !initialData && !isInitializedRef.current) {
      isInitializedRef.current = true
      const storedData = loadFormDataFromStorage()
      
      if (storedData) {
        console.log('Restaurando dados do localStorage:', storedData)
        setFormData(storedData.formData)
        
        if (storedData.date) {
          setDate(new Date(storedData.date))
        }
        if (storedData.vencimentoDate) {
          setVencimentoDate(new Date(storedData.vencimentoDate))
        }
        if (storedData.dataPagamentoDate) {
          setDataPagamentoDate(new Date(storedData.dataPagamentoDate))
        }
        
        toast({
          title: "Dados restaurados",
          description: "Formulário restaurado automaticamente.",
          variant: "default"
        })
      }
    }
  }, [isEditing, initialData, toast])

  // Salvar dados automaticamente quando o formulário muda
  useEffect(() => {
    if (!isEditing && isInitializedRef.current) {
      const timeoutId = setTimeout(() => {
        saveFormDataToStorage(formData, date, vencimentoDate, dataPagamentoDate)
        hasUnsavedChangesRef.current = true
        lastSavedTimestampRef.current = Date.now()
      }, 1000) // Salvar após 1 segundo de inatividade

      return () => clearTimeout(timeoutId)
    }
  }, [formData, date, vencimentoDate, dataPagamentoDate, isEditing])

  // Listener para detectar mudança de visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isEditing) {
        // Página ficou oculta, salvar dados imediatamente
        console.log('Página ficou oculta - salvando dados automaticamente')
        saveFormDataToStorage(formData, date, vencimentoDate, dataPagamentoDate)
      } else if (document.visibilityState === 'visible' && dataLoadedRef.current) {
        // Página voltou ao foco, manter dados existentes
        console.log('Página voltou ao foco - mantendo dados existentes')
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current && !isEditing) {
        // Salvar antes de sair
        saveFormDataToStorage(formData, date, vencimentoDate, dataPagamentoDate)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [formData, date, vencimentoDate, dataPagamentoDate, isEditing])

  // Função para calcular valor pago/recebido
  const calcularValorPago = () => {
    if (formData.valor) {
      const valor = parseFloat(formData.valor) || 0
      const juros = parseFloat(formData.juros) || 0
      const multa = parseFloat(formData.multa) || 0
      const desconto = parseFloat(formData.desconto) || 0
      
      return valor + juros + multa - desconto
    }
    return 0
  }

  const fetchOptions = async () => {
    if (!userData?.empresa_id) {
      console.log('Usuário não possui empresa_id, pulando busca de opções')
      setLoading(false)
      return
    }

    // Verificar se já está carregando para evitar múltiplas chamadas
    if (loading && formasPagamento.length > 0) {
      console.log('Dados já carregados, pulando nova busca')
      return
    }

    console.log('Iniciando busca de formas de pagamento para empresa:', userData.empresa_id)
    setLoading(true)
    
    try {
      // Buscar formas de pagamento com timeout para evitar travamentos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na busca de dados')), 10000)
      )
      
      const dataPromise = supabase
        .from('formas_pagamento')
        .select('id, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('nome')

      const { data: formas, error: formasError } = await Promise.race([
        dataPromise,
        timeoutPromise
      ]) as any

      if (formasError) {
        console.error('Erro ao buscar formas de pagamento:', formasError)
        
        // Se já temos dados em cache, usar eles
        if (formasPagamento.length > 0) {
          console.log('Usando dados em cache devido ao erro')
          setLoading(false)
          return
        }
      }

      console.log('Formas de pagamento carregadas:', formas)
      setFormasPagamento(formas || [])
    } catch (error: any) {
      console.error('Erro ao carregar opções:', error)
      
      // Se for timeout e temos dados em cache, usar eles
      if (error.message === 'Timeout na busca de dados' && formasPagamento.length > 0) {
        console.log('Timeout detectado, usando dados em cache')
        toast({
          title: "Carregamento lento",
          description: "Usando dados salvos localmente.",
          variant: "default"
        })
      } else {
        setFormasPagamento([])
      }
    } finally {
      setLoading(false)
    }
  }

  const buscarLancamentoComplementar = async (lancamentoAtual: Lancamento) => {
    try {
      console.log("Buscando lançamento complementar para:", lancamentoAtual.numero_documento)
      
      // Extrair o ID base do documento (remover -ENTRADA ou -SAIDA)
      const baseId = lancamentoAtual.numero_documento
        ?.replace('-ENTRADA', '')
        .replace('-SAIDA', '')
      
      if (!baseId) {
        console.error("Não foi possível extrair o ID base do documento")
        return
      }
      
      // Buscar o lançamento complementar
      const { data: lancamentoComplementar, error } = await supabase
        .from('lancamentos')
        .select('*')
        .like('numero_documento', `${baseId}%`)
        .neq('id', lancamentoAtual.id)
        .eq('empresa_id', userData?.empresa_id)
        .single()
      
      if (error) {
        console.error("Erro ao buscar lançamento complementar:", error)
        return
      }
      
      console.log("Lançamento complementar encontrado:", lancamentoComplementar)
      
      // Determinar qual é origem e qual é destino
      let contaOrigem, contaDestino
      if (lancamentoAtual.tipo === 'despesa') {
        // Lançamento atual é a saída, então é a conta origem
        contaOrigem = lancamentoAtual.conta_bancaria_id
        contaDestino = lancamentoComplementar.conta_bancaria_id
      } else {
        // Lançamento atual é a entrada, então é a conta destino
        contaOrigem = lancamentoComplementar.conta_bancaria_id
        contaDestino = lancamentoAtual.conta_bancaria_id
      }
      
      // Limpar a descrição removendo o prefixo [TRANSFERÊNCIA...]
      const descricaoLimpa = lancamentoAtual.descricao
        .replace(/^\[TRANSFERÊNCIA (ENTRADA|SAÍDA)\]\s*/, '')
      
      setFormData({
        tipo: "transferencia",
        numero_documento: baseId,
        plano_conta_id: lancamentoAtual.plano_conta_id,
        centro_custo_id: lancamentoAtual.centro_custo_id,
        valor: lancamentoAtual.valor.toString(),
        cliente_fornecedor_id: "",
        conta_bancaria_id: "",
        conta_origem_id: contaOrigem,
        conta_destino_id: contaDestino,
        forma_pagamento_id: "",
        descricao: descricaoLimpa,
        status: lancamentoAtual.status,
        // Novos campos para condição de recebimento
        data_vencimento: "",
        recebimento_realizado: false,
        data_pagamento: "",
        juros: "",
        multa: "",
        desconto: "",
        valor_pago: "",
        valor_original: "",
      })
      
      console.log("Dados de transferência configurados para edição")
      
    } catch (error) {
      console.error("Erro ao buscar lançamento complementar:", error)
      // Em caso de erro, carregar como lançamento normal
      setFormData({
        tipo: lancamentoAtual.tipo,
        numero_documento: lancamentoAtual.numero_documento,
        plano_conta_id: lancamentoAtual.plano_conta_id,
        centro_custo_id: lancamentoAtual.centro_custo_id,
        valor: lancamentoAtual.valor.toString(),
        cliente_fornecedor_id: lancamentoAtual.cliente_fornecedor_id,
        conta_bancaria_id: lancamentoAtual.conta_bancaria_id,
        conta_origem_id: "",
        conta_destino_id: "",
        forma_pagamento_id: lancamentoAtual.forma_pagamento_id,
        descricao: lancamentoAtual.descricao,
        status: lancamentoAtual.status,
        // Novos campos para condição de recebimento
        data_vencimento: "",
        recebimento_realizado: false,
        data_pagamento: "",
        juros: "",
        multa: "",
        desconto: "",
        valor_pago: "",
        valor_original: "",
      })
    }
  }

  const criarOuBuscarRegistrosTransferencia = async () => {
    try {
      // Primeiro tentar buscar registros existentes com nome "TRANSFERÊNCIA"
      const { data: planoExistente } = await supabase
        .from('plano_contas')
        .select('id')
        .eq('empresa_id', userData?.empresa_id)
        .eq('nome', 'TRANSFERÊNCIA')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle()

      const { data: centroExistente } = await supabase
        .from('centro_custos')
        .select('id')
        .eq('empresa_id', userData?.empresa_id)
        .eq('nome', 'TRANSFERÊNCIA')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle()

      let planoId = planoExistente?.id
      let centroId = centroExistente?.id

      // Se não existir plano "TRANSFERÊNCIA", criar
      if (!planoId) {
        console.log("Criando plano de conta TRANSFERÊNCIA...")
        const { data: novoPlano, error: errorPlano } = await supabase
          .from('plano_contas')
          .insert([{
            codigo: `TRANSF-${Date.now()}`,
            nome: 'TRANSFERÊNCIA',
            tipo: 'ativo', // Campo obrigatório
            natureza: 'debito', // Campo obrigatório
            nivel: 1,
            empresa_id: userData?.empresa_id,
            ativo: true
          }])
          .select('id')
          .single()

        if (errorPlano) {
          console.warn("Erro ao criar plano TRANSFERÊNCIA, usando existente:", errorPlano)
          // Fallback: usar qualquer plano existente
          const { data: fallbackPlano } = await supabase
            .from('plano_contas')
            .select('id')
            .eq('empresa_id', userData?.empresa_id)
            .eq('ativo', true)
            .limit(1)
            .single()
          planoId = fallbackPlano?.id
        } else {
          planoId = novoPlano?.id
        }
      }

      // Se não existir centro "TRANSFERÊNCIA", criar
      if (!centroId) {
        console.log("Criando centro de custo TRANSFERÊNCIA...")
        const { data: novoCentro, error: errorCentro } = await supabase
          .from('centro_custos')
          .insert([{
            codigo: `TRANSF-${Date.now()}`,
            nome: 'TRANSFERÊNCIA',
            tipo: 'operacional', // Campo obrigatório
            empresa_id: userData?.empresa_id,
            ativo: true
          }])
          .select('id')
          .single()

        if (errorCentro) {
          console.warn("Erro ao criar centro TRANSFERÊNCIA, usando existente:", errorCentro)
          // Fallback: usar qualquer centro existente
          const { data: fallbackCentro } = await supabase
            .from('centro_custos')
            .select('id')
            .eq('empresa_id', userData?.empresa_id)
            .eq('ativo', true)
            .limit(1)
            .single()
          centroId = fallbackCentro?.id
        } else {
          centroId = novoCentro?.id
        }
      }

      if (!planoId || !centroId) {
        throw new Error("Não foi possível obter plano de conta e centro de custo para transferência")
      }

      return { planoId, centroId }
    } catch (error) {
      console.error("Erro ao criar/buscar registros de transferência:", error)
      throw error
    }
  }

  const limparLancamentosOrfaos = async () => {
    try {
      // Buscar transferências que podem ter lançamentos órfãos
      const { data: transferenciasOrfas, error } = await supabase
        .from('lancamentos')
        .select('numero_documento, id')
        .eq('empresa_id', userData?.empresa_id)
        .like('numero_documento', 'TRANSF-%')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) {
        console.warn("Erro ao buscar lançamentos órfãos:", error)
        return
      }
      
      // Agrupar por ID base da transferência
      const grupos: { [key: string]: any[] } = {}
      
      transferenciasOrfas?.forEach(lancamento => {
        const baseId = lancamento.numero_documento
          ?.replace('-ENTRADA', '')
          .replace('-SAIDA', '')
        
        if (baseId) {
          if (!grupos[baseId]) {
            grupos[baseId] = []
          }
          grupos[baseId].push(lancamento)
        }
      })
      
      // Identificar transferências com mais de 2 lançamentos (órfãos)
      const transferenciasComOrfaos = Object.entries(grupos).filter(([baseId, lancamentos]) => lancamentos.length > 2)
      
      if (transferenciasComOrfaos.length > 0) {
        console.log("Transferências com lançamentos órfãos encontradas:", transferenciasComOrfaos.length)
        
        for (const [baseId, lancamentos] of transferenciasComOrfaos) {
          // Manter apenas os 2 mais recentes
          const lancamentosOrdenados = lancamentos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          const lancamentosParaExcluir = lancamentosOrdenados.slice(2)
          
          if (lancamentosParaExcluir.length > 0) {
            const idsParaExcluir = lancamentosParaExcluir.map(l => l.id)
            
            const { error: errorExclusao } = await supabase
              .from('lancamentos')
              .delete()
              .in('id', idsParaExcluir)
            
            if (errorExclusao) {
              console.warn("Erro ao excluir lançamentos órfãos:", errorExclusao)
            } else {
              console.log(`Excluídos ${idsParaExcluir.length} lançamentos órfãos da transferência ${baseId}`)
              toast({
                title: "Limpeza Automática",
                description: `Removidos ${idsParaExcluir.length} lançamentos duplicados de transferências anteriores.`,
                variant: "default",
              })
            }
          }
        }
      }
    } catch (error) {
      console.warn("Erro na limpeza de lançamentos órfãos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🚀 HANDLESUBMIT INICIADO 🚀")
    console.log("Event:", e)
    console.log("FormData atual:", formData)
    console.log("Saving state:", saving)
    
    e.preventDefault()
    
    // Prevenir múltiplos cliques
    if (saving) {
      console.log("❌ SALVAMENTO JÁ EM PROGRESSO - RETORNANDO")
      return
    }
    
    console.log("✅ SETANDO SAVING = TRUE")
    setSaving(true)
    
    // Validações mais robustas
    if (!date) {
      toast({
        title: "Erro",
        description: "Selecione a data do lançamento.",
        variant: "destructive"
      })
      setSaving(false)
      return
    }
    
    if (!formData.tipo) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de lançamento.",
        variant: "destructive"
      })
      setSaving(false)
      return
    }

    // Validações específicas para transferência
    if (formData.tipo === "transferencia") {
      console.log("Validando transferência - dados:", {
        conta_origem_id: formData.conta_origem_id,
        conta_destino_id: formData.conta_destino_id,
        valor: formData.valor,
        descricao: formData.descricao
      })
      
      if (!formData.conta_origem_id || formData.conta_origem_id === "") {
        console.log("Erro: conta origem não selecionada")
        toast({
          title: "Erro",
          description: "Selecione a conta de origem.",
          variant: "destructive"
        })
        setSaving(false)
        return
      }
      
      if (!formData.conta_destino_id || formData.conta_destino_id === "") {
        console.log("Erro: conta destino não selecionada")
        toast({
          title: "Erro",
          description: "Selecione a conta de destino.",
          variant: "destructive"
        })
        setSaving(false)
        return
      }
      
      if (formData.conta_origem_id === formData.conta_destino_id) {
        console.log("Erro: contas origem e destino são iguais")
        toast({
          title: "Erro",
          description: "A conta de origem deve ser diferente da conta de destino.",
          variant: "destructive"
        })
        setSaving(false)
        return
      }

      // Verificar se as contas existem (simplificado)
      console.log("Validação simplificada - contas selecionadas:", {
        origem: formData.conta_origem_id,
        destino: formData.conta_destino_id
      })
      
      // Por enquanto, vamos pular a validação detalhada e apenas continuar
      // se as contas estão preenchidas (validação básica já foi feita acima)
    } else {
      // Validações para receita e despesa
      if (!formData.plano_conta_id) {
        toast({
          title: "Erro",
          description: "Selecione o plano de contas.",
          variant: "destructive"
        })
        setSaving(false)
        return
      }
      
      if (!formData.centro_custo_id) {
        toast({
          title: "Erro",
          description: "Selecione o centro de custo.",
          variant: "destructive"
        })
        setSaving(false)
        return
      }
      
      if (!formData.conta_bancaria_id) {
        toast({
          title: "Erro",
          description: "Selecione a conta bancária.",
          variant: "destructive"
        })
        setSaving(false)
        return
      }
    }
    
    if (!formData.valor || isNaN(parseFloat(formData.valor)) || parseFloat(formData.valor) <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido maior que zero.",
        variant: "destructive"
      })
      setSaving(false)
      return
    }
    
    if (!formData.descricao || formData.descricao.trim() === '') {
      toast({
        title: "Erro",
        description: formData.tipo === "transferencia" ? "Informe o histórico da transferência." : "Informe uma descrição para o lançamento.",
        variant: "destructive"
      })
      setSaving(false)
      return
    }
    
    if (!userData?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não identificada.",
        variant: "destructive"
      })
      setSaving(false)
      return
    }

    try {
      console.log("=== INICIANDO SALVAMENTO DE LANÇAMENTO ===")
      console.log("Tipo:", formData.tipo)
      console.log("UserData:", userData)
      console.log("FormData completo:", formData)
      
      // Declarar status calculado no início para ser acessível em todo o escopo
      let calculatedStatus = "pendente"
      
      devLog("Iniciando salvamento do lançamento", { formData, date, userData }, 'showSaveProcess')
      
      // Estrutura de dados diferente para transferência
      if (formData.tipo === "transferencia") {
        console.log("=== PROCESSANDO TRANSFERÊNCIA ===")
        
        // Limpar lançamentos órfãos antes de processar
        await limparLancamentosOrfaos()
        
        try {
          // Verificar se é edição de transferência
          if (isEditing && initialData?.id) {
            console.log("=== EDITANDO TRANSFERÊNCIA EXISTENTE ===")
            
            // Buscar o lançamento complementar
            const numeroDocumentoAtual = initialData.numero_documento
            const baseId = numeroDocumentoAtual
              ?.replace('-ENTRADA', '')
              .replace('-SAIDA', '')
            
            if (baseId) {
              console.log("Buscando lançamentos da transferência com base:", baseId)
              
              // Buscar ambos os lançamentos da transferência
              const { data: lancamentosTransferencia, error: errorBusca } = await supabase
                .from('lancamentos')
                .select('*')
                .like('numero_documento', `${baseId}%`)
                .eq('empresa_id', userData?.empresa_id)
              
              if (errorBusca) {
                console.error("Erro ao buscar lançamentos da transferência:", errorBusca)
                throw errorBusca
              }
              
              console.log("Lançamentos encontrados para atualizar:", lancamentosTransferencia)
              
              if (lancamentosTransferencia && lancamentosTransferencia.length === 2) {
                const { planoId, centroId } = await criarOuBuscarRegistrosTransferencia()
                
                // Atualizar dados base
                const dadosBaseAtualizacao = {
                  data_lancamento: adjustToLocalTimezone(date!),
                  descricao: formData.descricao || `Transferência entre contas`,
                  valor: Number(formData.valor),
                  plano_conta_id: planoId,
                  centro_custo_id: centroId,
                }
                
                // Identificar qual é saída e qual é entrada
                const lancamentoSaida = lancamentosTransferencia.find(l => l.tipo === 'despesa')
                const lancamentoEntrada = lancamentosTransferencia.find(l => l.tipo === 'receita')
                
                if (lancamentoSaida && lancamentoEntrada) {
                  // Atualizar lançamento de saída
                  const { error: errorAtualizarSaida } = await supabase
                    .from('lancamentos')
                    .update({
                      ...dadosBaseAtualizacao,
                      conta_bancaria_id: formData.conta_origem_id,
                    })
                    .eq('id', lancamentoSaida.id)
                  
                  if (errorAtualizarSaida) {
                    console.error("Erro ao atualizar lançamento de saída:", errorAtualizarSaida)
                    throw errorAtualizarSaida
                  }
                  
                  // Atualizar lançamento de entrada
                  const { error: errorAtualizarEntrada } = await supabase
                    .from('lancamentos')
                    .update({
                      ...dadosBaseAtualizacao,
                      conta_bancaria_id: formData.conta_destino_id,
                    })
                    .eq('id', lancamentoEntrada.id)
                  
                  if (errorAtualizarEntrada) {
                    console.error("Erro ao atualizar lançamento de entrada:", errorAtualizarEntrada)
                    throw errorAtualizarEntrada
                  }
                  
                  console.log("Transferência atualizada com sucesso!")
                  toast({
                    title: "Sucesso",
                    description: "Transferência atualizada com sucesso!",
                  })
                  
                  onSuccess?.()
                  return
                  
                } else {
                  console.error("Não foi possível identificar os lançamentos de saída e entrada")
                  throw new Error("Erro na estrutura da transferência existente")
                }
              } else {
                console.error("Número incorreto de lançamentos encontrados:", lancamentosTransferencia?.length)
                throw new Error("Transferência com estrutura inválida")
              }
            } else {
              console.error("Não foi possível extrair o ID base do documento")
              throw new Error("Número de documento inválido para transferência")
            }
          } else {
            // Criação de nova transferência
            console.log("=== CRIANDO NOVA TRANSFERÊNCIA ===")
            
            const { planoId, centroId } = await criarOuBuscarRegistrosTransferencia()
            
            const numeroDocumento = `TRANSF-${Date.now()}`
            
            console.log("Plano ID:", planoId, "Centro ID:", centroId)
            console.log("Data:", adjustToLocalTimezone(date!))
            console.log("UserData:", userData)
            
            const dadosBaseLancamento = {
              tipo: '', // Será definido específicamente para cada lançamento
              numero_documento: numeroDocumento,
              data_lancamento: adjustToLocalTimezone(date!),
              descricao: formData.descricao || `Transferência entre contas`,
              valor: Number(formData.valor),
              plano_conta_id: planoId,
              centro_custo_id: centroId,
              empresa_id: userData?.empresa_id,
              usuario_id: userData?.id,
              status: 'pago',
              cliente_fornecedor_id: null,
              forma_pagamento_id: null,
            }

            // Criar lançamento de saída (despesa) na conta origem
            const lancamentoSaida = {
              ...dadosBaseLancamento,
              tipo: 'despesa',
              conta_bancaria_id: formData.conta_origem_id,
              numero_documento: `${numeroDocumento}-SAIDA`
            }

            // Criar lançamento de entrada (receita) na conta destino
            const lancamentoEntrada = {
              ...dadosBaseLancamento,
              tipo: 'receita',
              conta_bancaria_id: formData.conta_destino_id,
              numero_documento: `${numeroDocumento}-ENTRADA`
            }

            console.log("=== DADOS DO LANÇAMENTO DE SAÍDA ===")
            console.log(JSON.stringify(lancamentoSaida, null, 2))
            
            const { data: dataSaida, error: errorSaida } = await supabase
              .from('lancamentos')
              .insert([lancamentoSaida])
              .select()

            if (errorSaida) {
              console.error("Erro detalhado ao criar lançamento de saída:", errorSaida)
              console.error("Dados que causaram erro:", lancamentoSaida)
              throw errorSaida
            }

            console.log("Lançamento de saída criado com sucesso:", dataSaida)
            console.log("=== DADOS DO LANÇAMENTO DE ENTRADA ===")
            console.log(JSON.stringify(lancamentoEntrada, null, 2))
            
            const { data: dataEntrada, error: errorEntrada } = await supabase
              .from('lancamentos')
              .insert([lancamentoEntrada])
              .select()

            if (errorEntrada) {
              console.error("Erro detalhado ao criar lançamento de entrada:", errorEntrada)
              console.error("Dados que causaram erro:", lancamentoEntrada)
              throw errorEntrada
            }

            console.log("Lançamento de entrada criado com sucesso:", dataEntrada)
            
            toast({
              title: "Sucesso",
              description: "Transferência realizada com sucesso!",
            })

            onSuccess?.()
            return
          }
          
        } catch (error: any) {
          console.error('Erro ao salvar transferência:', error)
          toast({
            title: "Erro",
            description: error.message || "Erro ao salvar transferência. Tente novamente.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }
      }

      // Para receitas e despesas normais
      // Determinar o valor principal baseado no tipo e se foi pago/recebido
      let valorPrincipal = parseFloat(formData.valor)
      
      // Se foi pago/recebido, usar o valor efetivo
      if (formData.recebimento_realizado && formData.valor_pago && formData.valor_pago !== "") {
        valorPrincipal = parseFloat(formData.valor_pago)
      }

      // Calcular status automaticamente baseado nos campos preenchidos
      // Se é transferência, sempre é pago
      if (formData.tipo === "transferencia") {
        calculatedStatus = "pago"
      } 
      // Se tem data de pagamento E valor pago preenchidos, é pago
      else if (dataPagamentoDate && formData.valor_pago && parseFloat(formData.valor_pago) > 0) {
        calculatedStatus = "pago"
      }
      // Se não tem data de pagamento mas tem valor pago maior que 0, é pago
      else if (!dataPagamentoDate && formData.valor_pago && parseFloat(formData.valor_pago) > 0) {
        calculatedStatus = "pago"
      }
      
      console.log("=== CÁLCULO DE STATUS ===")
      console.log("Tipo:", formData.tipo)
      console.log("Data pagamento:", dataPagamentoDate)
      console.log("Valor pago:", formData.valor_pago)
      console.log("Status calculado:", calculatedStatus)
      console.log("Status no form:", formData.status)

      const lancamentoData = {
        tipo: formData.tipo,
        numero_documento: formData.numero_documento || null,
        data_lancamento: adjustToLocalTimezone(date),
        descricao: formData.descricao.trim(),
        valor: valorPrincipal, // Usar valor efetivo se pago/recebido
        plano_conta_id: formData.plano_conta_id,
        centro_custo_id: formData.centro_custo_id,
        conta_bancaria_id: formData.conta_bancaria_id,
        cliente_fornecedor_id: formData.cliente_fornecedor_id === "none" || !formData.cliente_fornecedor_id ? null : formData.cliente_fornecedor_id,
        forma_pagamento_id: formData.forma_pagamento_id === "none" || !formData.forma_pagamento_id ? null : formData.forma_pagamento_id,
        empresa_id: userData.empresa_id,
        usuario_id: userData.id,
        status: calculatedStatus, // Usar status calculado automaticamente
        // Novos campos para condição de recebimento
        data_vencimento: vencimentoDate ? adjustToLocalTimezone(vencimentoDate) : null,
        recebimento_realizado: formData.recebimento_realizado || false,
        data_pagamento: dataPagamentoDate ? adjustToLocalTimezone(dataPagamentoDate) : null,
        juros: formData.juros && formData.juros !== "" ? parseFloat(formData.juros) : 0,
        multa: formData.multa && formData.multa !== "" ? parseFloat(formData.multa) : 0,
        desconto: formData.desconto && formData.desconto !== "" ? parseFloat(formData.desconto) : 0,
        valor_pago: formData.valor_pago && formData.valor_pago !== "" ? parseFloat(formData.valor_pago) : 0,
        // Manter o valor original para referência
        valor_original: parseFloat(formData.valor),
      }

      // Validação dos campos obrigatórios
      if (!lancamentoData.tipo || !lancamentoData.numero_documento || !lancamentoData.plano_conta_id || 
          !lancamentoData.centro_custo_id || !lancamentoData.valor || !lancamentoData.empresa_id || 
          !lancamentoData.usuario_id) {
        console.error("=== CAMPOS OBRIGATÓRIOS FALTANDO ===")
        console.error("tipo:", lancamentoData.tipo)
        console.error("numero_documento:", lancamentoData.numero_documento)
        console.error("plano_conta_id:", lancamentoData.plano_conta_id)
        console.error("centro_custo_id:", lancamentoData.centro_custo_id)
        console.error("valor:", lancamentoData.valor)
        console.error("empresa_id:", lancamentoData.empresa_id)
        console.error("usuario_id:", lancamentoData.usuario_id)
        throw new Error("Campos obrigatórios não preenchidos")
      }

      // Validação do userData
      if (!userData || !userData.id || !userData.empresa_id) {
        console.error("=== ERRO DE AUTENTICAÇÃO ===")
        console.error("userData:", userData)
        console.error("userData.id:", userData?.id)
        console.error("userData.empresa_id:", userData?.empresa_id)
        throw new Error("Usuário não autenticado ou dados incompletos")
      }

      devLog("Dados do lançamento a serem salvos:", lancamentoData, 'showSaveProcess')
      console.log("=== DADOS COMPLETOS PARA SALVAMENTO ===")
      console.log("lancamentoData:", JSON.stringify(lancamentoData, null, 2))
      console.log("=== VERIFICAÇÃO DE CAMPOS OBRIGATÓRIOS ===")
      console.log("tipo:", lancamentoData.tipo)
      console.log("numero_documento:", lancamentoData.numero_documento)
      console.log("plano_conta_id:", lancamentoData.plano_conta_id)
      console.log("centro_custo_id:", lancamentoData.centro_custo_id)
      console.log("valor:", lancamentoData.valor)
      console.log("empresa_id:", lancamentoData.empresa_id)
      console.log("usuario_id:", lancamentoData.usuario_id)
      
      // Log específico para dados de status "pago"
      if (lancamentoData.status === 'pago') {
        devLog("PAYLOAD PARA STATUS 'PAGO':", lancamentoData, 'showPaymentStatusDetails')
      }

      let result
      if (isEditing && initialData?.id) {
        console.log("=== ATUALIZANDO LANÇAMENTO EXISTENTE ===")
        console.log("ID do lançamento:", initialData.id)
        console.log("Dados para atualização:", JSON.stringify(lancamentoData, null, 2))
        
        devLog("Atualizando lançamento existente:", initialData.id, 'showSaveProcess')
        result = await supabase
          .from("lancamentos")
          .update(lancamentoData)
          .eq("id", initialData.id)
          .select()
      } else {
        console.log("=== CRIANDO NOVO LANÇAMENTO ===")
        console.log("Dados para inserção:", JSON.stringify(lancamentoData, null, 2))
        
        devLog("Criando novo lançamento", undefined, 'showSaveProcess')
        result = await supabase
          .from("lancamentos")
          .insert([lancamentoData])
          .select()
      }

      console.log("=== RESULTADO DA OPERAÇÃO ===")
      console.log("Resultado completo:", result)
      console.log("Resultado.data:", result.data)
      console.log("Resultado.error:", result.error)
      console.log("Resultado.count:", result.count)
      
      devLog("Resultado da operação:", result, 'showSaveProcess')

      if (result.error) {
        console.error("=== ERRO DO SUPABASE ===")
        console.error("Erro completo:", result.error)
        console.error("Error.message:", result.error.message)
        console.error("Error.code:", result.error.code)
        console.error("Error.details:", result.error.details)
        console.error("Error.hint:", result.error.hint)
        console.error("Dados enviados:", JSON.stringify(lancamentoData, null, 2))
        
        // Se o erro é relacionado à coluna status_conciliacao, tentar sem ela
        if (result.error.message?.includes('status_conciliacao') || 
            result.error.details?.includes('status_conciliacao') ||
            result.error.hint?.includes('status_conciliacao')) {
          
          console.log("⚠️ Erro relacionado a status_conciliacao - tentando sem este campo")
          
          // Remover o campo status_conciliacao e tentar novamente
          const lancamentoDataSemConciliacao = { ...lancamentoData }
          delete (lancamentoDataSemConciliacao as any).status_conciliacao
          
          console.log("Tentando salvar sem status_conciliacao:", JSON.stringify(lancamentoDataSemConciliacao, null, 2))
          
          let retryResult
          if (isEditing && initialData?.id) {
            retryResult = await supabase
              .from("lancamentos")
              .update(lancamentoDataSemConciliacao)
              .eq("id", initialData.id)
              .select()
          } else {
            retryResult = await supabase
              .from("lancamentos")
              .insert([lancamentoDataSemConciliacao])
              .select()
          }
          
          if (retryResult.error) {
            console.error("Erro mesmo sem status_conciliacao:", retryResult.error)
            throw retryResult.error
          }
          
          console.log("✅ Sucesso na segunda tentativa (sem status_conciliacao)")
          result = retryResult
        } else {
          throw result.error
        }
      }

      if (!result.data || result.data.length === 0) {
        console.error("=== ERRO: NENHUM DADO RETORNADO ===")
        console.error("Resultado:", result)
        throw new Error("Nenhum dado foi retornado pela operação")
      }

      console.log("=== SUCESSO ===")
      console.log("Lançamento salvo:", result.data[0])
      
      // Debug específico do status salvo
      console.log("=== VERIFICAÇÃO DO STATUS SALVO ===")
      console.log("Status que foi enviado:", lancamentoData.status)
      console.log("Status retornado do banco:", result.data[0].status)
      console.log("Data pagamento salva:", result.data[0].data_pagamento)
      console.log("Valor pago salvo:", result.data[0].valor_pago)
      console.log("ID do lançamento salvo:", result.data[0].id)
      
      devLog("Lançamento salvo com sucesso!", undefined, 'showSaveProcess')
      
      // Limpar dados do localStorage se o salvamento foi bem-sucedido
      if (!isEditing) {
        clearFormDataStorage()
        hasUnsavedChangesRef.current = false
      }
      
      toast({
        title: "Sucesso!",
        description: formData.tipo === "transferencia" 
          ? "Transferência realizada com sucesso!" 
          : isEditing ? "Lançamento atualizado com sucesso!" : "Lançamento criado com sucesso!",
        variant: "default"
      })
      
      if (onSuccess) {
        onSuccess()
      }
      if (!isEditing) {
        handleClear()
      }
    } catch (error: any) {
      console.error("=== ERRO AO SALVAR LANÇAMENTO ===")
      console.error("Erro completo:", error)
      console.error("Tipo do erro:", typeof error)
      console.error("Stack do erro:", error.stack)
      console.error("Error.message:", error.message)
      console.error("Error.code:", error.code)
      console.error("Error.details:", error.details)
      console.error("Error.hint:", error.hint)
      
      console.error("Erro completo ao salvar lançamento:", error)
      
      // Log específico para erros com status "pago"  
      if (formData?.status === 'pago') {
        devLog("ERRO ESPECÍFICO COM STATUS 'PAGO':", {
          error: error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          formDataStatus: formData.status,
          allFormData: formData
        }, 'showPaymentStatusDetails')
      }
      
      let errorMessage = "Erro desconhecido ao salvar lançamento"
      
      // Verificar se é um erro do Supabase
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message
        } else if (error.details) {
          errorMessage = error.details
        } else if (error.hint) {
          errorMessage = error.hint
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      console.log("Mensagem de erro processada:", errorMessage)
      
      // Tratar erros específicos do banco
      if (error.code === '23505') {
        errorMessage = "Já existe um lançamento com este número de documento"
      } else if (error.code === '23503') {
        errorMessage = "Referência inválida. Verifique se todos os campos estão corretos"
      } else if (error.code === '42501') {
        errorMessage = "Você não tem permissão para realizar esta operação"
      } else if (error.code === '42703') {
        errorMessage = "Erro na estrutura dos dados. Verifique se todos os campos são válidos"
      } else if (error.code === 'PGRST301') {
        errorMessage = "Erro de permissão no banco de dados"
      }

      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      
      // Quando o tipo muda, limpar campos específicos
      if (field === "tipo") {
        if (value === "transferencia") {
          // Limpar campos não usados em transferência
          return {
            ...newData,
            numero_documento: "",
            plano_conta_id: "",
            centro_custo_id: "",
            cliente_fornecedor_id: "",
            conta_bancaria_id: "",
            forma_pagamento_id: "",
            status: "pago" // Transferência sempre é paga
          }
        } else {
          // Limpar campos específicos de transferência e plano_conta_id para forçar nova seleção
          return {
            ...newData,
            conta_origem_id: "",
            conta_destino_id: "",
            plano_conta_id: "", // Limpar plano de contas para forçar nova seleção baseada no tipo
            status: "pendente" // Receita/despesa pode ser pendente
          }
        }
      }
      
      return newData
    })
  }

  const handleClear = () => {
    setFormData({
      tipo: "",
      numero_documento: "",
      plano_conta_id: "",
      centro_custo_id: "",
      valor: "",
      cliente_fornecedor_id: "",
      conta_bancaria_id: "",
      conta_origem_id: "",
      conta_destino_id: "",
      forma_pagamento_id: "",
      descricao: "",
      status: "pendente",
      // Novos campos para condição de recebimento
              data_vencimento: "",
      recebimento_realizado: false,
      data_pagamento: "",
      juros: "",
      multa: "",
      desconto: "",
      valor_pago: "",
      valor_original: "",
    })
    setDate(undefined)
    setVencimentoDate(undefined)
    setDataPagamentoDate(undefined)
    
    // Limpar dados salvos no localStorage
    clearFormDataStorage()
    hasUnsavedChangesRef.current = false
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-center">Carregando formulário...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Primeira linha: Tipo, Data, Número do Documento, Forma de Pagamento e Cliente/Fornecedor (receita/despesa) */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Tipo de Lançamento - menor */}
          <div className="space-y-1.5 lg:w-40">
            <Label htmlFor="tipo">Tipo de Lançamento *</Label>
            <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data - menor */}
          <div className="space-y-1.5 lg:w-40">
            <Label>Data do Lançamento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-9 justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Número do Documento - médio */}
          <div className="space-y-1.5 lg:w-48">
            <Label htmlFor="numero_documento">Número do Documento *</Label>
            <Input
              id="numero_documento"
              type="text"
              value={formData.numero_documento}
              onChange={(e) => handleInputChange("numero_documento", e.target.value)}
              placeholder="NF, Boleto, Recibo..."
              className="bg-transparent h-9"
            />
          </div>

          {/* Forma de Pagamento - médio */}
          <div className="space-y-1.5 lg:w-48">
            <Label htmlFor="forma_pagamento_id">Forma de Pagamento</Label>
            <Select value={formData.forma_pagamento_id} onValueChange={(value) => handleInputChange("forma_pagamento_id", value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.id} value={forma.id}>
                    {forma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente/Fornecedor - flexível (apenas para receita e despesa) */}
          {formData.tipo !== "transferencia" && (
            <div className="space-y-1.5 flex-1">
              <Label>
                {formData.tipo === "receita" ? "Cliente" : 
                 formData.tipo === "despesa" ? "Fornecedor" : 
                 "Cliente/Fornecedor"}
              </Label>
              <ClienteFornecedorSelect
                value={formData.cliente_fornecedor_id ? [formData.cliente_fornecedor_id] : []}
                onValueChange={(values) => handleInputChange("cliente_fornecedor_id", values[0] || "")}
                placeholder={
                  formData.tipo === "receita" ? "Selecione cliente (opcional)" :
                  formData.tipo === "despesa" ? "Selecione fornecedor (opcional)" :
                  "Selecione cliente/fornecedor (opcional)"
                }
              />
            </div>
          )}
        </div>

        {/* Campos condicionais baseados no tipo de lançamento */}
        {formData.tipo === "transferencia" ? (
          // Campos específicos para transferência
          <>
            {/* Segunda linha: Contas e Valor */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Conta Origem - flexível */}
              <div className="space-y-1.5 flex-1">
                <Label>Conta Origem *</Label>
                <ContaBancariaSelect
                  value={formData.conta_origem_id ? [formData.conta_origem_id] : []}
                  onValueChange={(values) => handleInputChange("conta_origem_id", values[0] || "")}
                  placeholder="Selecione a conta de origem"
                  label=""
                />
              </div>

              {/* Conta Destino - flexível */}
              <div className="space-y-1.5 flex-1">
                <Label>Conta Destino *</Label>
                <ContaBancariaSelect
                  value={formData.conta_destino_id ? [formData.conta_destino_id] : []}
                  onValueChange={(values) => handleInputChange("conta_destino_id", values[0] || "")}
                  placeholder="Selecione a conta de destino"
                  label=""
                />
              </div>

              {/* Valor - menor */}
              <div className="space-y-1.5 lg:w-40">
                <Label htmlFor="valor_transferencia">Valor (R$) *</Label>
                <Input
                  id="valor_transferencia"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => handleInputChange("valor", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Histórico *</Label>
              <Textarea
                id="descricao"
                placeholder="Histórico da transferência..."
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </>
        ) : (
          // Campos para receita e despesa
          <>
            {/* Segunda linha: Plano de Contas, Centro de Custo, Caixa/Banco e Valor */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Plano de Contas - flexível */}
              <div className="space-y-1.5 flex-1">
                <Label>Plano de Contas *</Label>
                <PlanoContaSelect
                  value={formData.plano_conta_id ? [formData.plano_conta_id] : []}
                  onValueChange={(values) => handleInputChange("plano_conta_id", values[0] || "")}
                  placeholder="Selecione a conta"
                  tipoFiltro={formData.tipo === 'transferencia' ? undefined : formData.tipo}
                />
              </div>

              {/* Centro de Custo - flexível */}
              <div className="space-y-1.5 flex-1">
                <Label>Centro de Custo *</Label>
                <CentroCustoSelect
                  value={formData.centro_custo_id ? [formData.centro_custo_id] : []}
                  onValueChange={(values) => handleInputChange("centro_custo_id", values[0] || "")}
                  placeholder="Selecione o centro de custo"
                />
              </div>

              {/* Conta Bancária - flexível */}
              <div className="space-y-1.5 flex-1">
                <ContaBancariaSelect
                  value={formData.conta_bancaria_id ? [formData.conta_bancaria_id] : []}
                  onValueChange={(values) => handleInputChange("conta_bancaria_id", values[0] || "")}
                  placeholder="Selecione a conta"
                  label="Caixa/Banco *"
                />
              </div>

              {/* Valor - menor */}
              <div className="space-y-1.5 lg:w-40">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => handleInputChange("valor", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Terceira linha: Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição detalhada do lançamento..."
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>



            {/* Checkbox para ativar/desativar recebimento */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recebimento_realizado"
                  checked={formData.recebimento_realizado}
                  onChange={(e) => handleInputChange("recebimento_realizado", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="recebimento_realizado" className="text-sm font-medium">
                  {formData.tipo === "despesa" ? "Pagamento realizado" : "Recebimento realizado"}
                </Label>
              </div>
            </div>

            {/* Campos de pagamento - só aparecem se recebimento estiver ativado */}
            {formData.recebimento_realizado && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
                <h4 className="text-md font-semibold text-blue-900">Informações de Pagamento</h4>
                
                {/* Vencimento e Data de Pagamento */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Vencimento */}
                  <div className="space-y-1.5">
                    <Label>Vencimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-9 justify-start text-left font-normal bg-white">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {vencimentoDate ? format(vencimentoDate, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={vencimentoDate} onSelect={setVencimentoDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Data de Pagamento */}
                  <div className="space-y-1.5">
                    <Label>Data de Pagamento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-9 justify-start text-left font-normal bg-white">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataPagamentoDate ? format(dataPagamentoDate, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dataPagamentoDate} onSelect={setDataPagamentoDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Juros, Multa, Desconto e Valor Pago */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Juros */}
                  <div className="space-y-1.5">
                    <Label htmlFor="juros">Juros (R$)</Label>
                    <Input
                      id="juros"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.juros}
                      onChange={(e) => handleInputChange("juros", e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>

                  {/* Multa */}
                  <div className="space-y-1.5">
                    <Label htmlFor="multa">Multa (R$)</Label>
                    <Input
                      id="multa"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.multa}
                      onChange={(e) => handleInputChange("multa", e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>

                  {/* Desconto */}
                  <div className="space-y-1.5">
                    <Label htmlFor="desconto">Desconto (R$)</Label>
                    <Input
                      id="desconto"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.desconto}
                      onChange={(e) => handleInputChange("desconto", e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>

                  {/* Valor Pago/Recebido */}
                  <div className="space-y-1.5">
                    <Label htmlFor="valor_pago">
                      {formData.tipo === "receita" ? "Valor Recebido (R$)" : "Valor Pago (R$)"}
                    </Label>
                    <Input
                      id="valor_pago"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor_pago}
                      onChange={(e) => handleInputChange("valor_pago", e.target.value)}
                      onFocus={() => {
                        // Auto-calcular quando o campo receber foco
                        const valorCalculado = calcularValorPago()
                        handleInputChange("valor_pago", valorCalculado.toString())
                      }}
                      className="h-9 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status - Oculto, será definido automaticamente */}
            <div className="hidden">
              <input type="hidden" value={formData.status} />
            </div>
          </>
        )}

        {/* Botões - Posicionados no rodapé */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
          <Button type="button" variant="outline" onClick={handleClear} disabled={saving} className="px-6">
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button type="submit" disabled={saving} className="px-8 bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {saving 
              ? "Salvando..." 
              : isEditing ? "Atualizar Lançamento" : "Salvar Lançamento"
            }
          </Button>
        </div>
      </form>
    </div>
  )
}
