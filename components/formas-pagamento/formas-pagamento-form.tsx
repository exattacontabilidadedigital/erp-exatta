"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/toast-context"

interface FormasPagamentoFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function FormasPagamentoForm({ onSuccess, initialData = null, isEditing = false }: FormasPagamentoFormProps) {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    prazoMedio: "",
    taxaJuros: "",
    descricao: "",
    ativo: true,
  })
  const [loading, setLoading] = useState(false)

  // Carrega dados iniciais se estiver editando
  useEffect(() => {
    if (initialData && isEditing) {
      console.log("Dados recebidos para edição:", initialData) // Debug
      
      // Mapear dados tanto do formato mock quanto do banco
      const prazoMedio = initialData.prazo_medio ?? initialData.prazoMedio ?? 0
      const taxaJuros = initialData.taxa_juros ?? initialData.taxaJuros ?? 0
      
      console.log("Prazo médio mapeado:", prazoMedio) // Debug
      console.log("Taxa de juros mapeada:", taxaJuros) // Debug
      console.log("Tipo mapeado:", initialData.tipo) // Debug
      
      setFormData({
        nome: initialData.nome || "",
        tipo: initialData.tipo || "",
        prazoMedio: prazoMedio.toString(),
        taxaJuros: taxaJuros.toString(),
        descricao: initialData.descricao || "",
        ativo: initialData.ativo ?? true,
      })
    }
  }, [initialData, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validações básicas
    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome da forma de pagamento é obrigatório!",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    if (!formData.tipo) {
      toast({
        title: "Erro de validação",
        description: "Tipo da forma de pagamento é obrigatório!",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    // Validação de números
    const prazoMedio = formData.prazoMedio ? parseInt(formData.prazoMedio) : 0
    const taxaJuros = formData.taxaJuros ? parseFloat(formData.taxaJuros) : 0

    if (prazoMedio < 0) {
      toast({
        title: "Erro de validação",
        description: "Prazo médio não pode ser negativo!",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    if (taxaJuros < 0 || taxaJuros > 100) {
      toast({
        title: "Erro de validação",
        description: "Taxa de juros deve estar entre 0 e 100%!",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    // Verificar se já existe uma forma de pagamento com o mesmo nome
    const { data: existingForma, error: checkError } = await supabase
      .from("formas_pagamento")
      .select("id")
      .eq("nome", formData.nome.trim())
      .eq("empresa_id", userData?.empresa_id)
      .neq("id", initialData?.id || "")

    if (checkError) {
      toast({
        title: "Erro",
        description: "Erro ao verificar nome: " + checkError.message,
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    if (existingForma && existingForma.length > 0) {
      toast({
        title: "Erro de validação",
        description: "Já existe uma forma de pagamento com este nome!",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    // Preparar dados para salvar
    const formaPagamentoData = {
      nome: formData.nome.trim(),
      tipo: formData.tipo,
      prazo_medio: prazoMedio,
      taxa_juros: taxaJuros,
      descricao: formData.descricao.trim() || null,
      ativo: formData.ativo,
      empresa_id: userData?.empresa_id,
    }

    try {
      let error
      if (isEditing && initialData?.id) {
        // Atualizar forma de pagamento existente
        const { error: updateError } = await supabase
          .from("formas_pagamento")
          .update(formaPagamentoData)
          .eq("id", initialData.id)
        error = updateError
      } else {
        // Criar nova forma de pagamento
        const { error: insertError } = await supabase
          .from("formas_pagamento")
          .insert([formaPagamentoData])
        error = insertError
      }

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao salvar forma de pagamento: " + error.message,
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      toast({
        title: "Sucesso",
        description: isEditing ? "Forma de pagamento atualizada com sucesso!" : "Forma de pagamento criada com sucesso!",
        variant: "success"
      })
      limparFormulario()
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: (error as Error).message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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
        <Select 
          value={formData.tipo || undefined} 
          onValueChange={(value) => handleInputChange("tipo", value)}
        >
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
        {/* Debug info */}
        {isEditing && (
          <div className="text-xs text-gray-500">
            Debug - Tipo atual: "{formData.tipo}"
          </div>
        )}
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
        <Button type="submit" className="flex-1" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  )
}
