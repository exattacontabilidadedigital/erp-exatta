"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, User, Shield, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UsuariosModalProps {
  isOpen: boolean
  onClose: () => void
  usuario?: any
  isEditing: boolean
}

export function UsuariosModal({ isOpen, onClose, usuario, isEditing }: UsuariosModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    role: "",
    status: "ativo",
    permissoes: [] as string[],
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
        status: usuario.status || "ativo",
        permissoes: usuario.permissoes || [],
      })
    } else {
      setFormData({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
        role: "",
        status: "ativo",
        permissoes: [],
      })
    }
  }, [isEditing, usuario, isOpen])

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleChange = (role: string) => {
    const permissoes = rolesPermissoes[role as keyof typeof rolesPermissoes] || []
    setFormData((prev) => ({ ...prev, role, permissoes }))
  }

  const handlePermissaoChange = (permissaoId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissoes: checked ? [...prev.permissoes, permissaoId] : prev.permissoes.filter((p) => p !== permissaoId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!isEditing && formData.senha !== formData.confirmarSenha) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem.",
          variant: "destructive",
        })
        return
      }

      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Sucesso!",
        description: `Usuário ${isEditing ? "atualizado" : "criado"} com sucesso.`,
      })

      onClose()
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="email@empresa.com"
                    required
                  />
                </div>
              </div>

              {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        value={formData.senha}
                        onChange={(e) => handleInputChange("senha", e.target.value)}
                        placeholder="Digite a senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                      placeholder="Confirme a senha"
                      required
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
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="contador">Contador</SelectItem>
                      <SelectItem value="usuario">Usuário</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
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
                  <div key={permissao.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={permissao.id}
                      checked={formData.permissoes.includes(permissao.id)}
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
