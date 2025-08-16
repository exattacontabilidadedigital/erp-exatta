"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"

interface BancosFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function BancosForm({ onSuccess, initialData, isEditing = false }: BancosFormProps) {
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    nomeCompleto: "",
    site: "",
    telefone: "",
    observacoes: "",
    ativo: true,
  })

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
    // Monta objeto para banco
    const banco = {
      codigo: formData.codigo,
      nome: formData.nome,
      site: formData.site,
      telefone: formData.telefone,
      ativo: formData.ativo,
    }
    let error
    if (isEditing && initialData?.id) {
      // Atualiza banco existente
      const { error: updateError } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("bancos").update(banco).eq("id", initialData.id)
      )
      error = updateError
    } else {
      // Insere novo banco
      const { error: insertError } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("bancos").insert([banco])
      )
      error = insertError
    }
    if (error) {
      alert("Erro ao salvar banco: " + error.message)
      return
    }
    // Dispara evento para atualizar a listagem
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bancosAtualizado"))
    }
    onSuccess?.()
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
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? "Atualizar Banco" : "Salvar Banco"}
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  )
}
