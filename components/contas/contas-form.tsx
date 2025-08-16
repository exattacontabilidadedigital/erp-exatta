"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"

interface ContasFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function ContasForm({ onSuccess, initialData, isEditing }: ContasFormProps) {
  const [formData, setFormData] = useState({
    banco_id: initialData?.banco_id || "",
    agencia: initialData?.agencia || "",
    conta: initialData?.conta || "",
    digito: initialData?.digito || "",
    tipoConta: initialData?.tipo_conta || "",
    gerente: initialData?.gerente || "",
    telefone_gerente: initialData?.telefone_gerente || "",
    saldoInicial: initialData?.saldo_inicial?.toString() || "",
    observacoes: initialData?.observacoes || "",
    ativa: initialData?.ativa ?? true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bancos, setBancos] = useState<any[]>([])
  useEffect(() => {
    async function fetchBancos() {
      const { data, error } = await supabase.from("bancos").select("id, codigo, nome, ativo")
      if (!error && data) setBancos(data)
    }
    fetchBancos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // Monta o objeto para o banco
    const contaData: any = {
      banco_id: formData.banco_id,
      agencia: formData.agencia,
      conta: formData.conta,
      digito: formData.digito,
      tipo_conta: formData.tipoConta,
      gerente: formData.gerente,
      telefone_gerente: formData.telefone_gerente,
      saldo_inicial: Number(formData.saldoInicial),
      saldo_atual: Number(formData.saldoInicial),
      observacoes: formData.observacoes,
      ativo: Boolean(formData.ativa),
    }
    let error = null
    if (isEditing && initialData?.id) {
      // Atualiza conta existente
      const { error: updateError } = await supabase
        .from("contas_bancarias")
        .update(contaData)
        .eq("id", initialData.id)
      error = updateError
    } else {
      // Cria nova conta
      contaData.saldo_atual = Number(formData.saldoInicial)
      const { error: insertError } = await supabase.from("contas_bancarias").insert([contaData])
      error = insertError
    }
    setLoading(false)
    if (error) {
      setError((isEditing ? "Erro ao atualizar conta: " : "Erro ao salvar conta: ") + error.message)
      return
    }
    // Dispara evento para atualizar lista
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("contasAtualizado"))
    }
    // Atualiza lista de contas imediatamente após salvar
    if (typeof window !== "undefined") {
      import("@/lib/supabase/client").then(({ supabase }) => {
        supabase
          .from("contas_bancarias")
          .select("*, bancos: banco_id (nome)")
          .then(({ data }) => {
            window.dispatchEvent(new CustomEvent("contasAtualizado", { detail: data }));
          });
      });
    }
    if (onSuccess) {
      onSuccess()
    }
    limparFormulario()
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const limparFormulario = () => {
    setFormData({
      banco_id: "",
      agencia: "",
      conta: "",
      digito: "",
      tipoConta: "",
      gerente: "",
      telefone_gerente: "",
      saldoInicial: "",
      observacoes: "",
      ativa: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loading && <div className="text-center py-2">Salvando conta...</div>}
      {error && <div className="text-center text-red-600 py-2">{error}</div>}
      {/* Banco */}
      <div className="space-y-2">
        <Label htmlFor="banco_id">Banco *</Label>
        <Select value={formData.banco_id} onValueChange={(value) => handleInputChange("banco_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o banco" />
          </SelectTrigger>
          <SelectContent>
            {bancos.map((banco) => (
              <SelectItem key={banco.id} value={banco.id} disabled={!banco.ativo}>
                {banco.codigo} - {banco.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agência */}
      <div className="space-y-2">
        <Label htmlFor="agencia">Agência *</Label>
        <Input
          id="agencia"
          placeholder="0000"
          maxLength={20}
          value={formData.agencia}
          onChange={(e) => handleInputChange("agencia", e.target.value)}
        />
      </div>

      {/* Conta e Dígito */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="conta">Conta *</Label>
          <Input
            id="conta"
            placeholder="00000000"
            maxLength={30}
            value={formData.conta}
            onChange={(e) => handleInputChange("conta", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="digito">Dígito *</Label>
          <Input
            id="digito"
            placeholder="0"
            maxLength={5}
            value={formData.digito}
            onChange={(e) => handleInputChange("digito", e.target.value)}
          />
        </div>
      </div>

      {/* Tipo de Conta */}
      <div className="space-y-2">
        <Label htmlFor="tipoConta">Tipo de Conta *</Label>
        <Select value={formData.tipoConta} onValueChange={(value) => handleInputChange("tipoConta", value)}>
          {/* tipo_conta VARCHAR(20) */}
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="corrente">Conta Corrente</SelectItem>
            <SelectItem value="poupanca">Conta Poupança</SelectItem>
            <SelectItem value="investimento">Conta Investimento</SelectItem>
            <SelectItem value="salario">Conta Salário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gerente */}
      <div className="space-y-2">
        <Label htmlFor="gerente">Gerente</Label>
        <Input
          id="gerente"
          placeholder="Nome do gerente"
          maxLength={255}
          value={formData.gerente}
          onChange={(e) => handleInputChange("gerente", e.target.value)}
        />
      </div>
      {/* Telefone do Gerente */}
      <div className="space-y-2">
        <Label htmlFor="telefone_gerente">Telefone do gerente</Label>
        <Input
          id="telefone_gerente"
          placeholder="(00) 00000-0000"
          maxLength={20}
          value={formData.telefone_gerente}
          onChange={(e) => handleInputChange("telefone_gerente", e.target.value)}
        />
      </div>

      {/* Saldo Inicial */}
      <div className="space-y-2">
        <Label htmlFor="saldoInicial">Saldo Inicial (R$) *</Label>
        <Input
          id="saldoInicial"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={formData.saldoInicial}
          onChange={(e) => handleInputChange("saldoInicial", e.target.value)}
        />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Observações sobre a conta..."
          value={formData.observacoes}
          onChange={(e) => handleInputChange("observacoes", e.target.value)}
          rows={3}
        />
      </div>

      {/* Conta Ativa */}
      <div className="flex items-center space-x-2">
        <Switch
          id="ativa"
          checked={formData.ativa}
          onCheckedChange={(checked) => handleInputChange("ativa", checked)}
        />
        <Label htmlFor="ativa">Conta Ativa</Label>
      </div>

      {/* Botões */}
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Salvar Conta
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  )
}
