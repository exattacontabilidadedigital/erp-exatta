import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, DollarSign, TrendingDown, TrendingUp, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

export function CentroCustosResumo() {
  const { userData } = useAuth()
  const [resumo, setResumo] = useState({
    totalCentros: 0,
    totalMensal: 0,
    centroMaisCustoso: { nome: "-", valor: 0 },
    centroMenosCustoso: { nome: "-", valor: 0 },
    mediaMensal: 0,
    centrosComOrcamento: 0,
  })
  useEffect(() => {
    async function fetchResumo() {
      if (!userData?.empresa_id) return
      
      const { data, error } = await supabase
        .from("centro_custos")
        .select("id, nome, orcamento_mensal, ativo")
        .eq("empresa_id", userData.empresa_id)
        .eq("ativo", true) // Apenas centros ativos
      
      if (error || !data) {
        console.error('Erro ao buscar resumo:', error)
        return
      }
      
      const totalCentros = data.length
      
      // Filtra apenas centros com orçamento válido (> 0) para cálculos
      const centrosComOrcamento = data.filter(c => c.orcamento_mensal && c.orcamento_mensal > 0)
      
      const totalMensal = data.reduce((acc, c) => acc + (c.orcamento_mensal || 0), 0)
      
      if (centrosComOrcamento.length > 0) {
        // Ordena por orçamento para encontrar maior e menor
        const ordenados = centrosComOrcamento.sort((a, b) => (b.orcamento_mensal || 0) - (a.orcamento_mensal || 0))
        const mais = ordenados[0] // Maior orçamento
        const menos = ordenados[ordenados.length - 1] // Menor orçamento
        const mediaMensal = totalMensal / centrosComOrcamento.length
        
        setResumo({
          totalCentros,
          totalMensal,
          centroMaisCustoso: { nome: mais.nome, valor: mais.orcamento_mensal || 0 },
          centroMenosCustoso: { nome: menos.nome, valor: menos.orcamento_mensal || 0 },
          mediaMensal,
          centrosComOrcamento: centrosComOrcamento.length,
        });
      } else {
        setResumo({ 
          totalCentros, 
          totalMensal, 
          centroMaisCustoso: { nome: "Nenhum centro com orçamento", valor: 0 }, 
          centroMenosCustoso: { nome: "Nenhum centro com orçamento", valor: 0 },
          mediaMensal: 0,
          centrosComOrcamento: 0,
        });
      }
    }
    
    fetchResumo()
    
    // Escuta eventos de atualização
    const handleUpdate = () => {
      fetchResumo()
    }
    
    if (typeof window !== "undefined") {
      window.addEventListener("centroCustosAtualizado", handleUpdate)
      return () => window.removeEventListener("centroCustosAtualizado", handleUpdate)
    }
  }, [userData?.empresa_id])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total de Centros</CardTitle>
          <Building2 className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{resumo.totalCentros}</div>
          <p className="text-xs text-gray-500 mt-1">
            {resumo.centrosComOrcamento} com orçamento
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Orçamento Total</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            R$ {resumo.totalMensal.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1">Mensal</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Média por Centro</CardTitle>
          <BarChart3 className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            R$ {resumo.mediaMensal.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1">Orçamento médio</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Maior Orçamento</CardTitle>
          <TrendingUp className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            R$ {resumo.centroMaisCustoso.valor.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </div>
          <p className="text-xs mt-1 text-gray-500 truncate" title={resumo.centroMaisCustoso.nome}>
            {resumo.centroMaisCustoso.nome}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Menor Orçamento</CardTitle>
          <TrendingDown className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            R$ {resumo.centroMenosCustoso.valor.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </div>
          <p className="text-xs mt-1 text-gray-500 truncate" title={resumo.centroMenosCustoso.nome}>
            {resumo.centroMenosCustoso.nome}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
