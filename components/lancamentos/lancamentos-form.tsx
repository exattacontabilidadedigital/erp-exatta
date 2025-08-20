"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
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
  })

  // Estados para opções dos dropdowns (apenas forma de pagamento ainda usa Select tradicional)
  const [formasPagamento, setFormasPagamento] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userData?.empresa_id) {
      fetchOptions()
    }
  }, [userData?.empresa_id])

  useEffect(() => {
    if (initialData) {
      console.log("Carregando dados iniciais para edição:", initialData)
      
      // Detectar se é uma transferência baseado no número do documento
      const isTransferencia = initialData.numero_documento?.includes('TRANSF-') && 
                             (initialData.numero_documento.includes('-ENTRADA') || 
                              initialData.numero_documento.includes('-SAIDA'))
      
      console.log("É transferência?", isTransferencia)
      
      if (isTransferencia) {
        // Se é transferência, buscar o lançamento complementar para obter conta origem/destino
        buscarLancamentoComplementar(initialData)
      } else {
        // Lançamento normal
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
        })
      }
      setDate(initialData.data_lancamento)
    }
  }, [initialData])

  const fetchOptions = async () => {
    if (!userData?.empresa_id) {
      console.log('Usuário não possui empresa_id, pulando busca de opções')
      setLoading(false)
      return
    }

    console.log('Iniciando busca de formas de pagamento para empresa:', userData.empresa_id)
    setLoading(true)
    
    try {
      // Buscar formas de pagamento (único campo que ainda usa Select tradicional)
      const { data: formas, error: formasError } = await supabase
        .from('formas_pagamento')
        .select('id, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('nome')

      if (formasError) {
        console.error('Erro ao buscar formas de pagamento:', formasError)
      }

      console.log('Formas de pagamento carregadas:', formas)
      setFormasPagamento(formas || [])
    } catch (error) {
      console.error('Erro ao carregar opções:', error)
      setFormasPagamento([])
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
    e.preventDefault()
    
    // Prevenir múltiplos cliques
    if (saving) return
    
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
      
      devLog.lancamentos("Iniciando salvamento do lançamento", { formData, date, userData }, 'showSaveProcess')
      
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
      const lancamentoData = {
        tipo: formData.tipo,
        numero_documento: formData.numero_documento || null,
        data_lancamento: adjustToLocalTimezone(date),
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        plano_conta_id: formData.plano_conta_id,
        centro_custo_id: formData.centro_custo_id,
        conta_bancaria_id: formData.conta_bancaria_id,
        cliente_fornecedor_id: formData.cliente_fornecedor_id === "none" || !formData.cliente_fornecedor_id ? null : formData.cliente_fornecedor_id,
        forma_pagamento_id: formData.forma_pagamento_id === "none" || !formData.forma_pagamento_id ? null : formData.forma_pagamento_id,
        empresa_id: userData.empresa_id,
        usuario_id: userData.id,
        status: formData.status,
      }

      devLog.lancamentos("Dados do lançamento a serem salvos:", lancamentoData, 'showSaveProcess')
      
      // Log específico para dados de status "pago"
      if (formData.status === 'pago') {
        devLog.lancamentos("PAYLOAD PARA STATUS 'PAGO':", lancamentoData, 'showPaymentStatusDetails')
      }

      let result
      if (isEditing && initialData?.id) {
        devLog.lancamentos("Atualizando lançamento existente:", initialData.id, 'showSaveProcess')
        result = await supabase
          .from("lancamentos")
          .update(lancamentoData)
          .eq("id", initialData.id)
          .select()
      } else {
        devLog.lancamentos("Criando novo lançamento", undefined, 'showSaveProcess')
        result = await supabase
          .from("lancamentos")
          .insert([lancamentoData])
          .select()
      }

      devLog.lancamentos("Resultado da operação:", result, 'showSaveProcess')

      if (result.error) {
        devLog.error("Erro do Supabase:", result.error)
        throw result.error
      }

      devLog.lancamentos("Lançamento salvo com sucesso!", undefined, 'showSaveProcess')

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
      console.error("Erro completo ao salvar lançamento:", error)
      console.error("Tipo do erro:", typeof error)
      console.error("Stack do erro:", error.stack)
      
      devLog.error("Erro completo ao salvar lançamento:", error)
      
      // Log específico para erros com status "pago"
      if (formData.status === 'pago') {
        devLog.lancamentos("ERRO ESPECÍFICO COM STATUS 'PAGO':", {
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

  const handleInputChange = (field: string, value: string) => {
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
    })
    setDate(undefined)
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
        {/* Tipo de Lançamento */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Lançamento *</Label>
          <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
              <SelectItem value="transferencia">Transferência Bancária</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label>Data do Lançamento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Campos condicionais baseados no tipo de lançamento */}
        {formData.tipo === "transferencia" ? (
          // Campos específicos para transferência
          <>
            {/* Conta Origem */}
            <div className="space-y-2">
              <Label>Conta Origem *</Label>
              <ContaBancariaSelect
                value={formData.conta_origem_id ? [formData.conta_origem_id] : []}
                onValueChange={(values) => handleInputChange("conta_origem_id", values[0] || "")}
                placeholder="Selecione a conta de origem"
              />
            </div>

            {/* Conta Destino */}
            <div className="space-y-2">
              <Label>Conta Destino *</Label>
              <ContaBancariaSelect
                value={formData.conta_destino_id ? [formData.conta_destino_id] : []}
                onValueChange={(values) => handleInputChange("conta_destino_id", values[0] || "")}
                placeholder="Selecione a conta de destino"
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => handleInputChange("valor", e.target.value)}
              />
            </div>

            {/* Histórico */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Histórico *</Label>
              <Textarea
                id="descricao"
                placeholder="Histórico da transferência..."
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                rows={3}
              />
            </div>
          </>
        ) : (
          // Campos para receita e despesa
          <>
            {/* Número do Documento */}
            <div className="space-y-2">
              <Label htmlFor="numero_documento">Número do Documento *</Label>
              <Input
                id="numero_documento"
                placeholder="NF, Boleto, Recibo..."
                value={formData.numero_documento}
                onChange={(e) => handleInputChange("numero_documento", e.target.value)}
              />
            </div>

            {/* Plano de Contas */}
            <div className="space-y-2">
              <Label>Plano de Contas *</Label>
              <PlanoContaSelect
                value={formData.plano_conta_id ? [formData.plano_conta_id] : []}
                onValueChange={(values) => handleInputChange("plano_conta_id", values[0] || "")}
                placeholder="Selecione a conta"
                tipoFiltro={formData.tipo === 'transferencia' ? undefined : formData.tipo}
              />
            </div>

            {/* Centro de Custo */}
            <div className="space-y-2">
              <Label>Centro de Custo *</Label>
              <CentroCustoSelect
                value={formData.centro_custo_id ? [formData.centro_custo_id] : []}
                onValueChange={(values) => handleInputChange("centro_custo_id", values[0] || "")}
                placeholder="Selecione o centro de custo"
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => handleInputChange("valor", e.target.value)}
              />
            </div>

            {/* Cliente/Fornecedor */}
            <div className="space-y-2">
              <Label>Cliente/Fornecedor</Label>
              <ClienteFornecedorSelect
                value={formData.cliente_fornecedor_id ? [formData.cliente_fornecedor_id] : []}
                onValueChange={(values) => handleInputChange("cliente_fornecedor_id", values[0] || "")}
                placeholder="Selecione cliente/fornecedor (opcional)"
              />
            </div>

            {/* Conta Bancária */}
            <div className="space-y-2">
              <Label>Conta Bancária *</Label>
              <ContaBancariaSelect
                value={formData.conta_bancaria_id ? [formData.conta_bancaria_id] : []}
                onValueChange={(values) => handleInputChange("conta_bancaria_id", values[0] || "")}
                placeholder="Selecione a conta"
              />
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="forma_pagamento_id">Forma de Pagamento</Label>
              <Select value={formData.forma_pagamento_id} onValueChange={(value) => handleInputChange("forma_pagamento_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento (opcional)" />
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

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição detalhada do lançamento..."
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Botões */}
        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving 
              ? "Salvando..." 
              : isEditing ? "Atualizar Lançamento" : "Salvar Lançamento"
            }
          </Button>
          <Button type="button" variant="outline" onClick={handleClear} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </form>
    </div>
  )
}
