"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface BancosFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function BancosForm({ onSuccess, initialData, isEditing = false }: BancosFormProps) {
  const { userData } = useAuth()
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    nomeCompleto: "",
    site: "",
    telefone: "",
    observacoes: "",
    ativo: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo || "",
        nome: initialData.nome || "",
        nomeCompleto: initialData.nomeCompleto || "",
        site: initialData.site || "",
        telefone: initialData.telefone || "",
        observacoes: initialData.observacoes || "",
        ativo: initialData.ativo ?? true,
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validações básicas
    if (!formData.codigo.trim()) {
      alert("Código do banco é obrigatório!")
      setLoading(false)
      return
    }

    if (!formData.nome.trim()) {
      alert("Nome abreviado é obrigatório!")
      setLoading(false)
      return
    }

    if (!formData.nomeCompleto.trim()) {
      alert("Nome completo é obrigatório!")
      setLoading(false)
      return
    }

    // Validação de URL se fornecida
    if (formData.site && !/^https?:\/\/.+/.test(formData.site)) {
      alert("Site deve começar com http:// ou https://")
      setLoading(false)
      return
    }

    // Verificar se já existe um banco com o mesmo código
    const { data: existingBanco, error: checkError } = await supabase
      .from("bancos")
      .select("id")
      .eq("codigo", formData.codigo.trim())
      .eq("empresa_id", userData?.empresa_id)
      .neq("id", initialData?.id || "")

    if (checkError) {
      alert("Erro ao verificar código: " + checkError.message)
      setLoading(false)
      return
    }

    if (existingBanco && existingBanco.length > 0) {
      alert("Já existe um banco com este código!")
      setLoading(false)
      return
    }

    try {
      // Monta objeto para banco
      const banco = {
        codigo: formData.codigo.trim(),
        nome: formData.nome.trim(),
        nomeCompleto: formData.nomeCompleto.trim(),
        site: formData.site.trim() || null,
        telefone: formData.telefone.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        ativo: formData.ativo,
        empresa_id: userData?.empresa_id,
      }

      let error
      if (isEditing && initialData?.id) {
        // Atualiza banco existente
        const { error: updateError } = await supabase
          .from("bancos")
          .update(banco)
          .eq("id", initialData.id)
        error = updateError
      } else {
        // Insere novo banco
        const { error: insertError } = await supabase
          .from("bancos")
          .insert([banco])
        error = insertError
      }

      if (error) {
        alert("Erro ao salvar banco: " + error.message)
        setLoading(false)
        return
      }

      alert(isEditing ? "Banco atualizado com sucesso!" : "Banco criado com sucesso!")
      limparFormulario()
      onSuccess?.()
    } catch (error) {
      alert("Erro inesperado: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const limparFormulario = () => {
    setFormData({
      codigo: "",
      nome: "",
      nomeCompleto: "",
      site: "",
      telefone: "",
      observacoes: "",
      ativo: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="codigo">Código do Banco *</Label>
        <Input
          id="codigo"
          placeholder="Ex: 001, 341, 237"
          value={formData.codigo}
          onChange={(e) => handleInputChange("codigo", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome">Nome Abreviado *</Label>
        <Input
          id="nome"
          placeholder="Ex: BB, Itaú, Bradesco"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nomeCompleto">Nome Completo *</Label>
        <Input
          id="nomeCompleto"
          placeholder="Ex: Banco do Brasil S.A."
          value={formData.nomeCompleto}
          onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="site">Site</Label>
        <Input
          id="site"
          placeholder="https://www.banco.com.br"
          value={formData.site}
          onChange={(e) => handleInputChange("site", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          placeholder="(11) 0000-0000"
          value={formData.telefone}
          onChange={(e) => handleInputChange("telefone", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Informações adicionais..."
          value={formData.observacoes}
          onChange={(e) => handleInputChange("observacoes", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => handleInputChange("ativo", checked)}
        />
        <Label htmlFor="ativo">Banco Ativo</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : isEditing ? "Atualizar Banco" : "Salvar Banco"}
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  )
}
