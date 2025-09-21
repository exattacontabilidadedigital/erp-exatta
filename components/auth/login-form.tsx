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
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
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

  // Carregar dados salvos do "Lembrar de mim"
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe')
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    
    if (rememberMe === 'true' && rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }))
    }
  }, [])

  // Função para verificar conectividade (simplificada)
  const checkConnectivity = async (): Promise<boolean> => {
    // Verificar se está online
    if (!navigator.onLine) {
      console.log("❌ Navigator indica que está offline")
      toast({
        title: "Sem conexão com a internet",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
      return false
    }

    console.log("✅ Navigator indica que está online")
    return true
  }

  // Função para realizar login com retry
  const attemptLogin = async (email: string, password: string, retryCount = 0): Promise<any> => {
    const maxRetries = 2
    const backoffDelay = Math.pow(2, retryCount) * 1000 // 1s, 2s

    try {
      console.log(`🔄 Tentativa de login ${retryCount + 1}/${maxRetries + 1} para:`, email)
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log(`✅ Resposta recebida do Supabase na tentativa ${retryCount + 1}`)
      return result
    } catch (error: any) {
      // Verificar se é um erro de rede e tentar novamente
      if ((error.message.includes('NetworkError') || 
           error.message.includes('Failed to fetch') ||
           error.code === 'NETWORK_ERROR') && retryCount < maxRetries) {
        console.log(`⚠️ Erro de rede detectado. Tentando novamente em ${backoffDelay}ms...`)
        
        // Mostrar feedback melhorado ao usuário sobre a tentativa
        toast({
          title: `Tentativa ${retryCount + 2}/${maxRetries + 1}`,
          description: `Problema de conexão detectado. Tentando novamente em ${backoffDelay/1000}s...`,
          variant: "default",
        })
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
        return attemptLogin(email, password, retryCount + 1)
      }
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Timeout de segurança absoluto para evitar loading infinito
    const safetyTimeout = setTimeout(() => {
      console.log("🚨 Timeout de segurança ativado - forçando desativação do loading")
      setIsLoading(false)
      toast({
        title: "Timeout de segurança",
        description: "A operação demorou muito. Tente novamente.",
        variant: "destructive",
      })
    }, 30000)

    try {
      // Verificar se o Supabase está configurado
      if (!isSupabaseConfigured) {
        console.log("❌ Supabase não está configurado")
        toast({
          title: "Erro de configuração",
          description: "Sistema não está configurado corretamente. Entre em contato com o suporte.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Supabase configurado")
      
      // Validações básicas
      if (!formData.email.trim()) {
        toast({
          title: "Email obrigatório",
          description: "Digite seu email para continuar.",
          variant: "destructive",
        })
        return
      }

      if (!formData.password.trim()) {
        toast({
          title: "Senha obrigatória",
          description: "Digite sua senha para continuar.",
          variant: "destructive",
        })
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
        return
      }

      console.log("✅ Validações básicas concluídas")
      console.log("📡 Verificando conectividade...")
      
      // Verificar conectividade antes de tentar login
      const isConnected = await checkConnectivity()
      if (!isConnected) {
        console.log("❌ Falha na verificação de conectividade")
        return
      }

      console.log("✅ Conectividade verificada")
      console.log("🚀 Iniciando processo de login para:", formData.email)

      const { data, error } = await attemptLogin(formData.email, formData.password)

      console.log("📋 Resposta do Supabase Auth:", { data, error })
      console.log("👤 User:", data?.user)
      console.log("🔐 Session:", data?.session)

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
      }
    } catch (error: any) {
      console.error("Erro inesperado ao fazer login:", error)
      
      let errorTitle = "Erro inesperado"
      let errorDescription = "Falha ao fazer login. Tente novamente."
      
      if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch") || error.message.includes("404")) {
        errorTitle = "Serviço indisponível"
        errorDescription = "O servidor de autenticação está temporariamente indisponível. Possíveis causas:\n\n🔧 Manutenção do servidor\n🌐 Problema de conectividade\n⚙️ Configuração do sistema\n\nTente novamente em alguns minutos ou entre em contato com o suporte."
      } else if (error.message.includes("Network")) {
        errorTitle = "Erro de conexão"
        errorDescription = "Problema de conexão com o servidor. Verifique:\n• Sua conexão com a internet\n• Se o servidor está funcionando\n• Tente novamente em alguns momentos"
      } else if (error.message.includes("fetch")) {
        errorTitle = "Erro de rede"
        errorDescription = "Não foi possível conectar ao servidor. Verifique:\n• Sua conexão com a internet\n• Se não há bloqueios de firewall\n• Tente recarregar a página"
      } else if (error.name === "AbortError") {
        errorTitle = "Operação cancelada"
        errorDescription = "A operação foi cancelada. Tente fazer login novamente."
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      // Limpar o timeout de segurança
      clearTimeout(safetyTimeout)
      // Garantir que o loading sempre seja desativado
      console.log("🔄 Finalizando processo de login - desativando loading")
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