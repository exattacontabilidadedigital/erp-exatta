import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from "lucide-react"

const transactions = [
  {
    id: "001",
    type: "receita",
    description: "Venda de Produtos - NF 12345",
    client: "Empresa ABC Ltda",
    value: 15000,
    date: "2024-01-15",
    status: "liquidado",
    account: "Conta Corrente BB",
  },
  {
    id: "002",
    type: "despesa",
    description: "Pagamento Fornecedor - Boleto 67890",
    client: "Fornecedor XYZ",
    value: 8500,
    date: "2024-01-14",
    status: "liquidado",
    account: "Conta Corrente Itaú",
  },
  {
    id: "003",
    type: "transferencia",
    description: "Transferência entre contas",
    client: "Interno",
    value: 5000,
    date: "2024-01-13",
    status: "pendente",
    account: "BB → Itaú",
  },
  {
    id: "004",
    type: "receita",
    description: "Recebimento Cliente - PIX",
    client: "Cliente DEF",
    value: 3200,
    date: "2024-01-12",
    status: "liquidado",
    account: "Conta Corrente BB",
  },
]

export function RecentTransactions() {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "receita":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case "despesa":
        return <ArrowDownLeft className="w-4 h-4 text-red-600" />
      case "transferencia":
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "liquidado":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Liquidado
          </Badge>
        )
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transações Recentes</CardTitle>
        <Button variant="outline" size="sm">
          Ver Todas
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">{getTransactionIcon(transaction.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.client} • {transaction.account}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(transaction.date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      transaction.type === "receita"
                        ? "text-green-600"
                        : transaction.type === "despesa"
                          ? "text-red-600"
                          : "text-blue-600"
                    }`}
                  >
                    {transaction.type === "despesa" ? "-" : "+"}R$ {transaction.value.toLocaleString()}
                  </p>
                </div>
                {getStatusBadge(transaction.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
