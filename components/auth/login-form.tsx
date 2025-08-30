"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/contexts/toast-context"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const router = useRouter()
  const { toast } = useToast()

  // Carregar email salvo quando a página carregar
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    const rememberMe = localStorage.getItem('rememberMe')
    
    if (rememberedEmail && rememberMe === 'true') {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validações básicas
    if (!formData.email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Digite seu email para continuar.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!formData.password.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Digite sua senha para continuar.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Formato de email inválido",
        description: "Digite um email válido (exemplo: usuario@empresa.com).",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      console.log("Tentando fazer login com:", formData.email)

      // Timeout para evitar travamento
      const loginPromise = supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Login demorou muito para responder')), 10000)
      )

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any

      console.log("Resposta do Supabase Auth:", { data, error })
      console.log("User:", data?.user)
      console.log("Session:", data?.session)

      if (error) {
        console.error("Erro de autenticação:", error)
        
        // Tratamento específico para diferentes tipos de erro
        let errorTitle = "Erro ao fazer login"
        let errorDescription = error.message
        
        // Verificar se é erro de credenciais inválidas
        if (error.message.includes("Invalid login credentials") || 
            error.message.includes("AuthApiError") ||
            (error as any).status === 400) {
          errorTitle = "Credenciais inválidas"
          errorDescription = "Email ou senha incorretos. Verifique se:\n• O email está correto\n• A senha está correta\n• O Caps Lock não está ativado"
          console.log("Erro de credenciais detectado - exibindo mensagem amigável")
        } else if (error.message.includes("Email not confirmed")) {
          errorTitle = "Email não confirmado"
          errorDescription = "Por favor, confirme seu email antes de fazer login."
        } else if (error.message.includes("Too many requests")) {
          errorTitle = "Muitas tentativas"
          errorDescription = "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
        } else if (error.message.includes("User not found")) {
          errorTitle = "Usuário não encontrado"
          errorDescription = "Não encontramos uma conta com este email. Verifique o email ou cadastre-se."
        } else if (error.message.includes("Invalid email")) {
          errorTitle = "Email inválido"
          errorDescription = "O formato do email está incorreto. Verifique e tente novamente."
        } else if (error.message.includes("Password")) {
          errorTitle = "Senha incorreta"
          errorDescription = "A senha informada está incorreta. Verifique e tente novamente."
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (data.user) {
        console.log("Usuário autenticado:", data.user.id)
        
        // Implementar "Lembrar de mim"
        if (formData.rememberMe) {
          // Salvar preferência no localStorage
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('rememberedEmail', formData.email)
        } else {
          // Limpar preferências se não marcado
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('rememberedEmail')
        }

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o sistema...",
          variant: "success",
        })
        
        // Pequeno delay para mostrar o toast
        setTimeout(() => {
          console.log("Redirecionando para dashboard...")
          router.push("/")
        }, 1000)
      } else {
        // Se não há usuário na resposta
        toast({
          title: "Erro de autenticação",
          description: "Resposta inválida do servidor.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("Erro inesperado ao fazer login:", error)
      
      let errorTitle = "Erro inesperado"
      let errorDescription = "Falha ao fazer login. Tente novamente."
      
      if (error.message.includes("Timeout")) {
        errorTitle = "Timeout de conexão"
        errorDescription = "A conexão demorou muito para responder. Verifique sua internet e tente novamente."
      } else if (error.message.includes("Network")) {
        errorTitle = "Erro de conexão"
        errorDescription = "Problema de conexão com o servidor. Verifique sua internet e tente novamente."
      } else if (error.message.includes("fetch")) {
        errorTitle = "Erro de rede"
        errorDescription = "Não foi possível conectar ao servidor. Verifique sua conexão."
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
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
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center text-gray-900">Entrar</CardTitle>
        <p className="text-sm text-gray-600 text-center">Digite suas credenciais para acessar o sistema</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                onCheckedChange={(checked: boolean) => handleInputChange("rememberMe", checked)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Lembrar de mim
              </Label>
            </div>
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              Esqueceu a senha?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="text-blue-600 hover:text-blue-500 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
