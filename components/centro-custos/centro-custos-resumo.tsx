import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, DollarSign, TrendingDown, TrendingUp } from "lucide-react"
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
  })
  useEffect(() => {
    async function fetchResumo() {
      if (!userData?.empresa_id) return
      const { data, error } = await supabase
        .from("centro_custos")
        .select("id, nome, orcamento_mensal")
        .eq("empresa_id", userData.empresa_id)
      if (error || !data) return
      const totalCentros = data.length
      const totalMensal = data.reduce((acc, c) => acc + (c.orcamento_mensal || 0), 0)
      if (data.length > 0) {
        const mais = data.reduce((a, b) => (b.orcamento_mensal > a.orcamento_mensal ? b : a));
        const menos = data.reduce((a, b) => (b.orcamento_mensal < a.orcamento_mensal ? b : a));
        setResumo({
          totalCentros,
          totalMensal,
          centroMaisCustoso: { nome: mais.nome, valor: mais.orcamento_mensal },
          centroMenosCustoso: { nome: menos.nome, valor: menos.orcamento_mensal },
        });
      } else {
        setResumo({ totalCentros, totalMensal, centroMaisCustoso: { nome: "-", valor: 0 }, centroMenosCustoso: { nome: "-", valor: 0 } });
      }
    }
    fetchResumo()
  }, [userData?.empresa_id])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total de Centros</CardTitle>
          <Building2 className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{resumo.totalCentros}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Custo Total Mensal</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">R$ {(resumo.totalMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Centro Mais Custoso</CardTitle>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">R$ {(resumo.centroMaisCustoso.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs mt-1 text-gray-500">{resumo.centroMaisCustoso.nome}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Centro Menos Custoso</CardTitle>
          <TrendingDown className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">R$ {(resumo.centroMenosCustoso.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs mt-1 text-gray-500">{resumo.centroMenosCustoso.nome}</p>
        </CardContent>
      </Card>
    </div>
  )
}
