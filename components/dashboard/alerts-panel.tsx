import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info, CheckCircle } from "lucide-react"

export function AlertsPanel() {
  const alerts = [
    {
      type: "warning" as const,
      title: "Saldo Baixo",
      message: "Conta Corrente Banco do Brasil com saldo abaixo de R$ 5.000",
      icon: AlertTriangle,
    },
    {
      type: "info" as const,
      title: "Vencimento Próximo",
      message: "3 boletos vencem nos próximos 5 dias",
      icon: Info,
    },
    {
      type: "success" as const,
      title: "Meta Atingida",
      message: "Receitas do mês superaram a meta em 8%",
      icon: CheckCircle,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            className={`
            ${alert.type === "warning" ? "border-yellow-200 bg-yellow-50" : ""}
            ${alert.type === "info" ? "border-blue-200 bg-blue-50" : ""}
            ${alert.type === "success" ? "border-green-200 bg-green-50" : ""}
          `}
          >
            <alert.icon
              className={`h-4 w-4 ${
                alert.type === "warning" ? "text-yellow-600" : ""
              }${alert.type === "info" ? "text-blue-600" : ""}${alert.type === "success" ? "text-green-600" : ""}`}
            />
            <AlertDescription>
              <div className="font-medium text-sm">{alert.title}</div>
              <div className="text-xs text-gray-600 mt-1">{alert.message}</div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
