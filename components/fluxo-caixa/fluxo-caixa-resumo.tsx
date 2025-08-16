import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, DollarSign, TrendingUp } from "lucide-react"

export function FluxoCaixaResumo() {
  const resumoData = [
    {
      title: "Saldo Atual",
      value: "R$ 125.430,50",
      change: "+2.5% hoje",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Entradas Previstas",
      value: "R$ 85.200,00",
      change: "Próximos 30 dias",
      changeType: "positive" as const,
      icon: ArrowUp,
    },
    {
      title: "Saídas Previstas",
      value: "R$ 67.800,00",
      change: "Próximos 30 dias",
      changeType: "negative" as const,
      icon: ArrowDown,
    },
    {
      title: "Saldo Projetado",
      value: "R$ 142.830,50",
      change: "+13.9% em 30 dias",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {resumoData.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <p
              className={`text-xs mt-1 ${
                item.changeType === "positive"
                  ? "text-green-600"
                  : item.changeType === "negative"
                    ? "text-red-600"
                    : "text-gray-500"
              }`}
            >
              {item.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
