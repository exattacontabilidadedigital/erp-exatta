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
import { useAuth } from "@/contexts/auth-context"

interface PlanoContasFormProps {
  onSuccess?: () => void
  initialData?: any
  contaPai?: string // aqui vamos passar o id da conta pai
  isEditing?: boolean
}

export function PlanoContasForm({
  onSuccess,
  initialData = null,
  contaPai = "",
  isEditing = false,
}: PlanoContasFormProps) {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tipo: "",
    contaPaiId: "", // agora trabalha com id
    natureza: "",
    descricao: "",
    ativa: true,
  })

  const [contasPai, setContasPai] = useState<any[]>([])
  const [contaPaiSelecionada, setContaPaiSelecionada] = useState<any>(null)

  // Função para transformar conta pai em sintética quando receber subcontas
  const transformarContaPaiEmSintetica = async (contaPaiId: string) => {
    try {
      // Busca a conta pai
      const { data: contaPai, error: fetchError } = await supabase
        .from("plano_contas")
        .select("id, codigo, nome, tipo")
        .eq("id", contaPaiId)
        .single()

      if (fetchError || !contaPai) return

      // Verifica se a conta pai é analítica (4+ segmentos)
      const segmentos = contaPai.codigo.split('.').length
      const isAnalitica = segmentos >= 4

      if (isAnalitica) {
        // Transforma em sintética adicionando sufixo
        const novoNome = `${contaPai.nome} (Sintética)`
        
        const { error: updateError } = await supabase
          .from("plano_contas")
          .update({ 
            nome: novoNome,
            // Adiciona flag para indicar que foi transformada
            descricao: `Conta transformada em sintética ao receber subcontas em ${new Date().toLocaleDateString()}`
          })
          .eq("id", contaPaiId)

        if (updateError) {
          console.error("Erro ao transformar conta pai:", updateError)
        } else {
          console.log(`Conta ${contaPai.codigo} transformada em sintética`)
        }
      }
    } catch (error) {
      console.error("Erro na transformação da conta pai:", error)
    }
  }

  // Função para sugerir próximo código de subconta
  const sugerirProximoCodigo = async (contaPaiId: string) => {
    if (!contaPaiId || !userData?.empresa_id) return

    const { data: contaPai, error } = await supabase
      .from("plano_contas")
      .select("codigo")
      .eq("id", contaPaiId)
      .single()

    if (error || !contaPai) return

    // Busca subcontas existentes
    const { data: subcontas, error: subError } = await supabase
      .from("plano_contas")
      .select("codigo")
      .eq("conta_pai_id", contaPaiId)
      .eq("empresa_id", userData.empresa_id)
      .order("codigo")

    if (subError) return

    // Calcula próximo número
    const prefixo = contaPai.codigo
    let proximoNumero = 1

    if (subcontas && subcontas.length > 0) {
      const ultimoCodigo = subcontas[subcontas.length - 1].codigo
      const ultimoNumero = parseInt(ultimoCodigo.split('.').pop() || '0')
      proximoNumero = ultimoNumero + 1
    }

    const proximoCodigo = `${prefixo}.${proximoNumero.toString().padStart(2, '0')}`
    setFormData(prev => ({ ...prev, codigo: proximoCodigo }))
  }

  // Carrega contas pai do banco
  useEffect(() => {
    const fetchContasPai = async () => {
      if (!userData?.empresa_id) return
      
      const { data, error } = await supabase
        .from("plano_contas")
        .select("id, codigo, nome")
        .eq("empresa_id", userData.empresa_id)
        .order("codigo", { ascending: true })

      if (!error && data) {
        setContasPai(data)
      }
    }
    fetchContasPai()
  }, [])

  useEffect(() => {
    if (initialData) {
      const contaPaiId = initialData.contaPaiId ?? initialData.conta_pai_id ?? "";
      console.log("[PlanoContasForm] contaPaiId recebido:", contaPaiId);
      console.log("[PlanoContasForm] contasPai disponíveis:", contasPai);
      setFormData({
        codigo: initialData.codigo ?? "",
        nome: initialData.nome ?? "",
        tipo: initialData.tipo ? String(initialData.tipo).toLowerCase() : "",
        contaPaiId,
        natureza: initialData.natureza ? String(initialData.natureza).toLowerCase() : "",

        descricao: initialData.descricao ?? "",
        ativa: initialData.ativo ?? true,
      })
    } else if (contaPai) {
      setFormData((prev) => ({ ...prev, contaPaiId: contaPai }))
      // Se for uma nova subconta, sugere o próximo código
      if (!isEditing) {
        sugerirProximoCodigo(contaPai)
      }
    }
  }, [initialData, contaPai, contasPai, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!formData.codigo.trim()) {
      alert("Código da conta é obrigatório!")
      return
    }

    if (!formData.nome.trim()) {
      alert("Nome da conta é obrigatório!")
      return
    }

    if (!formData.tipo) {
      alert("Tipo da conta é obrigatório!")
      return
    }

    // Validação extra para natureza
    const naturezaValida = formData.natureza === "debito" || formData.natureza === "credito"
    if (!naturezaValida) {
      alert("Natureza inválida! Selecione 'Devedora' ou 'Credora'.")
      return
    }

    // Validação de código único
    const { data: existingConta, error: checkError } = await supabase
      .from("plano_contas")
      .select("id")
      .eq("codigo", formData.codigo)
      .eq("empresa_id", userData?.empresa_id)
      .neq("id", initialData?.id || "")

    if (checkError) {
      alert("Erro ao verificar código: " + checkError.message)
      return
    }

    if (existingConta && existingConta.length > 0) {
      alert("Já existe uma conta com este código!")
      return
    }

    // Calcula o nível automaticamente baseado no código
    const nivelCalculado = formData.codigo.split('.').length

    const novaConta = {
      codigo: formData.codigo,
      nome: formData.nome,
      tipo: formData.tipo,
      conta_pai_id: formData.contaPaiId || null,
      natureza: formData.natureza,
      nivel: nivelCalculado,
      descricao: formData.descricao ?? null,
      ativo: formData.ativa,
      status: "ativo",
      empresa_id: userData?.empresa_id ?? null,
    }

    let error
    if (isEditing && initialData?.id) {
      ;({ error } = await supabase.from("plano_contas").update(novaConta).eq("id", initialData.id))
    } else {
      ;({ error } = await supabase.from("plano_contas").insert([novaConta]))
    }

    if (error) {
      alert("Erro ao salvar plano de contas: " + error.message)
      return
    }

    // Se criou uma subconta, verifica se precisa transformar a conta pai em sintética
    if (!isEditing && formData.contaPaiId) {
      await transformarContaPaiEmSintetica(formData.contaPaiId)
    }

    if (onSuccess) {
      onSuccess()
    }
    limparFormulario()
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Se mudou a conta pai e não está editando, sugere novo código
    if (field === "contaPaiId" && !isEditing && value) {
      sugerirProximoCodigo(value as string)
    }
  }

  const limparFormulario = () => {
    setFormData({
      codigo: "",
      nome: "",
      tipo: "",
      contaPaiId: contaPai || "", // Mantém conta pai se for subconta
      natureza: "",

      descricao: "",
      ativa: true,
    })
  }

  // Busca informações da conta pai para exibir
  const contaPaiInfo = contasPai.find(conta => conta.id === formData.contaPaiId)
  
  // Verifica se a conta pai é analítica (será transformada em sintética)
  const contaPaiIsAnalitica = contaPaiInfo && contaPaiInfo.codigo.split('.').length >= 4

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Indicador de Subconta */}
      {contaPaiInfo && (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                Criando subconta de: {contaPaiInfo.codigo} - {contaPaiInfo.nome}
              </span>
            </div>
          </div>
          
          {/* Aviso sobre transformação em sintética */}
          {contaPaiIsAnalitica && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5"></div>
                <div className="text-sm">
                  <p className="font-medium text-amber-800">
                    ⚠️ Transformação Automática
                  </p>
                  <p className="text-amber-700 mt-1">
                    A conta pai <strong>{contaPaiInfo.codigo}</strong> é analítica e será automaticamente 
                    transformada em <strong>sintética</strong> ao receber esta subconta. 
                    Ela não receberá mais lançamentos diretamente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Código da Conta */}
      <div className="space-y-2">
        <Label htmlFor="codigo">Código da Conta *</Label>
        <div className="flex gap-2">
          <Input
            id="codigo"
            placeholder="Ex: 1.1.01.001"
            value={formData.codigo}
            onChange={(e) => handleInputChange("codigo", e.target.value)}
            className="flex-1"
          />
          {formData.contaPaiId && !isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sugerirProximoCodigo(formData.contaPaiId)}
              className="whitespace-nowrap"
            >
              Auto
            </Button>
          )}
        </div>
        {formData.contaPaiId && (
          <p className="text-xs text-gray-500">
            Código será gerado automaticamente baseado na conta pai
          </p>
        )}
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
        <Select value={formData.tipo || undefined} onValueChange={(value: string) => handleInputChange("tipo", value)}>
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
        <Select
          value={formData.contaPaiId || undefined}
          onValueChange={(value: string) => handleInputChange("contaPaiId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a conta pai" />
          </SelectTrigger>
          <SelectContent>
            {contasPai.map((conta) => (
              <SelectItem key={conta.id} value={conta.id}>
                {conta.codigo} - {conta.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Natureza */}
      <div className="space-y-2">
        <Label htmlFor="natureza">Natureza *</Label>
        <Select
          value={formData.natureza || undefined}
          onValueChange={(value: string) => handleInputChange("natureza", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a natureza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debito">Devedora</SelectItem>
            <SelectItem value="credito">Credora</SelectItem>
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
          onCheckedChange={(checked: boolean) => handleInputChange("ativa", checked)}
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
