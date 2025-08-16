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

interface Lancamento {
  id: string
  tipo: string
  data: Date
  numeroDocumento: string
  planoContas: string
  centroCusto: string
  valor: string
  clienteFornecedor: string
  contaBancaria: string
  historico: string
  status: string
}

interface LancamentosFormProps {
  onSuccess?: () => void
  initialData?: Lancamento
  isEditing?: boolean
}

export function LancamentosForm({ onSuccess, initialData, isEditing = false }: LancamentosFormProps) {
  const [date, setDate] = useState<Date | undefined>(initialData?.data)
  const [formData, setFormData] = useState({
    tipo: initialData?.tipo || "",
    numeroDocumento: initialData?.numeroDocumento || "",
    planoContas: initialData?.planoContas || "",
    centroCusto: initialData?.centroCusto || "",
    valor: initialData?.valor || "",
    clienteFornecedor: initialData?.clienteFornecedor || "",
    contaBancaria: initialData?.contaBancaria || "",
    historico: initialData?.historico || "",
    status: initialData?.status || "pendente",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        tipo: initialData.tipo,
        numeroDocumento: initialData.numeroDocumento,
        planoContas: initialData.planoContas,
        centroCusto: initialData.centroCusto,
        valor: initialData.valor,
        clienteFornecedor: initialData.clienteFornecedor,
        contaBancaria: initialData.contaBancaria,
        historico: initialData.historico,
        status: initialData.status,
      })
      setDate(initialData.data)
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) {
      alert("Selecione a data do lançamento.")
      return
    }
    // Monta o objeto para inserir
    const novoLancamento = {
      ...formData,
      data: date.toISOString(),
    }
    // Insere no Supabase
    const { error } = await supabase.from("lancamentos").insert([novoLancamento])
    if (error) {
      alert("Erro ao salvar lançamento: " + error.message)
      return
    }
    if (onSuccess) {
      onSuccess()
    }
    // Limpa o formulário após salvar
    handleClear()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClear = () => {
    setFormData({
      tipo: "",
      numeroDocumento: "",
      planoContas: "",
      centroCusto: "",
      valor: "",
      clienteFornecedor: "",
      contaBancaria: "",
      historico: "",
      status: "pendente",
    })
    setDate(undefined)
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
          <Label htmlFor="numeroDocumento">Número do Documento *</Label>
          <Input
            id="numeroDocumento"
            placeholder="NF, Boleto, Recibo..."
            value={formData.numeroDocumento}
            onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
          />
        </div>

        {/* Plano de Contas */}
        <div className="space-y-2">
          <Label htmlFor="planoContas">Plano de Contas *</Label>
          <Select value={formData.planoContas} onValueChange={(value) => handleInputChange("planoContas", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.1.01">1.1.01 - Caixa</SelectItem>
              <SelectItem value="1.1.02">1.1.02 - Bancos</SelectItem>
              <SelectItem value="1.2.01">1.2.01 - Contas a Receber</SelectItem>
              <SelectItem value="2.1.01">2.1.01 - Fornecedores</SelectItem>
              <SelectItem value="3.1.01">3.1.01 - Receita de Vendas</SelectItem>
              <SelectItem value="4.1.01">4.1.01 - Despesas Operacionais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Centro de Custo */}
        <div className="space-y-2">
          <Label htmlFor="centroCusto">Centro de Custo *</Label>
          <Select value={formData.centroCusto} onValueChange={(value) => handleInputChange("centroCusto", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o centro de custo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="001">001 - Administrativo</SelectItem>
              <SelectItem value="002">002 - Vendas</SelectItem>
              <SelectItem value="003">003 - Produção</SelectItem>
              <SelectItem value="004">004 - Marketing</SelectItem>
              <SelectItem value="005">005 - Financeiro</SelectItem>
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
          <Label htmlFor="clienteFornecedor">Cliente/Fornecedor *</Label>
          <Select
            value={formData.clienteFornecedor}
            onValueChange={(value) => handleInputChange("clienteFornecedor", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione cliente/fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente1">Empresa ABC Ltda</SelectItem>
              <SelectItem value="cliente2">Cliente DEF</SelectItem>
              <SelectItem value="fornecedor1">Fornecedor XYZ</SelectItem>
              <SelectItem value="fornecedor2">Fornecedor 123</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conta Bancária */}
        <div className="space-y-2">
          <Label htmlFor="contaBancaria">Conta Bancária *</Label>
          <Select value={formData.contaBancaria} onValueChange={(value) => handleInputChange("contaBancaria", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bb001">Banco do Brasil - CC 12345-6</SelectItem>
              <SelectItem value="itau001">Itaú - CC 67890-1</SelectItem>
              <SelectItem value="caixa001">Caixa Econômica - CC 11111-2</SelectItem>
              <SelectItem value="santander001">Santander - CC 22222-3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Histórico */}
        <div className="space-y-2">
          <Label htmlFor="historico">Histórico/Descrição *</Label>
          <Textarea
            id="historico"
            placeholder="Descrição detalhada do lançamento..."
            value={formData.historico}
            onChange={(e) => handleInputChange("historico", e.target.value)}
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
