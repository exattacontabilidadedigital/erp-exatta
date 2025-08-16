"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"

interface ResponsaveisFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function ResponsaveisForm({ onSuccess, initialData, isEditing = false }: ResponsaveisFormProps) {
  const { userData } = useAuth()
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    ativo: true,
  })
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        nome: initialData.nome ?? "",
        email: initialData.email ?? "",
        ativo: typeof initialData.ativo === "boolean" ? initialData.ativo : true,
      })
    }
  }, [isEditing, initialData])

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.nome || formData.nome.trim() === "") {
      alert("O nome do responsável é obrigatório.")
      return
    }
    let error
    if (isEditing && initialData?.id) {
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("responsaveis").update({
          nome: formData.nome,
          email: formData.email,
          ativo: formData.ativo,
          empresa_id: userData?.empresa_id ?? null,
        }).eq("id", initialData.id)
      ))
    } else {
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("responsaveis").insert([
          {
            nome: formData.nome,
            email: formData.email,
            ativo: formData.ativo,
            empresa_id: userData?.empresa_id ?? null,
          },
        ])
      ))
    }
    if (error) {
      alert("Erro ao salvar responsável: " + error.message)
      return
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("responsaveisAtualizado"))
    }
    onSuccess?.()
    setFormData({ nome: "", email: "", ativo: true })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Nome do responsável"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Email do responsável"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="ativo"
          type="checkbox"
          checked={formData.ativo}
          onChange={(e) => handleInputChange("ativo", e.target.checked)}
        />
        <Label htmlFor="ativo">Responsável Ativo</Label>
      </div>
      <Button type="submit" className="w-full">
        {isEditing ? "Atualizar Responsável" : "Salvar Responsável"}
      </Button>
    </form>
  )
}
