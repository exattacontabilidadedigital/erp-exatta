import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Clock, TrendingDown, DollarSign } from "lucide-react"

export function FluxoCaixaAlertas() {
  const alertas = [
    {
      type: "warning" as const,
      title: "Saldo Baixo Previsto",
      message: "Saldo pode ficar abaixo de R$ 10.000 em 15 dias",
      icon: TrendingDown,
    },
    {
      type: "info" as const,
      title: "Vencimentos Próximos",
      message: "R$ 25.000 em pagamentos vencem em 5 dias",
      icon: Clock,
    },
    {
      type: "warning" as const,
      title: "Meta de Caixa",
      message: "Saldo atual 15% abaixo da meta mensal",
      icon: DollarSign,
    },
    {
      type: "error" as const,
      title: "Conta Crítica",
      message: "Banco do Brasil com saldo negativo projetado",
      icon: AlertTriangle,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertas.map((alerta, index) => (
          <Alert
            key={index}
            className={`
            ${alerta.type === "warning" ? "border-yellow-200 bg-yellow-50" : ""}
            ${alerta.type === "info" ? "border-blue-200 bg-blue-50" : ""}
            ${alerta.type === "error" ? "border-red-200 bg-red-50" : ""}
          `}
          >
            <alerta.icon
              className={`h-4 w-4 ${
                alerta.type === "warning" ? "text-yellow-600" : ""
              }${alerta.type === "info" ? "text-blue-600" : ""}${alerta.type === "error" ? "text-red-600" : ""}`}
            />
            <AlertDescription>
              <div className="font-medium text-sm">{alerta.title}</div>
              <div className="text-xs text-gray-600 mt-1">{alerta.message}</div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
