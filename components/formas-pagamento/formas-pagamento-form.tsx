"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"

interface FormasPagamentoFormProps {
  onSuccess?: () => void
}

export function FormasPagamentoForm({ onSuccess }: FormasPagamentoFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    prazoMedio: "",
    taxaJuros: "",
    descricao: "",
    ativo: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Dados da forma de pagamento:", formData)
    limparFormulario()
    onSuccess?.()
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const limparFormulario = () => {
    setFormData({
      nome: "",
      tipo: "",
      prazoMedio: "",
      taxaJuros: "",
      descricao: "",
      ativo: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          placeholder="Ex: Dinheiro, Cartão de Crédito"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo *</Label>
        <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
            <SelectItem value="transferencia">Transferência Bancária</SelectItem>
            <SelectItem value="boleto">Boleto Bancário</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prazoMedio">Prazo Médio (dias)</Label>
        <Input
          id="prazoMedio"
          type="number"
          placeholder="0"
          value={formData.prazoMedio}
          onChange={(e) => handleInputChange("prazoMedio", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxaJuros">Taxa de Juros (%)</Label>
        <Input
          id="taxaJuros"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={formData.taxaJuros}
          onChange={(e) => handleInputChange("taxaJuros", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Informações adicionais..."
          value={formData.descricao}
          onChange={(e) => handleInputChange("descricao", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => handleInputChange("ativo", checked)}
        />
        <Label htmlFor="ativo">Forma de Pagamento Ativa</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  )
}
