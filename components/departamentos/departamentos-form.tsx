"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"

interface DepartamentosFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function DepartamentosForm({ onSuccess, initialData, isEditing = false }: DepartamentosFormProps) {
  const { userData } = useAuth()
  const [formData, setFormData] = useState({
    nome: "",
    ativo: true,
  })
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        nome: initialData.nome ?? "",
        ativo: typeof initialData.ativo === "boolean" ? initialData.ativo : true,
      })
    }
  }, [isEditing, initialData])

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function limparFormulario() {
    setFormData({ nome: "", ativo: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nome || formData.nome.trim() === "") {
      alert("O nome do departamento é obrigatório.");
      return;
    }
    let error;
    if (isEditing && initialData?.id) {
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("departamentos").update({
          nome: formData.nome,
          ativo: formData.ativo,
          empresa_id: userData?.empresa_id ?? null,
        }).eq("id", initialData.id)
      ));
      if (!error && typeof window !== "undefined") {
        window.dispatchEvent(new Event("departamentosAtualizado"));
      }
    } else {
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("departamentos").insert([
          {
            nome: formData.nome,
            ativo: formData.ativo,
            empresa_id: userData?.empresa_id ?? null,
          },
        ])
      ));
      if (!error && typeof window !== "undefined") {
        window.dispatchEvent(new Event("departamentosAtualizado"));
      }
    }
    if (error) {
      alert("Erro ao salvar departamento: " + error.message)
      return
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("departamentosAtualizado"))
    }
    onSuccess?.()
    setFormData({ nome: "", ativo: true })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Nome do departamento"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ativo">
          <input
            id="ativo"
            type="checkbox"
            checked={formData.ativo}
            onChange={(e) => handleInputChange("ativo", e.target.checked)}
            className="mr-2"
          />
          Departamento Ativo
        </Label>
      </div>
      <Button type="submit" className="w-full">
        {isEditing ? "Salvar Edição" : "Salvar Departamento"}
      </Button>
    </form>
  );
}
