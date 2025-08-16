"use client"

import type React from "react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"

interface CentroCustosFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function CentroCustosForm({ onSuccess, initialData, isEditing = false }: CentroCustosFormProps) {
    const { userData } = require("@/contexts/auth-context").useAuth();
  // Busca tipos cadastrados na tabela tipos_centro_custos
  const [tipoOptions, setTipoOptions] = useState<any[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<any[]>([]);
  const [departamentoOptions, setDepartamentoOptions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      if (!userData?.empresa_id) return;
      const { data: tipos } = await supabase.from("tipos_centro_custos").select("id, nome").eq("empresa_id", userData.empresa_id).eq("ativo", true);
      setTipoOptions(tipos || []);
      const { data: responsaveis } = await supabase.from("responsaveis").select("id, nome").eq("empresa_id", userData.empresa_id).eq("ativo", true);
      setResponsavelOptions(responsaveis || []);
      const { data: departamentos } = await supabase.from("departamentos").select("id, nome").eq("empresa_id", userData.empresa_id).eq("ativo", true);
      setDepartamentoOptions(departamentos || []);
    }
    fetchOptions();
  }, [userData?.empresa_id]);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tipo: "",
    responsavel: "",
    departamento: "",
    orcamentoMensal: "",
    descricao: "",
    ativo: true,
  });
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        codigo: initialData.codigo ?? "",
        nome: initialData.nome ?? "",
        tipo: initialData.tipo ?? "",
        responsavel: initialData.responsavel ?? (responsavelOptions[0]?.id ?? ""),
        departamento: initialData.departamento ?? (departamentoOptions[0]?.id ?? ""),
        orcamentoMensal: initialData.orcamentoMensal ?? "",
        descricao: initialData.descricao ?? "",
        ativo: typeof initialData.ativo === "boolean" ? initialData.ativo : true,
      });
    }
  }, [isEditing, initialData, responsavelOptions, departamentoOptions]);

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function limparFormulario() {
    setFormData({
      codigo: "",
      nome: "",
      tipo: "",
      responsavel: "",
      departamento: "",
      orcamentoMensal: "",
      descricao: "",
      ativo: true,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let error;
    // Validação: não permitir tipo vazio
    if (!formData.tipo || formData.tipo.trim() === "") {
      alert("Selecione o tipo de centro de custo.");
      return;
    }
    // Garante que orcamento_mensal seja número ou null
    const orcamentoValue = formData.orcamentoMensal === "" ? null : Number(formData.orcamentoMensal);
    if (isEditing && initialData?.id) {
      // Atualiza centro de custos existente
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("centro_custos").update({
          codigo: formData.codigo,
          nome: formData.nome,
          tipo: formData.tipo,
          responsavel: formData.responsavel,
          departamento: formData.departamento,
          orcamento_mensal: orcamentoValue,
          descricao: formData.descricao,
          ativo: formData.ativo,
          empresa_id: userData?.empresa_id ?? null,
        }).eq("id", initialData.id)
      ));
      if (!error) {
        toast.success("Centro de custo editado com sucesso!");
      }
    } else {
      // Insere novo centro de custos
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("centro_custos").insert([
          {
            codigo: formData.codigo,
            nome: formData.nome,
            tipo: formData.tipo,
            responsavel: formData.responsavel,
            departamento: formData.departamento,
            orcamento_mensal: orcamentoValue,
            descricao: formData.descricao,
            ativo: formData.ativo,
            empresa_id: userData?.empresa_id ?? null,
          }
        ])
      ));
    }
    if (error) {
      alert("Erro ao salvar centro de custos: " + error.message);
      return;
    }
    toast.success("Centro de custo salvo com sucesso!");
    // Dispara evento para atualizar a listagem e cards
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("centroCustosAtualizado"));
      // Aguarda um pequeno delay para garantir que o banco atualizou
      setTimeout(() => {
        window.dispatchEvent(new Event("centroCustosAtualizado"));
      }, 300);
    }
    onSuccess?.();
    limparFormulario();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="codigo">Código</Label>
        <Input
          id="codigo"
          type="text"
          placeholder="Código do centro de custos"
          value={formData.codigo}
          onChange={(e) => handleInputChange("codigo", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Nome do centro de custos"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="departamento">Departamento</Label>
        <Select
          value={formData.departamento}
          onValueChange={(value) => handleInputChange("departamento", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o departamento" />
          </SelectTrigger>
          <SelectContent>
            {departamentoOptions.map((dep: any) => (
              <SelectItem key={dep.id} value={dep.nome}>{dep.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="responsavel">Responsável</Label>
        <Select
          value={formData.responsavel}
          onValueChange={(value) => handleInputChange("responsavel", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o responsável" />
          </SelectTrigger>
          <SelectContent>
            {responsavelOptions.map((resp: any) => (
              <SelectItem key={resp.id} value={resp.nome}>{resp.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo</Label>
        <Select
          value={formData.tipo}
          onValueChange={(value) => handleInputChange("tipo", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipoOptions.map((tipo: any) => (
              <SelectItem key={tipo.id} value={tipo.nome}>{tipo.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="orcamentoMensal">Orçamento Mensal</Label>
        <Input
          id="orcamentoMensal"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={formData.orcamentoMensal}
          onChange={(e) => handleInputChange("orcamentoMensal", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Descrição do centro de custos..."
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
        <Label htmlFor="ativo">Centro Ativo</Label>
      </div>
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? "Atualizar Centro" : "Salvar Centro"}
        </Button>
        <Button type="button" variant="outline" onClick={limparFormulario}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </form>
  );
}
