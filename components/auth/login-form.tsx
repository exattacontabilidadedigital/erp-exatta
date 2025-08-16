"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Tentando fazer login com:", formData.email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      console.log("Resposta do Supabase Auth:", { data, error })

      if (error) {
        console.error("Erro de autenticação:", error)
        toast.error("Erro ao fazer login: " + error.message)
        return
      }

      if (data.user) {
        console.log("Usuário autenticado:", data.user.id)

        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("id, nome, email, empresa_id, role, ativo")
          .eq("id", data.user.id)
          .single()

        console.log("Dados do usuário na tabela:", { userData, userError })

        if (userError) {
          console.error("Erro ao buscar usuário:", userError)
          toast.error("Usuário não encontrado na base de dados. Entre em contato com o suporte.")
          return
        }

        if (!userData) {
          toast.error("Dados do usuário não encontrados")
          return
        }

        if (!userData.ativo) {
          toast.error("Usuário inativo. Entre em contato com o administrador.")
          return
        }

        console.log("Buscando empresa:", userData.empresa_id)

        const { data: empresaData, error: empresaError } = await supabase
          .from("empresas")
          .select("id, razao_social, nome_fantasia, ativo")
          .eq("id", userData.empresa_id)
          .single()

        console.log("Dados da empresa:", { empresaData, empresaError })

        if (empresaError) {
          console.error("Erro ao buscar empresa:", empresaError)
          toast.error("Erro ao carregar dados da empresa")
          return
        }

        if (!empresaData) {
          toast.error("Empresa não encontrada")
          return
        }

        if (!empresaData.ativo) {
          toast.error("Empresa inativa. Entre em contato com o suporte.")
          return
        }

        toast.success(`Bem-vindo, ${userData.nome}! Acessando ${empresaData.nome_fantasia || empresaData.razao_social}`)

        console.log("Redirecionando para dashboard...")
        router.push("/")
      }
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast.error("Erro inesperado ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Entrar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-gray-600">
                Lembrar de mim
              </Label>
            </div>

            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              Esqueci minha senha
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="text-blue-600 hover:text-blue-500">
              Cadastre-se
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
