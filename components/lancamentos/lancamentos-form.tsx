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
    forma_pagamento_id: initialData?.forma_pagamento_id || "",
    descricao: initialData?.descricao || "",
    status: initialData?.status || "pendente",
  })

  // Estados para opções dos dropdowns
  const [planoContas, setPlanoContas] = useState<any[]>([])
  const [centroCustos, setCentroCustos] = useState<any[]>([])
  const [contasBancarias, setContasBancarias] = useState<any[]>([])
  const [clientesFornecedores, setClientesFornecedores] = useState<any[]>([])
  const [formasPagamento, setFormasPagamento] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData?.empresa_id) {
      fetchOptions()
    }
  }, [userData?.empresa_id])

  useEffect(() => {
    if (initialData) {
      setFormData({
        tipo: initialData.tipo,
        numero_documento: initialData.numero_documento,
        plano_conta_id: initialData.plano_conta_id,
        centro_custo_id: initialData.centro_custo_id,
        valor: initialData.valor.toString(),
        cliente_fornecedor_id: initialData.cliente_fornecedor_id,
        conta_bancaria_id: initialData.conta_bancaria_id,
        forma_pagamento_id: initialData.forma_pagamento_id,
        descricao: initialData.descricao,
        status: initialData.status,
      })
      setDate(initialData.data_lancamento)
    }
  }, [initialData])

  const fetchOptions = async () => {
    if (!userData?.empresa_id) {
      console.log('Usuário não possui empresa_id, pulando busca de opções')
      setLoading(false)
      return
    }

    console.log('Iniciando busca de opções para empresa:', userData.empresa_id)
    setLoading(true)
    
    try {
      // Buscar plano de contas
      const { data: planos, error: planosError } = await supabase
        .from('plano_contas')
        .select('id, codigo, nome, nivel')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('codigo')

      if (planosError) {
        console.error('Erro ao buscar plano de contas:', planosError)
      }

      // Buscar centros de custo
      const { data: centros, error: centrosError } = await supabase
        .from('centro_custos')
        .select('id, codigo, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('codigo')

      if (centrosError) {
        console.error('Erro ao buscar centros de custo:', centrosError)
      }

      // Buscar contas bancárias
      const { data: contas, error: contasError } = await supabase
        .from('contas_bancarias')
        .select(`
          id,
          agencia,
          conta,
          digito,
          bancos(nome)
        `)
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)

      if (contasError) {
        console.error('Erro ao buscar contas bancárias:', contasError)
      }

      // Buscar clientes/fornecedores
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes_fornecedores')
        .select('id, nome, tipo')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('nome')

      if (clientesError) {
        console.error('Erro ao buscar clientes/fornecedores:', clientesError)
      }

      // Buscar formas de pagamento
      const { data: formas, error: formasError } = await supabase
        .from('formas_pagamento')
        .select('id, nome')
        .eq('empresa_id', userData.empresa_id)
        .eq('ativo', true)
        .order('nome')

      if (formasError) {
        console.error('Erro ao buscar formas de pagamento:', formasError)
      }

      console.log('Dados carregados:', { planos, centros, contas, clientes, formas })

      setPlanoContas(planos || [])
      setCentroCustos(centros || [])
      setContasBancarias(contas || [])
      setClientesFornecedores(clientes || [])
      setFormasPagamento(formas || [])
    } catch (error) {
      console.error('Erro ao carregar opções:', error)
      // Definir arrays vazios em caso de erro para não quebrar a interface
      setPlanoContas([])
      setCentroCustos([])
      setContasBancarias([])
      setClientesFornecedores([])
      setFormasPagamento([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) {
      toast({
        title: "Erro",
        description: "Selecione a data do lançamento.",
        variant: "destructive"
      })
      return
    }
    if (!userData?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não identificada.",
        variant: "destructive"
      })
      return
    }

    try {
      const lancamentoData = {
        tipo: formData.tipo,
        numero_documento: formData.numero_documento,
        data_lancamento: date.toISOString().split('T')[0],
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        plano_conta_id: formData.plano_conta_id,
        centro_custo_id: formData.centro_custo_id,
        conta_bancaria_id: formData.conta_bancaria_id,
        cliente_fornecedor_id: formData.cliente_fornecedor_id === "none" ? null : formData.cliente_fornecedor_id || null,
        forma_pagamento_id: formData.forma_pagamento_id === "none" ? null : formData.forma_pagamento_id || null,
        empresa_id: userData.empresa_id,
        usuario_id: userData.id,
        status: formData.status,
      }

      let error
      if (isEditing && initialData?.id) {
        ({ error } = await supabase
          .from("lancamentos")
          .update(lancamentoData)
          .eq("id", initialData.id))
      } else {
        ({ error } = await supabase
          .from("lancamentos")
          .insert([lancamentoData]))
      }

      if (error) throw error

      toast({
        title: "Sucesso!",
        description: isEditing ? "Lançamento atualizado com sucesso!" : "Lançamento criado com sucesso!",
        variant: "default"
      })
      
      if (onSuccess) {
        onSuccess()
      }
      if (!isEditing) {
        handleClear()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao salvar lançamento: ${error.message}`,
        variant: "destructive"
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
              <SelectItem value="pagamento">Pagamento</SelectItem>
              <SelectItem value="recebimento">Recebimento</SelectItem>
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
          <Label htmlFor="plano_conta_id">Plano de Contas *</Label>
          <Select value={formData.plano_conta_id} onValueChange={(value) => handleInputChange("plano_conta_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {planoContas.map((conta) => (
                <SelectItem key={conta.id} value={conta.id}>
                  {conta.codigo} - {conta.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Centro de Custo */}
        <div className="space-y-2">
          <Label htmlFor="centro_custo_id">Centro de Custo *</Label>
          <Select value={formData.centro_custo_id} onValueChange={(value) => handleInputChange("centro_custo_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o centro de custo" />
            </SelectTrigger>
            <SelectContent>
              {centroCustos.map((centro) => (
                <SelectItem key={centro.id} value={centro.id}>
                  {centro.codigo} - {centro.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label htmlFor="cliente_fornecedor_id">Cliente/Fornecedor</Label>
          <Select
            value={formData.cliente_fornecedor_id}
            onValueChange={(value) => handleInputChange("cliente_fornecedor_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione cliente/fornecedor (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {clientesFornecedores.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome} ({cliente.tipo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conta Bancária */}
        <div className="space-y-2">
          <Label htmlFor="conta_bancaria_id">Conta Bancária *</Label>
          <Select value={formData.conta_bancaria_id} onValueChange={(value) => handleInputChange("conta_bancaria_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {contasBancarias.map((conta) => (
                <SelectItem key={conta.id} value={conta.id}>
                  {(conta as any).bancos?.nome} - Ag: {conta.agencia} | Cc: {conta.conta}{conta.digito ? `-${conta.digito}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <SelectItem value="liquidado">Liquidado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botões */}
        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Atualizar Lançamento" : "Salvar Lançamento"}
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </form>
    </div>
  )
}
