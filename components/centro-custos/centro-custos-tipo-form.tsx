"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"

export function CentroCustosTipoForm({ onSuccess, initialData, isEditing = false }: {
  onSuccess?: () => void,
  initialData?: any,
  isEditing?: boolean
}) {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    nome: initialData?.nome ?? "",
    descricao: initialData?.descricao ?? "",
    ativo: typeof initialData?.ativo === "boolean" ? initialData.ativo : true,
  });

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function limparFormulario() {
    setFormData({
      nome: "",
      descricao: "",
      ativo: true,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    console.log("empresa_id para gravar:", userData?.empresa_id);

    e.preventDefault();
    let error;
    if (!formData.nome.trim()) {
      alert("O nome do tipo é obrigatório.");
      return;
    }
    if (!userData?.empresa_id) {
      alert("Não foi possível identificar a empresa logada. Faça login novamente.");
      return;
    }
    if (isEditing && initialData?.id) {
      ({ error } = await supabase.from("tipos_centro_custos").update({
        nome: formData.nome,
        descricao: formData.descricao,
        ativo: formData.ativo,
        empresa_id: userData?.empresa_id ?? null,
      }).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("tipos_centro_custos").insert([
        {
          nome: formData.nome,
          descricao: formData.descricao,
          ativo: formData.ativo,
          empresa_id: userData?.empresa_id ?? null,
        }
      ]));
    }
    if (error) {
      alert("Erro ao salvar tipo: " + error.message);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tiposCentroCustosAtualizado"));
    }
    onSuccess?.();
    limparFormulario();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Tipo</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Nome do tipo de centro de custo"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Descrição do tipo..."
          value={formData.descricao}
          onChange={(e) => handleInputChange("descricao", e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => handleInputChange("ativo", checked)}
        />
        <Label htmlFor="ativo">Tipo Ativo</Label>
      </div>
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? "Atualizar Tipo" : "Salvar Tipo"}
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  );
}
