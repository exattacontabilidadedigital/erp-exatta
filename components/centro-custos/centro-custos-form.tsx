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
  centroPai?: any
}

export function CentroCustosForm({ onSuccess, initialData, isEditing = false, centroPai }: CentroCustosFormProps) {
    const { userData } = require("@/contexts/auth-context").useAuth();
  // Busca tipos cadastrados na tabela tipos_centro_custos
  const [tipoOptions, setTipoOptions] = useState<any[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<any[]>([]);
  const [departamentoOptions, setDepartamentoOptions] = useState<any[]>([]);
  const [centroPaiOptions, setCentroPaiOptions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      if (!userData?.empresa_id) return;
      const { data: tipos } = await supabase.from("tipos_centro_custos").select("id, nome").eq("empresa_id", userData.empresa_id).eq("ativo", true);
      setTipoOptions(tipos || []);
      const { data: responsaveis } = await supabase.from("responsaveis").select("id, nome").eq("empresa_id", userData.empresa_id).eq("ativo", true);
      setResponsavelOptions(responsaveis || []);
      const { data: departamentos } = await supabase.from("departamentos").select("id, nome").eq("empresa_id", userData.empresa_id).eq("ativo", true);
      setDepartamentoOptions(departamentos || []);
      
      // Busca centros de custo para usar como pai (excluindo o próprio se estiver editando)
      let query = supabase
        .from("centro_custos")
        .select("id, codigo, nome, nivel")
        .eq("empresa_id", userData.empresa_id)
        .eq("ativo", true)
        .order("codigo");
      
      if (isEditing && initialData?.id) {
        query = query.neq("id", initialData.id);
      }
      
      const { data: centrosPai } = await query;
      setCentroPaiOptions(centrosPai || []);
    }
    fetchOptions();
  }, [userData?.empresa_id, isEditing, initialData?.id]);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tipo: "",
    nivel: 1,
    centroPai: "__none__",
    responsavel: "",
    departamento: "",
    orcamentoMensal: "",
    descricao: "",
    ativo: true,
    aceitaLancamentos: true,
  });
  useEffect(() => {
    if (isEditing && initialData) {
      // Determina o centro pai baseado no código e nível
      let centroPaiId = "__none__";
      
      if (initialData.nivel > 1 && initialData.codigo) {
        // Se tem nível > 1, tenta encontrar o centro pai baseado no código
        // Exemplo: se código é "CC001.001", o pai seria "CC001"
        const codigoParts = initialData.codigo.split('.');
        if (codigoParts.length > 1) {
          const codigoPai = codigoParts.slice(0, -1).join('.');
          // Procura o centro pai nas opções carregadas
          const centroPai = centroPaiOptions.find(c => c.codigo === codigoPai);
          if (centroPai) {
            centroPaiId = centroPai.id;
          }
        }
      }
      
      setFormData({
        codigo: initialData.codigo ?? "",
        nome: initialData.nome ?? "",
        tipo: initialData.tipo ?? "",
        nivel: initialData.nivel ?? 1,
        centroPai: centroPaiId,
        responsavel: initialData.responsavel ?? "",
        departamento: initialData.departamento ?? "",
        orcamentoMensal: initialData.orcamento_mensal ?? "",
        descricao: initialData.descricao ?? "",
        ativo: typeof initialData.ativo === "boolean" ? initialData.ativo : true,
        aceitaLancamentos: typeof initialData.aceita_lancamentos === "boolean" ? initialData.aceita_lancamentos : true,
      });
    } else if (centroPai) {
      // Se é um subcentro, define o centro pai e o nível
      setFormData({
        codigo: "",
        nome: "",
        tipo: "",
        nivel: centroPai.nivel + 1,
        centroPai: centroPai.id,
        responsavel: "",
        departamento: "",
        orcamentoMensal: "",
        descricao: "",
        ativo: true,
        aceitaLancamentos: true, // Subcentros por padrão aceitam lançamentos
      });
    }
  }, [isEditing, initialData, centroPai, centroPaiOptions]);

  // useEffect adicional para carregar dados iniciais quando as opções estiverem disponíveis
  useEffect(() => {
    if (isEditing && initialData && tipoOptions.length > 0 && responsavelOptions.length > 0 && departamentoOptions.length > 0) {
      // Verificar se os valores existem nas opções disponíveis
      const tipoExiste = tipoOptions.some(tipo => tipo.nome === initialData.tipo);
      const responsavelExiste = responsavelOptions.some(resp => resp.nome === initialData.responsavel);
      const departamentoExiste = departamentoOptions.some(dep => dep.nome === initialData.departamento);
      
      const newFormData = {
        codigo: initialData.codigo ?? "",
        nome: initialData.nome ?? "",
        tipo: tipoExiste ? initialData.tipo : "",
        nivel: initialData.nivel ?? 1,
        centroPai: initialData.centro_pai_id ?? "__none__",
        responsavel: responsavelExiste ? initialData.responsavel : "",
        departamento: departamentoExiste ? initialData.departamento : "",
        orcamentoMensal: initialData.orcamento_mensal ?? "",
        descricao: initialData.descricao ?? "",
        ativo: typeof initialData.ativo === "boolean" ? initialData.ativo : true,
        aceitaLancamentos: typeof initialData.aceita_lancamentos === "boolean" ? initialData.aceita_lancamentos : true,
      };
      setFormData(newFormData);
    }
  }, [isEditing, initialData, tipoOptions, responsavelOptions, departamentoOptions]);

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Se o campo alterado é aceitaLancamentos e foi desmarcado, limpa o orçamento
      if (field === 'aceitaLancamentos' && !value) {
        newData.orcamentoMensal = "";
      }
      
      return newData;
    });
  }

  function limparFormulario() {
    setFormData({
      codigo: "",
      nome: "",
      tipo: "",
      nivel: 1,
      centroPai: "__none__",
      responsavel: "",
      departamento: "",
      orcamentoMensal: "",
      descricao: "",
      ativo: true,
      aceitaLancamentos: true,
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
    
    // Se não aceita lançamentos, orçamento deve ser zero/null
    const orcamentoFinal = formData.aceitaLancamentos ? orcamentoValue : null;
    
    // Define o nível baseado no centro pai selecionado
    let nivel = 1;
    
    if (formData.centroPai && formData.centroPai !== "__none__") {
      const centroPai = centroPaiOptions.find(c => c.id === formData.centroPai);
      if (centroPai) {
        nivel = (centroPai.nivel || 1) + 1;
      }
    }

    if (isEditing && initialData?.id) {
      // Atualiza centro de custos existente
      const updateData: any = {
        codigo: formData.codigo,
        nome: formData.nome,
        tipo: formData.tipo,
        nivel: nivel,
        // centro_pai_id removido - campo não existe na tabela
        responsavel: formData.responsavel,
        departamento: formData.departamento,
        orcamento_mensal: orcamentoFinal,
        descricao: formData.descricao,
        ativo: formData.ativo,
        empresa_id: userData?.empresa_id ?? null,
      };
      
      // Só inclui aceita_lancamentos se o campo foi definido (para evitar erro se campo não existe)
      if (typeof formData.aceitaLancamentos !== 'undefined') {
        updateData.aceita_lancamentos = formData.aceitaLancamentos;
      }
      
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("centro_custos").update(updateData).eq("id", initialData.id)
      ));
      if (!error) {
        toast.success("Centro de custo editado com sucesso!");
      }
    } else {
      // Insere novo centro de custos
      const insertData: any = {
        codigo: formData.codigo,
        nome: formData.nome,
        tipo: formData.tipo,
        nivel: nivel,
        // centro_pai_id removido - campo não existe na tabela
        responsavel: formData.responsavel,
        departamento: formData.departamento,
        orcamento_mensal: orcamentoFinal,
        descricao: formData.descricao,
        ativo: formData.ativo,
        empresa_id: userData?.empresa_id ?? null,
      };
      
      // Só inclui aceita_lancamentos se o campo foi definido (para evitar erro se campo não existe)
      if (typeof formData.aceitaLancamentos !== 'undefined') {
        insertData.aceita_lancamentos = formData.aceitaLancamentos;
      }
      
      ({ error } = await import("@/lib/supabase/client").then(({ supabase }) =>
        supabase.from("centro_custos").insert([insertData])
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
          key={`departamento-${formData.departamento}-${departamentoOptions.length}`}
          value={formData.departamento || undefined}
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
          key={`responsavel-${formData.responsavel}-${responsavelOptions.length}`}
          value={formData.responsavel || undefined}
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
          key={`tipo-${formData.tipo}-${tipoOptions.length}`}
          value={formData.tipo || undefined}
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
        <Label htmlFor="centroPai">Centro de Custo Pai (Opcional)</Label>
        <Select
          value={formData.centroPai}
          onValueChange={(value) => handleInputChange("centroPai", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o centro pai (deixe em branco para nível 1)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Nenhum (Nível 1)</SelectItem>
            {centroPaiOptions.map((centro: any) => (
              <SelectItem key={centro.id} value={centro.id}>
                {"  ".repeat(centro.nivel - 1)}{centro.codigo} - {centro.nome}
              </SelectItem>
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
          disabled={!formData.aceitaLancamentos}
          className={!formData.aceitaLancamentos ? 'bg-gray-100 text-gray-500' : ''}
        />
        {!formData.aceitaLancamentos && (
          <p className="text-sm text-amber-600">
            Centros que não aceitam lançamentos não precisam de orçamento
          </p>
        )}
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
      <div className="flex items-center space-x-2">
        <Switch
          id="aceitaLancamentos"
          checked={formData.aceitaLancamentos}
          onCheckedChange={(checked) => handleInputChange("aceitaLancamentos", checked)}
        />
        <Label htmlFor="aceitaLancamentos">Aceita Lançamentos</Label>
        <span className="text-sm text-gray-500 ml-2">
          (Define se este centro pode receber lançamentos contábeis diretos)
        </span>
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
