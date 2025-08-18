"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface ContaResumo {
  totalContas: number
  contasAtivas: number
  contasInativas: number
  gruposPrincipais: number
}

interface PlanoContasResumoProps {
  refresh?: number
  onCardClick?: (filtro: string) => void
  filtroAtivo?: string
}

export function PlanoContasResumo({ refresh, onCardClick, filtroAtivo }: PlanoContasResumoProps) {
  const [resumo, setResumo] = useState<ContaResumo>({
    totalContas: 0,
    contasAtivas: 0,
    contasInativas: 0,
    gruposPrincipais: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResumo() {
      try {
        setLoading(true)
        
        // Busca todas as contas
        const { data: contas, error } = await supabase
          .from('plano_contas')
          .select('ativo, nivel, tipo')

        if (error) {
          console.error('Erro ao buscar resumo:', error)
          return
        }

        if (contas) {
          // Calcula total de contas
          const totalContas = contas.length

          // Calcula contas ativas e inativas
          const contasAtivas = contas.filter(conta => conta.ativo === true).length
          const contasInativas = contas.filter(conta => conta.ativo === false).length

          // Calcula grupos principais (nível 1 - grupos principais)
          const gruposPrincipais = contas.filter(conta => parseInt(conta.nivel) === 1).length

          setResumo({
            totalContas,
            contasAtivas,
            contasInativas,
            gruposPrincipais
          })
        }
      } catch (error) {
        console.error('Erro ao calcular resumo:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResumo()
  }, [refresh])

  const resumoData = [
    {
      title: "Total de Contas",
      value: loading ? "..." : resumo.totalContas.toString(),
      description: "Contas cadastradas",
      icon: Building,
      color: "text-blue-600",
      filtro: "todas",
    },
    {
      title: "Contas Ativas",
      value: loading ? "..." : resumo.contasAtivas.toString(),
      description: "Em uso no sistema",
      icon: TrendingUp,
      color: "text-green-600",
      filtro: "ativas",
    },
    {
      title: "Contas Inativas",
      value: loading ? "..." : resumo.contasInativas.toString(),
      description: "Não utilizadas",
      icon: TrendingDown,
      color: "text-red-600",
      filtro: "inativas",
    },
    {
      title: "Grupos Principais",
      value: loading ? "..." : resumo.gruposPrincipais.toString(),
      description: "Nível 1 - Grupos base",
      icon: Wallet,
      color: "text-purple-600",
      filtro: "grupos",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {resumoData.map((item, index) => (
        <Card 
          key={index}
          className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
            filtroAtivo === item.filtro 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onCardClick?.(filtroAtivo === item.filtro ? '' : item.filtro)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <p className="text-xs text-gray-500 mt-1">
              {item.description}
              {filtroAtivo === item.filtro && (
                <span className="ml-2 text-blue-600 font-medium">(Filtro ativo)</span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
