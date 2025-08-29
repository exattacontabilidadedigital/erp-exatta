"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/contexts/toast-context"
import { Calculator, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.company || !formData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("[Cadastro] Iniciando processo de cadastro...")
      const { data: existingCompany, error: existingCompanyError } = await supabase
        .from("empresas")
        .select("id, razao_social")
        .eq("razao_social", formData.company)
        .single()
      console.log("[Cadastro] Empresa existente:", existingCompany, "Erro:", existingCompanyError)

      let empresaId: string
      let isExistingCompany = false

      if (existingCompany) {
        isExistingCompany = true
        empresaId = existingCompany.id
        toast({
          title: "Empresa encontrada!",
          description: `A empresa "${formData.company}" já existe em nosso sistema. Você será associado a ela.`,
        })
      } else {
        // Gera um valor temporário para CNPJ com no máximo 18 caracteres
        const tempCnpj = `TEMP${Date.now()}`.slice(0, 18)
        console.log("[Cadastro] Criando nova empresa...")
        const { data: empresaData, error: empresaError } = await supabase
          .from("empresas")
          .insert({
            razao_social: formData.company,
            nome_fantasia: formData.company,
            cnpj: tempCnpj,
            email: formData.email,
            telefone: formData.phone,
            ativo: true,
          })
          .select()
          .single()
        console.log("[Cadastro] Empresa criada:", empresaData, "Erro:", empresaError)
        if (empresaError) {
          throw empresaError
        }
        empresaId = empresaData.id
      }

      console.log("[Cadastro] Criando usuário no Auth...")
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company: formData.company,
            phone: formData.phone,
          },
        },
      })
      console.log("[Cadastro] Usuário Auth:", authData, "Erro:", authError)
      if (authError) {
        throw authError
      }
      if (!authData.user) {
        throw new Error("Falha ao criar usuário")
      }

      console.log("[Cadastro] Inserindo usuário na tabela usuarios...")
      const { error: userError } = await supabase.from("usuarios").insert({
        id: authData.user.id,
        empresa_id: empresaId,
        nome: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        telefone: formData.phone,
        cargo: isExistingCompany ? "Usuário" : "Administrador",
        role: isExistingCompany ? "usuario" : "admin",
        permissoes: isExistingCompany
          ? {
              dashboard: true,
              lancamentos: true,
              contas: false,
              plano_contas: false,
              centro_custos: false,
              fluxo_caixa: true,
              relatorios: true,
              cadastros: false,
              configuracoes: false,
            }
          : {
              dashboard: true,
              lancamentos: true,
              contas: true,
              plano_contas: true,
              centro_custos: true,
              fluxo_caixa: true,
              relatorios: true,
              cadastros: true,
              configuracoes: true,
            },
        ativo: true,
      })
      console.log("[Cadastro] Usuário inserido na tabela usuarios. Erro:", userError)
      if (userError) {
        throw userError
      }

      toast({
        title: "Conta criada com sucesso!",
        description: isExistingCompany
          ? `Você foi associado à empresa "${formData.company}" como usuário. Verifique seu email para confirmar sua conta.`
          : `Nova empresa "${formData.company}" criada! Você é o administrador. Verifique seu email para confirmar sua conta.`,
      })

      // Redirecionar para página de confirmação ou login
      router.push("/login?message=Verifique seu email para confirmar sua conta")
    } catch (error: any) {
      console.error("[Cadastro] Erro ao criar conta:", error)

      let errorMessage = "Ocorreu um erro inesperado. Tente novamente."

      if (error.message?.includes("duplicate key value violates unique constraint")) {
        if (error.message.includes("usuarios_email_key")) {
          errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email."
        } else if (error.message.includes("empresas_cnpj_key")) {
          errorMessage = "Esta empresa já está cadastrada no sistema."
        }
      } else if (error.message?.includes("check constraint")) {
        if (error.message.includes("usuarios_role_check")) {
          errorMessage = "Erro interno: tipo de usuário inválido. Entre em contato com o suporte."
        }
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login."
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Email inválido. Verifique o formato do email."
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres."
      }

      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center text-green-700 hover:text-green-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calculator className="h-8 w-8 text-green-700" />
            <span className="text-2xl font-bold text-gray-900">ContábilPro</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar sua conta</h1>
          <p className="text-gray-600 mt-2">Comece seu teste gratuito de 30 dias</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Cadastro Gratuito</CardTitle>
            <CardDescription className="text-center">Preencha os dados abaixo para criar sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    placeholder="João"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Silva"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@empresa.com"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Nome da Empresa</Label>
                <Input
                  id="company"
                  placeholder="Minha Empresa Ltda"
                  required
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta Gratuita"}
              </Button>
            </form>

            <div className="text-xs text-gray-500 text-center">
              Ao criar uma conta, você concorda com nossos{" "}
              <Link href="#" className="text-green-700 hover:underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link href="#" className="text-green-700 hover:underline">
                Política de Privacidade
              </Link>
            </div>

            <Separator />

            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link href="/login" className="text-green-700 hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>✓ Teste gratuito por 30 dias</p>
          <p>✓ Sem cartão de crédito necessário</p>
          <p>✓ Cancele quando quiser</p>
        </div>
      </div>
    </div>
  )
}
