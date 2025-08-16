import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, DollarSign, TrendingUp } from "lucide-react"

export function FinancialSummary() {
  const summaryData = [
    {
      title: "Saldo Total",
      value: "R$ 125.430,50",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Receitas do Mês",
      value: "R$ 45.230,00",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: ArrowUp,
    },
    {
      title: "Despesas do Mês",
      value: "R$ 32.180,00",
      change: "-3.1%",
      changeType: "negative" as const,
      icon: ArrowDown,
    },
    {
      title: "Lucro Líquido",
      value: "R$ 13.050,00",
      change: "+15.3%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryData.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <p
              className={`text-xs flex items-center mt-1 ${
                item.changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}
            >
              {item.changeType === "positive" ? (
                <ArrowUp className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 mr-1" />
              )}
              {item.change} em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
