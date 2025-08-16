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

interface PlanoContasFormProps {
  onSuccess?: () => void
  initialData?: any
  contaPai?: string
  isEditing?: boolean
}

export function PlanoContasForm({
  onSuccess,
  initialData = null,
  contaPai = "",
  isEditing = false,
}: PlanoContasFormProps) {
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tipo: "",
    contaPai: "",
    natureza: "",
    nivel: "",
    descricao: "",
    ativa: true,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo || "",
        nome: initialData.nome || "",
        tipo: initialData.tipo || "",
        contaPai: initialData.conta_pai_id ? initialData.conta_pai_id : "",
        natureza: initialData.natureza || "",
        nivel: initialData.nivel ? String(initialData.nivel) : "",
        descricao: initialData.descricao || "",
        ativa: initialData.ativo !== undefined ? initialData.ativo : true,
      })
    } else if (contaPai) {
      // Para nova subconta, preenche a conta pai
      setFormData((prev) => ({
        ...prev,
        contaPai: contaPai,
      }))
    }
  }, [initialData, contaPai])

  const handleSubmit = async (e: React.FormEvent) => {
    // Validação extra para natureza
    const naturezaValida = formData.natureza === "debito" || formData.natureza === "credito"
    if (!naturezaValida) {
      alert("Natureza inválida! Selecione 'Devedora' ou 'Credora'.")
      return
    }
    e.preventDefault()
    let contaPaiId: string | null = null
    if (formData.contaPai) {
      // Busca o id da conta pai pelo código
      const { data: contaPaiData, error: contaPaiError } = await supabase
        .from("plano_contas")
        .select("id")
        .eq("codigo", formData.contaPai)
      if (contaPaiError) {
        alert("Erro ao buscar conta pai: " + contaPaiError.message)
        return
      }
      contaPaiId = Array.isArray(contaPaiData) && contaPaiData.length > 0 ? contaPaiData[0].id : null
    }
        // Monta o objeto para inserir/atualizar
    const novaConta = {
      codigo: formData.codigo,
      nome: formData.nome,
      tipo: formData.tipo,
      conta_pai_id: contaPaiId,
      natureza: formData.natureza,
      nivel: formData.nivel,
      descricao: formData.descricao,
      ativo: formData.ativa,
      status: 'ativo',
    }
        let error
        if (isEditing && initialData?.id) {
          // Atualiza conta existente
          ({ error } = await supabase.from("plano_contas").update(novaConta).eq("id", initialData.id))
        } else {
          // Cria nova conta
          ({ error } = await supabase.from("plano_contas").insert([novaConta]))
        }
    if (error) {
      alert("Erro ao salvar plano de contas: " + error.message)
      return
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
      codigo: "",
      nome: "",
      tipo: "",
      contaPai: contaPai || "", // Mantém conta pai se for subconta
      natureza: "",
      nivel: "",
      descricao: "",
      ativa: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Código da Conta */}
      <div className="space-y-2">
        <Label htmlFor="codigo">Código da Conta *</Label>
        <Input
          id="codigo"
          placeholder="Ex: 1.1.01.001"
          value={formData.codigo}
          onChange={(e) => handleInputChange("codigo", e.target.value)}
        />
      </div>

      {/* Nome da Conta */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Conta *</Label>
        <Input
          id="nome"
          placeholder="Ex: Caixa Geral"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>

      {/* Tipo de Conta */}
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de Conta *</Label>
        <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">1 - Ativo</SelectItem>
            <SelectItem value="passivo">2 - Passivo</SelectItem>
            <SelectItem value="patrimonio">3 - Patrimônio Líquido</SelectItem>
            <SelectItem value="receita">4 - Receitas</SelectItem>
            <SelectItem value="despesa">5 - Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conta Pai */}
      <div className="space-y-2">
        <Label htmlFor="contaPai">Conta Pai</Label>
        <Select value={formData.contaPai} onValueChange={(value) => handleInputChange("contaPai", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a conta pai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Ativo</SelectItem>
            <SelectItem value="1.1">1.1 - Ativo Circulante</SelectItem>
            <SelectItem value="1.1.01">1.1.01 - Disponível</SelectItem>
            <SelectItem value="2">2 - Passivo</SelectItem>
            <SelectItem value="2.1">2.1 - Passivo Circulante</SelectItem>
            <SelectItem value="3">3 - Patrimônio Líquido</SelectItem>
            <SelectItem value="4">4 - Receitas</SelectItem>
            <SelectItem value="5">5 - Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Natureza */}
      <div className="space-y-2">
        <Label htmlFor="natureza">Natureza *</Label>
        <Select value={formData.natureza} onValueChange={(value) => handleInputChange("natureza", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a natureza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debito">Devedora</SelectItem>
            <SelectItem value="credito">Credora</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Nível */}
      <div className="space-y-2">
        <Label htmlFor="nivel">Nível Hierárquico *</Label>
        <Select value={formData.nivel} onValueChange={(value) => handleInputChange("nivel", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Grupo</SelectItem>
            <SelectItem value="2">2 - Subgrupo</SelectItem>
            <SelectItem value="3">3 - Conta</SelectItem>
            <SelectItem value="4">4 - Subconta</SelectItem>
            <SelectItem value="5">5 - Conta Analítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Descrição detalhada da conta..."
          value={formData.descricao}
          onChange={(e) => handleInputChange("descricao", e.target.value)}
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
          {isEditing ? "Atualizar Conta" : "Salvar Conta"}
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  )
}
