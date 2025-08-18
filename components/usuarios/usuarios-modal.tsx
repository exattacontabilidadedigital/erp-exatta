"use client"
import React, { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, User, Shield, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

interface UsuariosModalProps {
  isOpen: boolean
  onClose: () => void
  usuario?: any
  isEditing: boolean
}

export function UsuariosModal({ isOpen, onClose, usuario, isEditing }: UsuariosModalProps) {
  // Removido controle de exibição do Card de Permissões
  // Removido controle de exibição do Card de Permissões
  const [funcoes, setFuncoes] = useState<{ id: string, nome: string }[]>([])
  useEffect(() => {
    async function fetchFuncoes() {
      const { data, error } = await supabase.from("funcoes").select("id, nome")
      if (!error && data) setFuncoes(data)
    }
    fetchFuncoes()
  }, [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [senhaErro, setSenhaErro] = useState(false)
  const { empresaData } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    role: "",
    funcao_id: "",
    status: "ativo",
    permissoes: [] as string[],
    foto_url: "",
  })

  const permissoesDisponiveis = [
    { id: "dashboard", label: "Dashboard", descricao: "Visualizar painel principal" },
    { id: "lancamentos", label: "Lançamentos", descricao: "Criar, editar e visualizar lançamentos" },
    { id: "contas", label: "Contas Bancárias", descricao: "Gerenciar contas bancárias" },
    { id: "plano-contas", label: "Plano de Contas", descricao: "Gerenciar plano de contas" },
    { id: "centro-custos", label: "Centro de Custos", descricao: "Gerenciar centros de custos" },
    { id: "fluxo-caixa", label: "Fluxo de Caixa", descricao: "Visualizar fluxo de caixa" },
    { id: "relatorios", label: "Relatórios", descricao: "Gerar e visualizar relatórios" },
    { id: "cadastros", label: "Cadastros", descricao: "Gerenciar cadastros auxiliares" },
    { id: "usuarios", label: "Usuários", descricao: "Gerenciar usuários do sistema" },
    { id: "configuracoes", label: "Configurações", descricao: "Acessar configurações do sistema" },
  ]

  const rolesPermissoes = {
    admin: permissoesDisponiveis.map((p) => p.id),
    contador: [
      "dashboard",
      "lancamentos",
      "contas",
      "plano-contas",
      "centro-custos",
      "fluxo-caixa",
      "relatorios",
      "cadastros",
    ],
    usuario: ["dashboard", "lancamentos", "relatorios"],
    auditor: ["dashboard", "relatorios", "contas", "plano-contas", "fluxo-caixa"],
  }

  useEffect(() => {
    if (isEditing && usuario) {
      setFormData({
        nome: usuario.nome || "",
        email: usuario.email || "",
        senha: "",
        confirmarSenha: "",
        role: usuario.role || "",
        funcao_id: usuario.funcao_id || "",
        status: usuario.status || "ativo",
        permissoes: usuario.permissoes || [],
        foto_url: usuario.foto_url || "",
      })
      setFotoPreview(usuario.foto_url || null)
    } else {
      setFormData({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
        role: "",
        funcao_id: "",
        status: "ativo",
        permissoes: [],
        foto_url: "",
      })
      setFotoPreview(null)
      setFotoFile(null)
    }
  }, [isEditing, usuario, isOpen])

  // Atualiza permissoes conforme função selecionada ao editar
  useEffect(() => {
    if (isEditing && formData.role) {
      const funcao = funcoes.find((f) => f.nome === formData.role)
      if (funcao) {
        supabase.from("funcoes").select("permissoes").eq("id", funcao.id).single().then(({ data }) => {
          if (data && data.permissoes) {
            setFormData((prev) => ({ ...prev, permissoes: data.permissoes, funcao_id: funcao.id }))
          }
        })
      }
    }
  }, [formData.role, isEditing])

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleChange = (role: string) => {
  // Grava o nome da função exatamente como está na tabela funcoes
  setFormData((prev) => ({ ...prev, role }))
    const funcao = funcoes.find((f) => f.nome === role)
    if (funcao) {
      supabase.from("funcoes").select("permissoes").eq("id", funcao.id).single().then(({ data }) => {
        if (data && data.permissoes) {
          setFormData((prev) => ({ ...prev, permissoes: data.permissoes, funcao_id: funcao.id }))
        }
      })
    }
  }

  const handlePermissaoChange = (permissaoId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissoes: checked
        ? [...(Array.isArray(prev.permissoes) ? prev.permissoes : []), permissaoId]
        : (Array.isArray(prev.permissoes) ? prev.permissoes : []).filter((p) => p !== permissaoId),
    }))
  }

  async function handleFotoUpload(file: File) {
    setIsLoading(true)
    try {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Erro", description: "Selecione apenas arquivos de imagem.", variant: "destructive" })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" })
        return
      }
      const fileExt = file.name.split('.').pop()
      const fileName = `usuarios_${empresaData?.id || 'noemp'}_${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from("logos").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })
      if (error) throw error
      
      // Recupera URL pública do arquivo
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(fileName)
      if (urlData?.publicUrl) {
        setFotoPreview(urlData.publicUrl)
        setFotoFile(file)
        setFormData((prev) => ({ ...prev, foto_url: urlData.publicUrl }))
        toast({ title: "Foto enviada com sucesso!", description: "Clique em Salvar para gravar a imagem no cadastro do usuário.", variant: "default" })
      } else {
        toast({ title: "Erro", description: "Não foi possível obter o link público da imagem.", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFotoUpload(file)
  }

  const handleFotoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFotoUpload(e.dataTransfer.files[0])
    }
  }

  const removeFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
    setFormData((prev) => ({ ...prev, foto_url: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
      if (!formData.funcao_id) {
        toast({
          title: "Função obrigatória",
          description: "Selecione uma função para o usuário.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!formData.permissoes || formData.permissoes.length === 0) {
        toast({
          title: "Permissões obrigatórias",
          description: "Selecione ao menos uma permissão para o usuário.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    e.preventDefault()
    setIsLoading(true)
    try {
      if (!isEditing && formData.senha !== formData.confirmarSenha) {
        setSenhaErro(true)
        toast({
          title: "Erro",
          description: "As senhas não coincidem.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      } else {
        setSenhaErro(false)
      }
      
      if (!empresaData?.id) {
        toast({
          title: "Erro",
          description: "Empresa não encontrada no contexto.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Verificar se o e-mail já existe para esta empresa
      const { data: existing, error: emailError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", formData.email)
        .eq("empresa_id", empresaData.id)
        
      if (emailError) {
        toast({
          title: "Erro",
          description: "Erro ao verificar e-mail: " + (emailError.message || ""),
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      if (!isEditing && existing && existing.length > 0) {
        toast({
          title: "Erro",
          description: "Já existe um usuário com este e-mail nesta empresa.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 18)
      const fotoUrl = formData.foto_url || ""
      
      if (isEditing && usuario?.id) {
        // Update usuário existente
        // Converte permissoes array para objeto
        const permissoesObj = Array.isArray(formData.permissoes)
          ? Object.fromEntries(formData.permissoes.map(p => [p, true]))
          : formData.permissoes
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({
            nome: formData.nome,
            email: formData.email,
            role: formData.role,
            ativo: formData.status === "ativo",
            permissoes: permissoesObj,
            funcao_id: formData.funcao_id,
            empresa_id: empresaData.id,
            foto_url: fotoUrl,
          })
          .eq("id", usuario.id)

        if (updateError) {
          let msg = updateError.message || "Erro ao atualizar dados do usuário."
          toast({
            title: "Erro",
            description: msg,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // fetch para notificar API sobre edição
        await fetch("/api/usuarios", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: usuario.id,
            nome: formData.nome,
            email: formData.email,
            role: formData.role,
            ativo: formData.status === "ativo",
              permissoes: JSON.stringify(formData.permissoes),
            empresa_id: empresaData.id,
            foto_url: fotoUrl,
          }),
        })

        toast({
          title: "Sucesso!",
          description: `Usuário atualizado com sucesso.\nLink da imagem: ${fotoUrl || "Nenhum"}`,
          variant: "default",
        })
        onClose()
        setIsLoading(false)
        return
      } else {
        // Cadastro novo usuário
        // Converte permissoes array para objeto
        const permissoesObj = Array.isArray(formData.permissoes)
          ? Object.fromEntries(formData.permissoes.map(p => [p, true]))
          : formData.permissoes
        const { error: insertError } = await supabase
          .from("usuarios")
          .insert({
            id: uuid,
            nome: formData.nome,
            email: formData.email,
            role: formData.role,
            ativo: formData.status === "ativo",
            permissoes: permissoesObj,
            funcao_id: formData.funcao_id,
            empresa_id: empresaData.id,
            foto_url: fotoUrl,
          })

        if (insertError) {
          let msg = insertError.message || "Erro ao salvar dados do usuário."
          if (msg.includes("duplicate key")) {
            msg = "Já existe um usuário com este e-mail ou id."
          }
          toast({
            title: "Erro",
            description: msg,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // fetch para notificar API sobre novo cadastro
        await fetch("/api/usuarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          },
          body: JSON.stringify({
            id: uuid,
            nome: formData.nome,
            email: formData.email,
            role: formData.role,
            ativo: formData.status === "ativo",
            permissoes: formData.permissoes,
            funcao_id: formData.funcao_id,
            empresa_id: empresaData.id,
            foto_url: fotoUrl,
          }),
        })

        toast({
          title: "Sucesso!",
          description: `Usuário criado com sucesso.\nLink da imagem: ${fotoUrl || "Nenhum"}`,
          variant: "default",
        })
        onClose()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar usuário.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="usuario-modal-desc">
        <div id="usuario-modal-desc" className="sr-only">
          Preencha todos os campos obrigatórios para cadastrar ou editar um usuário. Selecione a função para carregar as permissões automaticamente.
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Digite o e-mail"
                    required
                  />
                </div>
              </div>
              
              {/* Foto do Usuário */}
              <div className="space-y-2">
                <Label>Foto do Usuário</Label>
                <div className="flex items-center space-x-4">
                  {fotoPreview ? (
                    <div className="relative">
                      <img 
                        src={fotoPreview} 
                        alt="Preview da foto" 
                        className="w-20 h-20 rounded-full object-cover border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6"
                        onClick={removeFoto}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <label
                      htmlFor="foto"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleFotoDrop}
                    >
                      {/* Ícone de upload padrão */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2M7 9l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      <span className="text-sm text-gray-500 text-center w-full">Clique para selecionar ou arraste uma imagem aqui</span>
                      <span className="text-xs text-gray-400">PNG, JPG, GIF até 5MB</span>
                      <input
                        ref={fileInputRef}
                        id="foto"
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        value={formData.senha}
                        onChange={(e) => handleInputChange("senha", e.target.value)}
                        placeholder="Digite a senha"
                        required
                        className={senhaErro ? "border-red-500 focus:border-red-500" : ""}
                        aria-invalid={senhaErro}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha <span className="text-red-500">*</span></Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                      placeholder="Confirme a senha"
                      required
                      className={senhaErro ? "border-red-500 focus:border-red-500" : ""}
                      aria-invalid={senhaErro}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Função *</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcoes.map((funcao) => (
                        <SelectItem key={funcao.id} value={funcao.nome}>{funcao.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Permissões */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Permissões do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissoesDisponiveis.map((permissao) => (
                  <div key={permissao.id} className="flex items-start space-x-3 p-3 border rounded-lg transition-colors hover:bg-blue-50 focus-within:bg-blue-100">
                    <Checkbox
                      id={permissao.id}
                      checked={Array.isArray(formData.permissoes) && formData.permissoes.includes(permissao.id)}
                      onCheckedChange={(checked) => handlePermissaoChange(permissao.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={permissao.id} className="font-medium cursor-pointer">
                        {permissao.label}
                      </Label>
                      <p className="text-sm text-gray-500">{permissao.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
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
                  {isEditing ? "Atualizar" : "Criar"} Usuário
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}