"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface UserData {
  id: string
  nome: string
  email: string
  telefone: string | null
  cargo: string | null
  role: string
  foto_url: string | null
  empresa_id: string
  permissoes: any
  ativo: boolean
}

interface EmpresaData {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  inscricao_estadual: string | null
  inscricao_municipal: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  telefone: string | null
  email: string | null
  site: string | null
  logo_url: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  pix: string | null
  regime_tributario: string | null
  observacoes: string | null
  ativo: boolean
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  empresaData: EmpresaData | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  const loadUserData = useCallback(
    async (userId: string) => {
      // Evitar carregar dados se já foram carregados para este usuário
      if (dataLoaded && userData?.id === userId) {
        return
      }

      try {
        setLoading(true)
        console.log("Carregando dados do usuário:", userId)

        // Buscar dados do usuário
        const { data: user, error: userError } = await supabase.from("usuarios").select("*").eq("id", userId).single()

        if (userError || !user) {
          console.error("Erro ao buscar usuário:", userError)
          setUserData(null)
          setEmpresaData(null)
          setLoading(false)
          return
        }

        console.log("Dados do usuário carregados:", user)
        setUserData(user)

        // Buscar dados da empresa
        const { data: empresa, error: empresaError } = await supabase
          .from("empresas")
          .select("*")
          .eq("id", user.empresa_id)
          .single()

        if (empresaError || !empresa) {
          console.error("Erro ao buscar empresa:", empresaError)
          setEmpresaData(null)
          setLoading(false)
          return
        }

        console.log("Dados da empresa carregados:", empresa)
        setEmpresaData(empresa)
        setDataLoaded(true)
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error)
        setUserData(null)
        setEmpresaData(null)
      } finally {
        setLoading(false)
      }
    },
    [dataLoaded, userData?.id, supabase],
  )

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserData(session.user.id)
      } else {
        setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        // Reset dataLoaded when user changes
        setDataLoaded(false)
        await loadUserData(session.user.id)
      } else {
        setUserData(null)
        setEmpresaData(null)
        setDataLoaded(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // Array de dependências vazio para executar apenas uma vez

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserData(null)
    setEmpresaData(null)
    setDataLoaded(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        empresaData,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
