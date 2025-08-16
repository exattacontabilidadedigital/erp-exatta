"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TiposCentroCustosFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function TiposCentroCustosForm({ onSuccess, initialData, isEditing = false }: TiposCentroCustosFormProps) {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        nome: initialData.nome ?? "",
        descricao: initialData.descricao ?? "",
        ativo: typeof initialData.ativo === "boolean" ? initialData.ativo : true,
      });
    }
  }, [isEditing, initialData]);

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let error;
    if (isEditing && initialData?.id) {
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("tipos_centro_custos").update({
          nome: formData.nome,
          descricao: formData.descricao,
          ativo: formData.ativo,
          empresa_id: userData?.empresa_id ?? null,
        }).eq("id", initialData.id)
      ));
    } else {
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("tipos_centro_custos").insert([
          {
            nome: formData.nome,
            descricao: formData.descricao,
            ativo: formData.ativo,
            empresa_id: userData?.empresa_id ?? null,
          },
        ])
      ));
    }
    if (error) {
      alert("Erro ao salvar tipo: " + error.message);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tiposCentroCustosAtualizado"));
    }
    onSuccess?.();
    setFormData({ nome: "", descricao: "", ativo: true });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Nome do tipo"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          type="text"
          placeholder="Descrição do tipo"
          value={formData.descricao}
          onChange={(e) => handleInputChange("descricao", e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="ativo"
          type="checkbox"
          checked={formData.ativo}
          onChange={(e) => handleInputChange("ativo", e.target.checked)}
        />
        <Label htmlFor="ativo">Tipo Ativo</Label>
      </div>
      <Button type="submit" className="w-full">
        {isEditing ? "Atualizar Tipo" : "Salvar Tipo"}
      </Button>
    </form>
  );
}
