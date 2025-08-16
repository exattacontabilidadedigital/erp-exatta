import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, TrendingDown, TrendingUp, Wallet } from "lucide-react"

export function PlanoContasResumo() {
  const resumoData = [
    {
      title: "Total de Contas",
      value: "156",
      description: "Contas cadastradas",
      icon: Building,
      color: "text-blue-600",
    },
    {
      title: "Contas Ativas",
      value: "142",
      description: "Em uso no sistema",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Contas Inativas",
      value: "14",
      description: "Não utilizadas",
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      title: "Grupos Principais",
      value: "5",
      description: "Ativo, Passivo, PL, Receita, Despesa",
      icon: Wallet,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {resumoData.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
