"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface ClientesFornecedoresFormProps {
  onSuccess?: () => void
  initialData?: any
  isEditing?: boolean
}

export function ClientesFornecedoresForm({ onSuccess, initialData, isEditing }: ClientesFornecedoresFormProps) {
  const { userData } = useAuth()
  const [formData, setFormData] = useState({
    tipo: "",
    nome: "",
    razaoSocial: "",
    documento: "",
    tipoDocumento: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
    ativo: true,
  })
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (initialData && isEditing) {
      console.log("Dados recebidos para edição:", initialData) // Debug
      setFormData({
        tipo: initialData.tipo || "",
        nome: initialData.nome || "",
        razaoSocial: initialData.razao_social || "",
        documento: initialData.cpf_cnpj || "",
        tipoDocumento: initialData.tipo_pessoa === "juridica" ? "cnpj" : "cpf",
        email: initialData.email || "",
        telefone: initialData.telefone || "",
        endereco: initialData.endereco || "",
        cidade: initialData.cidade || "",
        estado: initialData.estado || "",
        cep: initialData.cep || "",
        observacoes: initialData.observacoes || "",
        ativo: initialData.ativo !== undefined ? initialData.ativo : true,
      })
    }
  }, [initialData, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validações básicas
    if (!formData.tipo) {
      alert("Tipo é obrigatório!")
      setLoading(false)
      return
    }

    if (!formData.nome.trim()) {
      alert("Nome é obrigatório!")
      setLoading(false)
      return
    }

    if (!formData.tipoDocumento) {
      alert("Tipo de documento é obrigatório!")
      setLoading(false)
      return
    }

    if (!formData.documento.trim()) {
      alert("Documento é obrigatório!")
      setLoading(false)
      return
    }

    // Validação de email se fornecido
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Email inválido!")
      setLoading(false)
      return
    }

    // Verificar se já existe um cliente/fornecedor com o mesmo documento
    const { data: existingCliente, error: checkError } = await supabase
      .from("clientes_fornecedores")
      .select("id")
      .eq("cpf_cnpj", formData.documento.trim())
      .eq("empresa_id", userData?.empresa_id)
      .neq("id", initialData?.id || "")

    if (checkError) {
      alert("Erro ao verificar documento: " + checkError.message)
      setLoading(false)
      return
    }

    if (existingCliente && existingCliente.length > 0) {
      alert("Já existe um cliente/fornecedor com este documento!")
      setLoading(false)
      return
    }

    try {
      // Monta objeto para tabela
      const tipoPessoa = formData.tipoDocumento === "cnpj" ? "juridica" : "fisica"
      let tipo = formData.tipo
      if (!["cliente", "fornecedor", "ambos"].includes(tipo)) {
        tipo = "cliente"
      }

      const clienteFornecedor = {
        tipo,
        tipo_pessoa: tipoPessoa,
        nome: formData.nome.trim(),
        razao_social: formData.razaoSocial.trim() || null,
        cpf_cnpj: formData.documento.trim(),
        rg_ie: "",
        cep: formData.cep.trim() || null,
        endereco: formData.endereco.trim() || null,
        numero: "",
        complemento: "",
        bairro: "",
        cidade: formData.cidade.trim() || null,
        estado: formData.estado || null,
        telefone: formData.telefone.trim() || null,
        celular: "",
        email: formData.email.trim() || null,
        site: "",
        contato: "",
        observacoes: formData.observacoes.trim() || null,
        ativo: formData.ativo,
        empresa_id: userData?.empresa_id,
      }

      let error
      if (isEditing && initialData?.id) {
        const { error: updateError } = await supabase
          .from("clientes_fornecedores")
          .update(clienteFornecedor)
          .eq("id", initialData.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from("clientes_fornecedores")
          .insert([clienteFornecedor])
        error = insertError
      }

      if (error) {
        alert("Erro ao salvar cliente/fornecedor: " + error.message)
        setLoading(false)
        return
      }

      alert(isEditing ? "Cliente/Fornecedor atualizado com sucesso!" : "Cliente/Fornecedor criado com sucesso!")
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
      tipo: "",
      nome: "",
      razaoSocial: "",
      documento: "",
      tipoDocumento: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      observacoes: "",
      ativo: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo *</Label>
        <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="fornecedor">Fornecedor</SelectItem>
            <SelectItem value="ambos">Cliente e Fornecedor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome">Nome/Nome Fantasia *</Label>
        <Input
          id="nome"
          placeholder="Nome do cliente/fornecedor"
          value={formData.nome}
          onChange={(e) => handleInputChange("nome", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="razaoSocial">Razão Social</Label>
        <Input
          id="razaoSocial"
          placeholder="Razão social da empresa"
          value={formData.razaoSocial}
          onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="tipoDocumento">Tipo Documento *</Label>
          <Select value={formData.tipoDocumento} onValueChange={(value) => handleInputChange("tipoDocumento", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="documento">Documento *</Label>
          <Input
            id="documento"
            placeholder="000.000.000-00"
            value={formData.documento}
            onChange={(e) => handleInputChange("documento", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@exemplo.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          placeholder="(11) 99999-9999"
          value={formData.telefone}
          onChange={(e) => handleInputChange("telefone", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          placeholder="Rua, número, complemento"
          value={formData.endereco}
          onChange={(e) => handleInputChange("endereco", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            placeholder="Cidade"
            value={formData.cidade}
            onChange={(e) => handleInputChange("cidade", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Select value={formData.estado} onValueChange={(value) => handleInputChange("estado", value)}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SP">SP</SelectItem>
              <SelectItem value="RJ">RJ</SelectItem>
              <SelectItem value="MG">MG</SelectItem>
              <SelectItem value="RS">RS</SelectItem>
              <SelectItem value="PR">PR</SelectItem>
              <SelectItem value="SC">SC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cep">CEP</Label>
        <Input
          id="cep"
          placeholder="00000-000"
          value={formData.cep}
          onChange={(e) => handleInputChange("cep", e.target.value)}
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
        <Label htmlFor="ativo">Ativo</Label>
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
