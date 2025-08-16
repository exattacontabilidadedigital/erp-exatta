"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, Upload, ImageIcon, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
export function EmpresaForm() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const { empresaData, loading, userData } = useAuth()
  // Força recarregamento dos dados da empresa ao montar o componente
  useEffect(() => {
    if (userData?.empresa_id) {
      // Buscar dados atualizados da empresa
      supabase
        .from("empresas")
        .select("*")
        .eq("id", userData.empresa_id)
        .single()
        .then(({ data }) => {
          if (data) populateForm(data)
        })
    }
  }, [])
  const [formData, setFormData] = useState<any>({})

    // Função para upload da logo no Supabase Storage (bucket: logos)
    async function uploadLogoToStorage(file: File) {
      setIsLoading(true)
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `logos_${userData?.empresa_id}_${Date.now()}.${fileExt}`

        // Envia para o bucket "logos"
        const { data, error } = await supabase.storage.from("logos").upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        })
        if (error) throw error

        // Recupera URL pública do arquivo
        const { data: urlData } = supabase.storage.from("logos").getPublicUrl(fileName)

        if (urlData?.publicUrl) {
          setFormData((prev: any) => ({
            ...prev,
            logoPreview: urlData.publicUrl,
            logo_url: urlData.publicUrl,
          }))
          toast({
            title: "Logo enviada com sucesso!",
            description: "Clique em Salvar para gravar a imagem no cadastro da empresa.",
            variant: "default",
          })
        }
      } catch (err: any) {
        console.error('Erro ao enviar logo:', err)
        toast({
          title: "Erro ao enviar logo",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  // Função para popular os dados do formulário
  // Mapeamento entre valor do banco e valor do Select
  const naturezaMap: Record<string, string> = {
    ltda: "Sociedade Limitada",
    sa: "Sociedade Anônima",
    mei: "Microempreendedor Individual",
    eireli: "EIRELI",
  }
  const naturezaReverseMap: Record<string, string> = {
    "Sociedade Limitada": "ltda",
    "Sociedade Anônima": "sa",
    "Microempreendedor Individual": "mei",
    "EIRELI": "eireli",
  }
  const normalizeNatureza = (value: string | null | undefined) => {
    if (!value) return ""
    // Se vier do banco como 'ltda', retorna label
    if (naturezaMap[value]) return naturezaMap[value]
    // Se vier como label, retorna label
    if (Object.keys(naturezaReverseMap).includes(value)) return value
    return ""
  }
  const populateForm = (data: any) => {
    setFormData({
      logo: null,
      logoPreview: data.logo_url || null,
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || "",
      cnpj: data.cnpj || "",
      inscricaoEstadual: data.inscricao_estadual || "",
      inscricaoMunicipal: data.inscricao_municipal || "",
      cep: data.cep || "",
      endereco: data.endereco || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.cidade || "",
      estado: data.estado || "",
  telefone: data.telefone || "",
  celular: data.celular || "",
      email: data.email || "",
      site: data.site || "",
      logo_url: data.logo_url || "",
      banco: data.banco || "",
      agencia: data.agencia || "",
      conta: data.conta || "",
      pix: data.pix || "",
      regimeTributario: data.regime_tributario || "",
  naturezaJuridica: normalizeNatureza(data.natureza_juridica),
      observacoes: data.observacoes || "",
    })
  }

  useEffect(() => {
    // Popula o formulário apenas quando loading for false e empresaData disponível
    if (!loading && empresaData) {
      populateForm(empresaData)
    } else if (!loading && !empresaData) {
      setFormData({})
    }
  }, [empresaData, loading])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setFormData((prev: any) => ({
        ...prev,
        logo: file,
        logoPreview: e.target?.result as string,
      }))
    }
    reader.readAsDataURL(file)
  uploadLogoToStorage(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const removeLogo = () => {
    setFormData((prev: any) => ({
      ...prev,
      logo: null,
      logoPreview: null,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  setFormData((prev: any) => ({
    ...prev,
    logo_url: ""
  }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (!empresaData?.id) throw new Error("Empresa não encontrada")
      // Log do valor de logo_url antes de salvar
      console.log('Valor de logo_url antes de salvar:', formData.logo_url)
      // Monta objeto para atualização (removendo campos não persistentes)
      const updateData = {
        razao_social: formData.razaoSocial,
        nome_fantasia: formData.nomeFantasia,
        cnpj: formData.cnpj,
        inscricao_estadual: formData.inscricaoEstadual,
        inscricao_municipal: formData.inscricaoMunicipal,
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        telefone: formData.telefone,
        celular: formData.celular,
        email: formData.email,
        site: formData.site,
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta,
        pix: formData.pix,
        regime_tributario: formData.regimeTributario,
        natureza_juridica: naturezaReverseMap[formData.naturezaJuridica] || "",
        observacoes: formData.observacoes,
        logo_url: formData.logo_url,
      }
      const { data, error } = await supabase
        .from("empresas")
        .update(updateData)
        .eq("id", empresaData.id)
        .select()
      if (error) throw error
      if (data && data[0]) {
        populateForm(data[0])
      }
      toast({
        title: "Sucesso!",
        description: "Dados da empresa salvos com sucesso.",
      })
      window.alert("Dados da empresa salvos com sucesso.")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar os dados da empresa.",
        variant: "destructive",
      })
      window.alert(error.message || "Erro ao salvar os dados da empresa.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return <div>Carregando dados da empresa...</div>
  }
  if (!empresaData) {
    return <div>Nenhuma empresa encontrada para o usuário logado.</div>
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logo da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Preview da Logo */}
            <div className="flex-shrink-0">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {formData.logoPreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={formData.logoPreview || "/placeholder.svg"}
                      alt="Logo da empresa"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={removeLogo}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>

            {/* Área de Upload */}
            <div className="flex-1">
              <Label className="text-sm font-medium">Upload da Logo</Label>
              <div
                className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Clique para selecionar ou arraste uma imagem aqui</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Básicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                value={formData.razaoSocial}
                onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                placeholder="Razão social da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
              <Input
                id="nomeFantasia"
                value={formData.nomeFantasia}
                onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                placeholder="Nome fantasia"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleInputChange("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
              <Input
                id="inscricaoEstadual"
                value={formData.inscricaoEstadual}
                onChange={(e) => handleInputChange("inscricaoEstadual", e.target.value)}
                placeholder="000.000.000.000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
              <Input
                id="inscricaoMunicipal"
                value={formData.inscricaoMunicipal}
                onChange={(e) => handleInputChange("inscricaoMunicipal", e.target.value)}
                placeholder="00000000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
                placeholder="Rua, avenida, número"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => handleInputChange("complemento", e.target.value)}
                placeholder="Sala, andar"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleInputChange("bairro", e.target.value)}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select value={formData.estado} onValueChange={(value) => handleInputChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                  <SelectItem value="TO">TO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleInputChange("cep", e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contatos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                placeholder="(11) 3333-4444"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={formData.celular}
                onChange={(e) => handleInputChange("celular", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contato@empresa.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                value={formData.site}
                onChange={(e) => handleInputChange("site", e.target.value)}
                placeholder="www.empresa.com.br"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Bancários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Bancários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="banco">Banco</Label>
              <Select value={formData.banco} onValueChange={(value) => handleInputChange("banco", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">001 - Banco do Brasil</SelectItem>
                  <SelectItem value="104">104 - Caixa Econômica Federal</SelectItem>
                  <SelectItem value="237">237 - Bradesco</SelectItem>
                  <SelectItem value="341">341 - Itaú</SelectItem>
                  <SelectItem value="033">033 - Santander</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencia">Agência</Label>
              <Input
                id="agencia"
                value={formData.agencia}
                onChange={(e) => handleInputChange("agencia", e.target.value)}
                placeholder="0000-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conta">Conta</Label>
              <Input
                id="conta"
                value={formData.conta}
                onChange={(e) => handleInputChange("conta", e.target.value)}
                placeholder="00000-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Fiscais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações Fiscais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regimeTributario">Regime Tributário</Label>
              <Select
                value={formData.regimeTributario}
                onValueChange={(value) => handleInputChange("regimeTributario", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="naturezaJuridica">Natureza Jurídica</Label>
              <Select
                value={formData.naturezaJuridica}
                onValueChange={(value) => handleInputChange("naturezaJuridica", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a natureza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sociedade Limitada">Sociedade Limitada</SelectItem>
                  <SelectItem value="Sociedade Anônima">Sociedade Anônima</SelectItem>
                  <SelectItem value="Microempreendedor Individual">Microempreendedor Individual</SelectItem>
                  <SelectItem value="EIRELI">EIRELI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Informações Adicionais</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Informações adicionais sobre a empresa..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button type="button" variant="outline" disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Dados da Empresa
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
